import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpeechSessionStatus } from '@shared/enums/domain.enums';
import { SPEECH_PROVIDER, SpeechProvider } from '../providers/speech-provider.interface';
import { SpeechErrors } from '../errors/speech.errors';
import { AppException } from '@core/exceptions/app.exception';
import { AnswerRepository } from '@modules/answer/repositories/answer.repository';
import { QuestionRepository } from '@modules/question/repositories/question.repository';
import { StorageService } from '@modules/storage/services/storage.service';
import { Types } from 'mongoose';

const MAX_SESSION_DURATION_MS = 10 * 60 * 1000;
const MAX_CHUNKS_PER_SESSION = 500;

export interface SpeechSession {
  id: string;
  interviewId: string;
  questionId: string;
  userId: string;
  chunks: Buffer[];
  status: SpeechSessionStatus;
  transcript: string;
  startedAt: Date;
  audioUrl: string | null;
}

interface StartSessionInput {
  interviewId: string;
  questionId: string;
  userId: string;
}

@Injectable()
export class SpeechService {
  private readonly _logger = new Logger(SpeechService.name);
  private readonly _sessions = new Map<string, SpeechSession>();

  constructor(
    @Inject(SPEECH_PROVIDER) private readonly _speechProvider: SpeechProvider,
    private readonly _storageService: StorageService,
    private readonly _answerRepository: AnswerRepository,
    private readonly _questionRepository: QuestionRepository,
    private readonly _config: ConfigService,
  ) {}

  async startSession(input: StartSessionInput): Promise<SpeechSession> {
    if (!this._speechProvider.isAvailable()) {
      AppException.throw(SpeechErrors.PROVIDER_UNAVAILABLE);
    }

    const existing = this._findActiveByQuestion(input.questionId);
    if (existing) {
      AppException.throw(SpeechErrors.SESSION_ALREADY_ACTIVE, { questionId: input.questionId });
    }

    const sessionId = `speech-${input.questionId}-${Date.now()}`;
    const session: SpeechSession = {
      id: sessionId,
      interviewId: input.interviewId,
      questionId: input.questionId,
      userId: input.userId,
      chunks: [],
      status: SpeechSessionStatus.ACTIVE,
      transcript: '',
      startedAt: new Date(),
      audioUrl: null,
    };

    this._sessions.set(sessionId, session);
    this._logger.log(`[startSession] Session created: ${sessionId}`);
    return session;
  }

  receiveChunk(sessionId: string, chunkBase64: string): void {
    const session = this._requireSession(sessionId);

    if (session.status !== SpeechSessionStatus.ACTIVE) {
      AppException.throw(SpeechErrors.INVALID_SESSION_STATE, {
        sessionId,
        status: session.status,
      });
    }

    if (session.chunks.length >= MAX_CHUNKS_PER_SESSION) {
      AppException.throw(SpeechErrors.SESSION_EXPIRED, { sessionId });
    }

    if (Date.now() - session.startedAt.getTime() > MAX_SESSION_DURATION_MS) {
      session.status = SpeechSessionStatus.FAILED;
      AppException.throw(SpeechErrors.SESSION_EXPIRED, { sessionId });
    }

    const buffer = Buffer.from(chunkBase64, 'base64');
    session.chunks.push(buffer);
  }

  async finishSession(sessionId: string): Promise<SpeechSession> {
    const session = this._requireSession(sessionId);

    if (session.status !== SpeechSessionStatus.ACTIVE) {
      AppException.throw(SpeechErrors.INVALID_SESSION_STATE, {
        sessionId,
        status: session.status,
      });
    }

    session.status = SpeechSessionStatus.FINALIZING;

    if (session.chunks.length === 0) {
      session.status = SpeechSessionStatus.FAILED;
      AppException.throw(SpeechErrors.AUDIO_EMPTY, { sessionId });
    }

    try {
      const audioBuffer = Buffer.concat(session.chunks);
      const audioPath = `audio/${session.interviewId}/${session.questionId}-${Date.now()}.webm`;
      session.audioUrl = await this._storageService.store(audioBuffer, audioPath);
    } catch (error) {
      this._logger.error(`[finishSession] Storage failed for ${sessionId}`, error);
      session.status = SpeechSessionStatus.FAILED;
      AppException.throw(SpeechErrors.STORAGE_FAILED, { sessionId });
    }

    try {
      const audioBuffer = Buffer.concat(session.chunks);
      const result = await this._speechProvider.transcribe({
        audioBuffer,
        mimeType: 'audio/webm',
      });
      session.transcript = result.text;
    } catch (error) {
      this._logger.error(`[finishSession] Transcription failed for ${sessionId}`, error);
      session.status = SpeechSessionStatus.FAILED;
      AppException.throw(SpeechErrors.TRANSCRIPTION_FAILED, { sessionId });
    }

    session.status = SpeechSessionStatus.COMPLETED;
    this._logger.log(
      `[finishSession] Session completed: ${sessionId}, transcript length: ${session.transcript.length}`,
    );
    return session;
  }

  getSession(sessionId: string): SpeechSession | null {
    return this._sessions.get(sessionId) || null;
  }

  async storeAudio(audioBase64: string, interviewId: string, questionId: string): Promise<string> {
    const buffer = Buffer.from(audioBase64, 'base64');
    const path = `audio/${interviewId}/${questionId}-${Date.now()}.webm`;
    return this._storageService.store(buffer, path);
  }

  private _requireSession(sessionId: string): SpeechSession {
    const session = this._sessions.get(sessionId);
    if (!session) {
      AppException.throw(SpeechErrors.SESSION_NOT_FOUND, { sessionId });
    }
    return session;
  }

  private _findActiveByQuestion(questionId: string): SpeechSession | undefined {
    for (const session of this._sessions.values()) {
      if (
        session.questionId === questionId &&
        (session.status === SpeechSessionStatus.ACTIVE ||
          session.status === SpeechSessionStatus.FINALIZING)
      ) {
        return session;
      }
    }
    return undefined;
  }
}
