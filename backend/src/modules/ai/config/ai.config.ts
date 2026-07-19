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

  get geminiTemperature(): number {
    return this._config.get<number>('config.ai.gemini.temperature')!;
  }

  get geminiMaxOutputTokens(): number {
    return this._config.get<number>('config.ai.gemini.maxOutputTokens')!;
  }

  get model(): string {
    if (this.provider === 'kimi') return this.kimiModel;
    if (this.provider === 'groq') return this.groqModel;
    return this.geminiModel;
  }

  get temperature(): number {
    if (this.provider === 'kimi') return this.kimiTemperature;
    if (this.provider === 'groq') return this.groqTemperature;
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
    if (this.provider === 'groq') return this.groqMaxOutputTokens;
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

  get groqApiKey(): string {
    return this._config.get<string>('config.ai.groq.apiKey')!;
  }

  get groqModel(): string {
    return this._config.get<string>('config.ai.groq.model')!;
  }

  get groqBaseUrl(): string {
    return this._config.get<string>('config.ai.groq.baseUrl')!;
  }

  get groqTemperature(): number {
    return this._config.get<number>('config.ai.groq.temperature')!;
  }

  get groqMaxOutputTokens(): number {
    return this._config.get<number>('config.ai.groq.maxOutputTokens')!;
  }
}
