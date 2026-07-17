import { Injectable, Logger } from '@nestjs/common';
import { AIService } from '@modules/ai/services/ai.service';
import { MetricsService } from '@modules/metrics/services/metrics.service';
import { SpeechService } from '@modules/speech/services/speech.service';
import { InterviewService } from '@modules/interview/services/interview.service';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';

interface SubmitAnswerResponse {
  success: true;
  audioUrl: string;
  metrics: Record<string, unknown> | null;
  evaluation: Record<string, unknown> | null;
}

@Injectable()
export class AnswerService {
  private readonly _logger = new Logger(AnswerService.name);

  constructor(
    private readonly _aiService: AIService,
    private readonly _metricsService: MetricsService,
    private readonly _speechService: SpeechService,
    private readonly _interviewService: InterviewService,
  ) {}

  async submit(userId: string, interviewId: string, dto: SubmitAnswerDto): Promise<SubmitAnswerResponse> {
    this._logger.log(`[submit] Processing answer for session: ${interviewId}`);

    // TODO: store audio if provided
    let audioUrl = '';
    if (dto.audioBlob) {
      audioUrl = await this._speechService.storeAudio(dto.audioBlob, interviewId, dto.questionId);
    }

    // TODO: Execute metrics analysis and AI evaluation in parallel via Promise.allSettled
    const [metricsResult, aiResult] = await Promise.allSettled([
      this._metricsService.compute(dto.questionId, dto.transcript ?? '', dto.durationSeconds ?? 0),
      this._aiService.evaluateAnswer(dto.questionId, dto.transcript ?? '', interviewId),
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
      metrics: metricsResult.status === 'fulfilled' ? metricsResult.value as Record<string, unknown> : null,
      evaluation: aiResult.status === 'fulfilled' ? aiResult.value as Record<string, unknown> : null,
    };
  }
}
