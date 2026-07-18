import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { MetricsCalculationService } from './metrics-calculation.service';
import { InterviewMetricsRepository } from '../repositories/interview-metrics.repository';
import { MetricsResult } from '../calculators/calculator.types';

export interface MetricsComputeInput {
  answerId: string;
  interviewId: string;
  transcript: string;
  durationSeconds: number;
  expectedKeywords: string[];
  estimatedAnswerDuration?: number;
}

@Injectable()
export class MetricsService {
  private readonly _logger = new Logger(MetricsService.name);

  constructor(
    private readonly _calculationService: MetricsCalculationService,
    private readonly _metricsRepository: InterviewMetricsRepository,
  ) {}

  async compute(input: MetricsComputeInput): Promise<MetricsResult> {
    this._logger.log(
      `[compute] Running deterministic metrics for answer: ${input.answerId}`,
    );

    const result = this._calculationService.calculate({
      transcript: input.transcript,
      durationSeconds: input.durationSeconds,
      expectedKeywords: input.expectedKeywords,
      estimatedAnswerDuration: input.estimatedAnswerDuration,
    });

    await this._metricsRepository.create({
      answerId: new Types.ObjectId(input.answerId),
      interviewId: new Types.ObjectId(input.interviewId),
      wordsPerMinute: result.wordsPerMinute,
      answerDuration: result.answerDuration,
      pauseCount: result.pauseCount,
      averagePause: result.averagePause,
      longestPause: result.longestPause,
      fillerCount: result.fillerCount,
      vocabularyRichness: result.vocabularyRichness,
      repetitionScore: result.repetitionScore,
      keywordCoverage: result.keywordCoverage,
      confidenceScore: result.confidenceScore,
    });

    this._logger.log(
      `[compute] Metrics persisted for answer: ${input.answerId}, WPM: ${result.wordsPerMinute}, confidence: ${result.confidenceScore}`,
    );

    return result;
  }

  async getMetricsByAnswerId(answerId: string): Promise<MetricsResult | null> {
    const doc = await this._metricsRepository.findByAnswerId(answerId);
    if (!doc) {
      return null;
    }

    const typed = doc as unknown as {
      wordsPerMinute: number;
      answerDuration: number;
      pauseCount: number;
      averagePause: number;
      longestPause: number;
      fillerCount: number;
      vocabularyRichness: number;
      repetitionScore: number;
      keywordCoverage: number;
      confidenceScore: number;
    };

    return {
      wordsPerMinute: typed.wordsPerMinute ?? 0,
      answerDuration: typed.answerDuration ?? 0,
      pauseCount: typed.pauseCount ?? 0,
      averagePause: typed.averagePause ?? 0,
      longestPause: typed.longestPause ?? 0,
      fillerCount: typed.fillerCount ?? 0,
      vocabularyRichness: typed.vocabularyRichness ?? 0,
      repetitionScore: typed.repetitionScore ?? 0,
      keywordCoverage: typed.keywordCoverage ?? 0,
      confidenceScore: typed.confidenceScore ?? 0,
    };
  }
}
