export const SPEECH_PROVIDER = 'SPEECH_PROVIDER';

export interface TranscribeRequest {
  audioBuffer: Buffer;
  mimeType: string;
}

export interface TranscribeResponse {
  text: string;
  confidence: number;
  durationMs: number;
  language: string;
}

export abstract class SpeechProvider {
  abstract readonly name: string;
  abstract isAvailable(): boolean;
  abstract transcribe(request: TranscribeRequest): Promise<TranscribeResponse>;
  abstract healthCheck(): Promise<boolean>;
}
