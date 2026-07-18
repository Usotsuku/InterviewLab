import { Injectable } from '@nestjs/common';
import { ConfidenceInput } from './calculator.types';

const OPTIMAL_WPM_LOW = 100;
const OPTIMAL_WPM_HIGH = 180;
const FILLER_THRESHOLD_RATIO = 0.02;

@Injectable()
export class ConfidenceCalculator {
  calculate(input: ConfidenceInput): number {
    const speedScore = this._speedScore(input.wordsPerMinute);
    const fillerScore = this._fillerScore(input.fillerCount, input.wordCount);
    const repetitionScore = 1 - input.repetitionScore;
    const vocabularyScore = input.vocabularyRichness;
    const keywordScore = input.keywordCoverage;
    const durationScore = this._durationScore(input.answerDuration);
    const pauseScore = this._pauseScore(input.averagePause);

    const weighted =
      speedScore * 0.2 +
      fillerScore * 0.15 +
      repetitionScore * 0.15 +
      vocabularyScore * 0.15 +
      keywordScore * 0.1 +
      durationScore * 0.1 +
      pauseScore * 0.15;

    return Math.round(Math.max(0, Math.min(1, weighted)) * 100) / 100;
  }

  private _speedScore(wpm: number): number {
    if (wpm < 40) return 0.1;
    if (wpm < OPTIMAL_WPM_LOW) return 0.3 + ((wpm - 40) / (OPTIMAL_WPM_LOW - 40)) * 0.4;
    if (wpm <= OPTIMAL_WPM_HIGH) return 1.0;
    if (wpm <= 250) return 0.8 - ((wpm - OPTIMAL_WPM_HIGH) / (250 - OPTIMAL_WPM_HIGH)) * 0.4;
    return 0.2;
  }

  private _fillerScore(fillerCount: number, wordCount: number): number {
    if (wordCount === 0) return 0.5;
    const threshold = Math.max(1, wordCount * FILLER_THRESHOLD_RATIO);
    const ratio = fillerCount / threshold;
    return Math.max(0, Math.min(1, 1 - ratio));
  }

  private _durationScore(answerDuration: number): number {
    if (answerDuration <= 0) return 0.3;
    const diff = Math.abs(answerDuration - 1.0);
    if (diff <= 0.2) return 1.0;
    if (diff <= 0.5) return 0.7;
    return 0.4;
  }

  private _pauseScore(averagePauseMs: number): number {
    if (averagePauseMs === 0) return 0.5;
    const optimalMs = 400;
    const diff = Math.abs(averagePauseMs - optimalMs);
    return Math.max(0, Math.min(1, 1 - diff / optimalMs));
  }
}
