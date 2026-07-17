// Speech subsystem types — used by SpeechFacadeService and its sub-services

export type SpeechState =
  | 'IDLE'
  | 'REQUESTING_PERMISSION'
  | 'READY'
  | 'RECORDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'ERROR';

export type PermissionState = 'UNKNOWN' | 'GRANTED' | 'DENIED' | 'PROMPT';

export type SpeechErrorCode =
  | 'NOT_SUPPORTED'
  | 'PERMISSION_DENIED'
  | 'PERMISSION_REQUEST_FAILED'
  | 'STREAM_UNAVAILABLE'
  | 'ALREADY_RECORDING'
  | 'NOT_RECORDING'
  | 'RECORDER_ERROR'
  | 'RECOGNITION_ERROR'
  | 'LANGUAGE_NOT_SUPPORTED'
  | 'TRANSCRIPT_EMPTY'
  | 'TRANSCRIPT_TOO_SHORT'
  | 'TRANSCRIPT_TOO_LONG'
  | 'START_FAILED'
  | 'NETWORK_ERROR';

export class SpeechError extends Error {
  constructor(
    public readonly code: SpeechErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'SpeechError';
  }
}

export interface SpeechResult {
  transcript: string;
  audioBlob: Blob;
  durationSeconds: number;
  wordCount: number;
}

export interface TranscriptValidationResult {
  isValid: boolean;
  wordCount: number;
  characterCount: number;
  estimatedDurationAccuracy: boolean;
  errors: SpeechErrorCode[];
}

export interface SpeechLanguage {
  code: string;
  label: string;
  supported: boolean;
}

export const SUPPORTED_SPEECH_LANGUAGES: SpeechLanguage[] = [
  { code: 'en-US', label: 'English (US)', supported: true },
  { code: 'en-GB', label: 'English (UK)', supported: true },
  { code: 'fr-FR', label: 'Français', supported: true },
  { code: 'ar-SA', label: 'العربية', supported: true },
  { code: 'es-ES', label: 'Español', supported: true },
  { code: 'de-DE', label: 'Deutsch', supported: true },
];
