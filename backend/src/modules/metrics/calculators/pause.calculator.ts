import { Injectable } from '@nestjs/common';
import { PauseMetrics } from './calculator.types';

const AVERAGE_WORDS_PER_SECOND = 2.5;

@Injectable()
export class PauseCalculator {
  calculate(transcript: string, durationSeconds: number): PauseMetrics {
    if (durationSeconds <= 0) {
      return { pauseCount: 0, averagePause: 0, longestPause: 0 };
    }

    const sentences = this._splitSentences(transcript);
    const pauseCount = Math.max(0, sentences.length - 1);

    if (pauseCount === 0) {
      return { pauseCount: 0, averagePause: 0, longestPause: 0 };
    }

    const wordCount = this._countWords(transcript);
    const speakingTimeSeconds = wordCount / AVERAGE_WORDS_PER_SECOND;
    const totalPauseTimeSeconds = Math.max(0, durationSeconds - speakingTimeSeconds);
    const averagePauseMs = Math.round((totalPauseTimeSeconds / pauseCount) * 1000);
    const longestPauseMs = Math.round(averagePauseMs * 1.5);

    return {
      pauseCount,
      averagePause: averagePauseMs,
      longestPause: longestPauseMs,
    };
  }

  private _splitSentences(transcript: string): string[] {
    const trimmed = transcript.trim();
    if (!trimmed) {
      return [];
    }
    return trimmed
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private _countWords(transcript: string): number {
    return transcript
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  }
}
