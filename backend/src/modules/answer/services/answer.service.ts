import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { AnswerEvaluationService } from '@modules/ai/services/answer-evaluation.service';
import { MetricsService, MetricsComputeInput } from '@modules/metrics/services/metrics.service';
import { MetricsResult } from '@modules/metrics/calculators/calculator.types';
import { SpeechService } from '@modules/speech/services/speech.service';
import { InterviewService } from '@modules/interview/services/interview.service';
import { AnswerRepository } from '../repositories/answer.repository';
import { QuestionRepository } from '@modules/question/repositories/question.repository';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';

export interface SubmitAnswerResponse {
  success: true;
  audioUrl: string;
  metrics: MetricsResult | null;
  evaluation: Record<string, unknown> | null;
}

@Injectable()
export class AnswerService {
  private readonly _logger = new Logger(AnswerService.name);

  constructor(
    private readonly _answerEvaluationService: AnswerEvaluationService,
    private readonly _metricsService: MetricsService,
    private readonly _speechService: SpeechService,
    private readonly _interviewService: InterviewService,
    private readonly _answerRepository: AnswerRepository,
    private readonly _questionRepository: QuestionRepository,
  ) {}

  async submit(
    userId: string,
    interviewId: string,
    dto: SubmitAnswerDto,
  ): Promise<SubmitAnswerResponse> {
    this._logger.log(`[submit] Processing answer for session: ${interviewId}`);

    await this._interviewService.assertOwnedBy(interviewId, userId);

    let audioUrl = '';
    if (dto.audioBlob) {
      audioUrl = await this._speechService.storeAudio(dto.audioBlob, interviewId, dto.questionId);
    }

    const answerDoc = await this._answerRepository.create({
      interviewId: new Types.ObjectId(interviewId),
      questionId: new Types.ObjectId(dto.questionId),
      transcript: dto.transcript ?? '',
      audioUrl: audioUrl || undefined,
      durationSeconds: dto.durationSeconds ?? 0,
    });
    const answerId = (answerDoc as unknown as { _id: Types.ObjectId })._id.toString();

    const question = await this._questionRepository.findById(dto.questionId);
    const expectedKeywords = question?.expectedKeywords ?? [];
    const estimatedAnswerDuration = question?.estimatedAnswerDuration ?? undefined;

    const metricsInput: MetricsComputeInput = {
      answerId,
      interviewId,
      transcript: dto.transcript ?? '',
      durationSeconds: dto.durationSeconds ?? 0,
      expectedKeywords,
      estimatedAnswerDuration,
    };

    const [metricsResult, aiResult] = await Promise.allSettled([
      this._metricsService.compute(metricsInput),
      this._answerEvaluationService.evaluate({ answerId }),
    ]);

    if (metricsResult.status === 'rejected') {
      this._logger.error('Deterministic metrics computation failed', metricsResult.reason);
    }
    if (aiResult.status === 'rejected') {
      this._logger.error('Generative AI evaluation failed', aiResult.reason);
    }

    await this._interviewService.advanceQuestion(interviewId);

    return {
      success: true,
      audioUrl,
      metrics: metricsResult.status === 'fulfilled' ? metricsResult.value : null,
      evaluation:
        aiResult.status === 'fulfilled'
          ? (aiResult.value as unknown as Record<string, unknown>)
          : null,
    };
  }
}
