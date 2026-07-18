import { SpeechService, SpeechSession } from './speech.service';
import { SpeechProvider, TranscribeResponse } from '../providers/speech-provider.interface';
import { SpeechSessionStatus } from '@shared/enums/domain.enums';
import { SpeechErrors } from '../errors/speech.errors';
import { AnswerRepository } from '@modules/answer/repositories/answer.repository';
import { QuestionRepository } from '@modules/question/repositories/question.repository';
import { StorageService } from '@modules/storage/services/storage.service';
import { ConfigService } from '@nestjs/config';
import { AppException } from '@core/exceptions/app.exception';

describe('SpeechService', () => {
  let service: SpeechService;

  const mockSpeechProvider: jest.Mocked<SpeechProvider> = {
    name: 'whisper',
    transcribe: jest.fn(),
    healthCheck: jest.fn(),
  };

  const mockStorageService = {
    store: jest.fn(),
    getFullPath: jest.fn(),
    fileExists: jest.fn(),
    getFileSize: jest.fn(),
    deleteFile: jest.fn(),
  } as unknown as jest.Mocked<StorageService>;

  const mockAnswerRepository = {} as jest.Mocked<AnswerRepository>;
  const mockQuestionRepository = {} as jest.Mocked<QuestionRepository>;
  const mockConfigService = { get: jest.fn() } as unknown as jest.Mocked<ConfigService>;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new SpeechService(
      mockSpeechProvider,
      mockStorageService,
      mockAnswerRepository,
      mockQuestionRepository,
      mockConfigService,
    );
  });

  describe('startSession', () => {
    it('should create a new speech session with ACTIVE status', async () => {
      const result = await service.startSession({
        interviewId: 'int-1',
        questionId: 'q-1',
        userId: 'user-1',
      });

      expect(result.status).toBe(SpeechSessionStatus.ACTIVE);
      expect(result.interviewId).toBe('int-1');
      expect(result.questionId).toBe('q-1');
      expect(result.userId).toBe('user-1');
      expect(result.chunks).toEqual([]);
      expect(result.transcript).toBe('');
    });

    it('should throw SESSION_ALREADY_ACTIVE if a session already exists for the question', async () => {
      await service.startSession({
        interviewId: 'int-1',
        questionId: 'q-1',
        userId: 'user-1',
      });

      await expect(
        service.startSession({
          interviewId: 'int-1',
          questionId: 'q-1',
          userId: 'user-2',
        }),
      ).rejects.toThrow();
    });
  });

  describe('receiveChunk', () => {
    it('should accumulate audio chunks', async () => {
      const session = await service.startSession({
        interviewId: 'int-1',
        questionId: 'q-1',
        userId: 'user-1',
      });

      const chunk = Buffer.from('audio-data').toString('base64');
      service.receiveChunk(session.id, chunk);
      service.receiveChunk(session.id, chunk);

      const updated = service.getSession(session.id)!;
      expect(updated.chunks).toHaveLength(2);
    });

    it('should throw SESSION_NOT_FOUND for invalid session id', () => {
      const chunk = Buffer.from('data').toString('base64');

      expect(() => service.receiveChunk('nonexistent', chunk)).toThrow();
    });

    it('should throw INVALID_SESSION_STATE if session is not ACTIVE', async () => {
      const session = await service.startSession({
        interviewId: 'int-1',
        questionId: 'q-1',
        userId: 'user-1',
      });

      const chunk = Buffer.from('audio-data').toString('base64');
      service.receiveChunk(session.id, chunk);

      mockSpeechProvider.transcribe.mockResolvedValue({
        text: 'hello',
        confidence: 1,
        durationMs: 1000,
        language: 'en',
      });
      mockStorageService.store.mockResolvedValue('audio/path.webm');

      await service.finishSession(session.id);

      const newChunk = Buffer.from('data').toString('base64');
      expect(() => service.receiveChunk(session.id, newChunk)).toThrow();
    });
  });

  describe('finishSession', () => {
    it('should transcribe audio, store it, and set status to COMPLETED', async () => {
      const session = await service.startSession({
        interviewId: 'int-1',
        questionId: 'q-1',
        userId: 'user-1',
      });

      const chunk = Buffer.from('audio-data').toString('base64');
      service.receiveChunk(session.id, chunk);

      mockStorageService.store.mockResolvedValue('audio/int-1/q-1.webm');
      mockSpeechProvider.transcribe.mockResolvedValue({
        text: 'I have experience with Node.js',
        confidence: 1,
        durationMs: 5000,
        language: 'en',
      });

      const result = await service.finishSession(session.id);

      expect(result.status).toBe(SpeechSessionStatus.COMPLETED);
      expect(result.transcript).toBe('I have experience with Node.js');
      expect(result.audioUrl).toBe('audio/int-1/q-1.webm');
      expect(mockSpeechProvider.transcribe).toHaveBeenCalledTimes(1);
      expect(mockStorageService.store).toHaveBeenCalledTimes(1);
    });

    it('should throw AUDIO_EMPTY if no chunks received', async () => {
      const session = await service.startSession({
        interviewId: 'int-1',
        questionId: 'q-1',
        userId: 'user-1',
      });

      await expect(service.finishSession(session.id)).rejects.toThrow();
      expect(service.getSession(session.id)!.status).toBe(SpeechSessionStatus.FAILED);
    });

    it('should set status to FAILED if transcription fails', async () => {
      const session = await service.startSession({
        interviewId: 'int-1',
        questionId: 'q-1',
        userId: 'user-1',
      });

      const chunk = Buffer.from('audio-data').toString('base64');
      service.receiveChunk(session.id, chunk);

      mockStorageService.store.mockResolvedValue('audio/int-1/q-1.webm');
      mockSpeechProvider.transcribe.mockRejectedValue(new Error('Provider down'));

      await expect(service.finishSession(session.id)).rejects.toThrow();
      expect(service.getSession(session.id)!.status).toBe(SpeechSessionStatus.FAILED);
    });
  });

  describe('storeAudio', () => {
    it('should store base64 audio via StorageService', async () => {
      mockStorageService.store.mockResolvedValue('audio/int-1/q-1.webm');

      const result = await service.storeAudio(
        Buffer.from('data').toString('base64'),
        'int-1',
        'q-1',
      );

      expect(result).toBe('audio/int-1/q-1.webm');
      expect(mockStorageService.store).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSession', () => {
    it('should return null for nonexistent session', () => {
      expect(service.getSession('nonexistent')).toBeNull();
    });

    it('should return the session if it exists', async () => {
      const session = await service.startSession({
        interviewId: 'int-1',
        questionId: 'q-1',
        userId: 'user-1',
      });

      expect(service.getSession(session.id)).toBeDefined();
      expect(service.getSession(session.id)!.id).toBe(session.id);
    });
  });
});
