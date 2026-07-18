import { Injectable } from '@nestjs/common';

@Injectable()
export class KeywordCoverageCalculator {
  calculate(transcript: string, expectedKeywords: string[]): number {
    if (!expectedKeywords || expectedKeywords.length === 0) {
      return 0;
    }

    const lower = transcript.toLowerCase();
    let matched = 0;

    for (const keyword of expectedKeywords) {
      const kw = keyword.toLowerCase().trim();
      if (kw.length > 0 && lower.includes(kw)) {
        matched++;
      }
    }

    return Math.round((matched / expectedKeywords.length) * 100) / 100;
  }
}
