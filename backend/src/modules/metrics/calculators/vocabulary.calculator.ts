import { Injectable } from '@nestjs/common';

@Injectable()
export class VocabularyCalculator {
  calculate(transcript: string): number {
    const words = this._normalizeWords(transcript);
    if (words.length === 0) {
      return 0;
    }

    const uniqueWords = new Set(words);
    return Math.round((uniqueWords.size / words.length) * 100) / 100;
  }

  private _normalizeWords(transcript: string): string[] {
    return transcript
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 0);
  }
}
