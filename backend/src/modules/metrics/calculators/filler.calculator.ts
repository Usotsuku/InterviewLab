import { Injectable } from '@nestjs/common';
import { FILLER_WORDS, FILLER_PHRASES } from './filler-words.config';

@Injectable()
export class FillerCalculator {
  calculate(transcript: string): number {
    if (!transcript || transcript.trim().length === 0) {
      return 0;
    }

    const lower = transcript.toLowerCase();
    let count = 0;

    for (const phrase of FILLER_PHRASES) {
      const regex = new RegExp(`\\b${this._escapeRegex(phrase)}\\b`, 'g');
      const matches = lower.match(regex);
      if (matches) {
        count += matches.length;
      }
    }

    const words = lower
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 0);

    const singleFillerSet = new Set(FILLER_WORDS.filter((w) => !FILLER_PHRASES.includes(w)));

    for (const word of words) {
      if (singleFillerSet.has(word)) {
        count++;
      }
    }

    return count;
  }

  private _escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
