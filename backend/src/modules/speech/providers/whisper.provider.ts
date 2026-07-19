import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpeechProvider, TranscribeRequest, TranscribeResponse } from './speech-provider.interface';

@Injectable()
export class WhisperProvider extends SpeechProvider {
  readonly name = 'whisper';
  private readonly _logger = new Logger(WhisperProvider.name);
  private readonly _apiKey: string;
  private readonly _apiUrl: string;

  constructor(private readonly _config: ConfigService) {
    super();
    this._apiKey = this._config.get<string>('SPEECH_PROVIDER_API_KEY') || '';
    this._apiUrl =
      this._config.get<string>('SPEECH_PROVIDER_API_URL') ||
      'https://api.openai.com/v1/audio/transcriptions';
  }

  isAvailable(): boolean {
    return this._apiKey.length > 0;
  }

  async transcribe(request: TranscribeRequest): Promise<TranscribeResponse> {
    const blob = new Blob([new Uint8Array(request.audioBuffer)], { type: request.mimeType });
    const fileName = `audio-${Date.now()}.webm`;

    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'verbose_json');

    const controller = new AbortController();
    const timeoutMs = 60_000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(this._apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this._apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        this._logger.error(`[transcribe] Whisper API request timed out after ${timeoutMs}ms`);
        throw new Error(`Whisper API request timed out after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      this._logger.error(`[transcribe] Whisper API error ${response.status}: ${errorBody}`);
      throw new Error(`Whisper API returned status ${response.status}`);
    }

    const result: WhisperVerboseJsonResponse =
      (await response.json()) as WhisperVerboseJsonResponse;

    return {
      text: result.text,
      confidence: 1.0,
      durationMs: Math.round((result.duration || 0) * 1000),
      language: result.language || 'en',
    };
  }

  async healthCheck(): Promise<boolean> {
    if (!this._apiKey) {
      this._logger.warn('[healthCheck] No API key configured');
      return false;
    }
    return true;
  }
}

interface WhisperVerboseJsonResponse {
  text: string;
  language: string;
  duration: number;
}
