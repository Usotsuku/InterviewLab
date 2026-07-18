import { Injectable } from '@nestjs/common';

const AVERAGE_WORDS_PER_SECOND = 2.5;

@Injectable()
export class SpeakingSpeedCalculator {
  calculate(transcript: string, durationSeconds: number): number {
    if (durationSeconds <= 0) {
      return 0;
    }

    const wordCount = this._countWords(transcript);
    if (wordCount === 0) {
      return 0;
    }

    return Math.round((wordCount / durationSeconds) * 60 * 10) / 10;
  }

  private _countWords(transcript: string): number {
    return transcript
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  }
}
