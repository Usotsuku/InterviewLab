import { Logger } from '@nestjs/common';
import { AIProvider, GenerateRequest, GenerateResponse } from './ai-provider.interface';
import { AiConfig } from '../config/ai.config';
import { AI_ERRORS } from '../errors/ai.errors';
import { AppException } from '@core/exceptions/app.exception';

export abstract class BaseAiProvider extends AIProvider {
  protected readonly _logger: Logger;
  protected readonly _aiConfig: AiConfig;

  abstract readonly name: string;

  protected constructor(aiConfig: AiConfig, className: string) {
    super();
    this._aiConfig = aiConfig;
    this._logger = new Logger(className);
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  supportsStreaming(): boolean {
    return true;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.generate({ prompt: 'Say OK', maxOutputTokens: 10 });
      return true;
    } catch {
      return false;
    }
  }

  protected abstract init(): Promise<void>;

  protected logStartupConfig(apiKey: string, extraFields?: Record<string, string>): void {
    const fingerprint =
      apiKey.length >= 10
        ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`
        : '***';
    this._logger.log(`[startup] Provider: ${this.name}`);
    if (extraFields) {
      for (const [label, value] of Object.entries(extraFields)) {
        this._logger.log(`[startup] ${label}: ${value}`);
      }
    }
    this._logger.log(`[startup] API key fingerprint: ${fingerprint}`);
    this._logger.log(`[startup] Node version: ${process.version}`);
  }

  protected assertApiKey(apiKey: string | undefined, keyEnvName: string): void {
    if (!apiKey) {
      this._logger.error(`[startup] ${keyEnvName} is not configured`);
      AppException.throw(
        AI_ERRORS.CONFIGURATION_ERROR,
        `${keyEnvName} is missing. The AI provider cannot start.`,
      );
    }
  }

  protected handleApiError(error: unknown, context = 'generate'): never {
    const err = error as {
      status?: number;
      code?: number | string;
      message?: string;
      cause?: { code?: string; message?: string };
    };

    const status = typeof err.status === 'number' ? err.status : undefined;
    const causeCode = err.cause?.code;
    const message = `${err.message ?? ''}${causeCode ? ` (${causeCode})` : ''}`.toLowerCase();

    this._logger.error(
      `[${context}] Provider error: status=${status ?? 'n/a'} ${err.message ?? String(error)}`,
    );

    if (
      status === undefined &&
      (message.includes('fetch failed') ||
        message.includes('enotfound') ||
        message.includes('econnrefused') ||
        message.includes('econnreset') ||
        message.includes('etimedout') ||
        causeCode != null)
    ) {
      AppException.throw(AI_ERRORS.NETWORK_ERROR);
    }

    if (status === 400) {
      AppException.throw(AI_ERRORS.MALFORMED_REQUEST);
    }

    if (status === 401 || status === 403) {
      AppException.throw(AI_ERRORS.AUTHENTICATION_FAILED);
    }

    if (status === 404) {
      AppException.throw(AI_ERRORS.INVALID_MODEL);
    }

    if (status === 429) {
      if (message.includes('quota') || message.includes('resource_exhausted')) {
        AppException.throw(AI_ERRORS.QUOTA_EXCEEDED);
      }
      AppException.throw(AI_ERRORS.RATE_LIMIT_EXCEEDED);
    }

    if (status === 408 || message.includes('timeout') || message.includes('deadline_exceeded')) {
      AppException.throw(AI_ERRORS.REQUEST_TIMEOUT);
    }

    if (status !== undefined && status >= 500) {
      AppException.throw(AI_ERRORS.PROVIDER_UNAVAILABLE);
    }

    AppException.throw(AI_ERRORS.PROVIDER_UNAVAILABLE);
  }

  protected withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('AI request timeout')), timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }
}
