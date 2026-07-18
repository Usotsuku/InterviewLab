import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiConfig {
  constructor(private readonly _config: ConfigService) {}

  get provider(): string {
    return this._config.get<string>('config.ai.provider')!;
  }

  get geminiApiKey(): string {
    return this._config.get<string>('config.ai.geminiApiKey')!;
  }

  get geminiModel(): string {
    return this._config.get<string>('config.ai.gemini.model')!;
  }

  get model(): string {
    if (this.provider === 'kimi') return this.kimiModel;
    return this.geminiModel;
  }

  get temperature(): number {
    if (this.provider === 'kimi') return this.kimiTemperature;
    return this._config.get<number>('config.ai.gemini.temperature')!;
  }

  get topP(): number {
    return this._config.get<number>('config.ai.gemini.topP')!;
  }

  get topK(): number {
    return this._config.get<number>('config.ai.gemini.topK')!;
  }

  get maxOutputTokens(): number {
    if (this.provider === 'kimi') return this.kimiMaxOutputTokens;
    return this._config.get<number>('config.ai.gemini.maxOutputTokens')!;
  }

  get retryMaxAttempts(): number {
    return this._config.get<number>('config.ai.maxRetries')!;
  }

  get retryBaseDelayMs(): number {
    return this._config.get<number>('config.ai.retry.baseDelayMs')!;
  }

  get retryMaxDelayMs(): number {
    return this._config.get<number>('config.ai.retry.maxDelayMs')!;
  }

  get timeoutMs(): number {
    return this._config.get<number>('config.ai.timeoutMs')!;
  }

  get kimiApiKey(): string {
    return this._config.get<string>('config.ai.kimi.apiKey')!;
  }

  get kimiModel(): string {
    return this._config.get<string>('config.ai.kimi.model')!;
  }

  get kimiBaseUrl(): string {
    return this._config.get<string>('config.ai.kimi.baseUrl')!;
  }

  get kimiTemperature(): number {
    return this._config.get<number>('config.ai.kimi.temperature')!;
  }

  get kimiMaxOutputTokens(): number {
    return this._config.get<number>('config.ai.kimi.maxOutputTokens')!;
  }
}
