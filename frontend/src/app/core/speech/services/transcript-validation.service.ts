import { Injectable } from '@angular/core';
import { TranscriptValidationResult, SpeechErrorCode } from '../speech.types';

/**
 * TranscriptValidationService — pure, stateless validation function.
 * No dependencies on other services.
 * No side effects.
 * Same inputs always produce the same output.
 */
@Injectable({ providedIn: 'root' })
export class TranscriptValidationService {
  private readonly MIN_WORDS = 10;
  private readonly MAX_WORDS = 2000;
  private readonly MIN_WPM = 20;
  private readonly MAX_WPM = 250;

  validate(transcript: string, durationSeconds: number): TranscriptValidationResult {
    const trimmed = transcript.trim();
    const words = trimmed ? trimmed.split(/\s+/) : [];
    const wordCount = words.length;
    const characterCount = trimmed.length;
    const errors: SpeechErrorCode[] = [];

    if (!trimmed) {
      errors.push('TRANSCRIPT_EMPTY');
    } else if (wordCount < this.MIN_WORDS) {
      errors.push('TRANSCRIPT_TOO_SHORT');
    }

    if (wordCount > this.MAX_WORDS) {
      errors.push('TRANSCRIPT_TOO_LONG');
    }

    let estimatedDurationAccuracy = true;
    if (durationSeconds > 0 && wordCount > 0) {
      const wpm = (wordCount / durationSeconds) * 60;
      if (wpm < this.MIN_WPM || wpm > this.MAX_WPM) {
        estimatedDurationAccuracy = false;
      }
    }

    return { isValid: errors.length === 0, wordCount, characterCount, estimatedDurationAccuracy, errors };
  }
}
