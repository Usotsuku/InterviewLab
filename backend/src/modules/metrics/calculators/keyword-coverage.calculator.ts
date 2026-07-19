import { Injectable } from '@nestjs/common';

@Injectable()
export class KeywordCoverageCalculator {
  calculate(transcript: string, expectedKeywords: string[]): number {
    if (!expectedKeywords || expectedKeywords.length === 0) {
      return 0;
    }

    const normalizedTranscript = this._normalize(transcript);
    const transcriptTokens = normalizedTranscript.split(/\s+/);
    let matched = 0;

    for (const keyword of expectedKeywords) {
      const normalizedKw = this._normalize(keyword);
      if (normalizedKw.length === 0) continue;

      if (
        this._matches(normalizedKw, normalizedTranscript, transcriptTokens)
      ) {
        matched++;
      }
    }

    return Math.round((matched / expectedKeywords.length) * 100) / 100;
  }

  private _matches(
    normalizedKeyword: string,
    normalizedTranscript: string,
    transcriptTokens: string[],
  ): boolean {
    if (normalizedTranscript.includes(normalizedKeyword)) {
      return true;
    }

    const kwTokens = normalizedKeyword.split(/\s+/);
    if (kwTokens.length > 1) {
      const kwJoined = kwTokens.join('');
      const transcriptJoined = transcriptTokens.join('');
      if (transcriptJoined.includes(kwJoined)) {
        return true;
      }
    }

    for (const token of transcriptTokens) {
      if (token.startsWith(normalizedKeyword) || normalizedKeyword.startsWith(token)) {
        return true;
      }
    }

    return false;
  }

  private _normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
