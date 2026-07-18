import { Injectable } from '@nestjs/common';

@Injectable()
export class DurationCalculator {
  calculate(durationSeconds: number, estimatedAnswerDuration?: number): number {
    if (estimatedAnswerDuration && estimatedAnswerDuration > 0) {
      const ratio = durationSeconds / estimatedAnswerDuration;
      return Math.round(ratio * 100) / 100;
    }
    return Math.round(durationSeconds * 100) / 100;
  }
}
