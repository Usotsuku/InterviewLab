import { Injectable } from '@nestjs/common';

@Injectable()
export class RepetitionCalculator {
  calculate(transcript: string): number {
    const words = this._normalizeWords(transcript);
    if (words.length < 2) {
      return 0;
    }

    const repeatedAdjacentWords = this._countAdjacentRepetitions(words);
    const repeatedBigrams = this._countBigramRepetitions(words);
    const totalRepetitions = repeatedAdjacentWords + repeatedBigrams;
    const maxPossibleRepetitions = words.length - 1;

    if (maxPossibleRepetitions <= 0) {
      return 0;
    }

    const score = Math.min(1, totalRepetitions / Math.max(1, maxPossibleRepetitions));
    return Math.round(score * 100) / 100;
  }

  private _normalizeWords(transcript: string): string[] {
    return transcript
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 0);
  }

  private _countAdjacentRepetitions(words: string[]): number {
    let count = 0;
    for (let i = 1; i < words.length; i++) {
      if (words[i] === words[i - 1]) {
        count++;
      }
    }
    return count;
  }

  private _countBigramRepetitions(words: string[]): number {
    if (words.length < 4) {
      return 0;
    }

    const bigramCounts = new Map<string, number>();
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      bigramCounts.set(bigram, (bigramCounts.get(bigram) || 0) + 1);
    }

    let bigramRepeats = 0;
    for (const count of bigramCounts.values()) {
      if (count > 1) {
        bigramRepeats += count - 1;
      }
    }
    return bigramRepeats;
  }
}
