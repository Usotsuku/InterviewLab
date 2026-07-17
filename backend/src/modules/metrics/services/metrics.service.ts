import { Injectable, Logger } from '@nestjs/common';

interface ComputeMetricsResponse {
  wordsPerMinute: number;
  avgPauseMs: number;
  longestPauseMs: number;
  silentTimePercent: number;
  fillerWordCount: number;
  repeatedWordCount: number;
  vocabularyRichness: number;
}

interface HistoricalMetricsResponse {
  userId: string;
  history: never[];
  averages: {
    wpm: number;
    pauseMs: number;
    richness: number;
    overallScore: number;
  };
}

@Injectable()
export class MetricsService {
  private readonly _logger = new Logger(MetricsService.name);

  async compute(answerId: string, _transcript: string, _durationSeconds: number): Promise<ComputeMetricsResponse> {
    this._logger.log(`[compute] Running deterministic metrics for answerId: ${answerId}`);
    
    // TODO: implement deterministic calculator strategies
    return {
      wordsPerMinute: 130,
      avgPauseMs: 450,
      longestPauseMs: 1200,
      silentTimePercent: 12.5,
      fillerWordCount: 2,
      repeatedWordCount: 0,
      vocabularyRichness: 0.85,
    };
  }

  async getHistoricalMetrics(userId: string): Promise<HistoricalMetricsResponse> {
    // TODO: implement aggregation pipeline loading
    return {
      userId,
      history: [],
      averages: {
        wpm: 124,
        pauseMs: 420,
        richness: 0.82,
        overallScore: 81,
      },
    };
  }
}
