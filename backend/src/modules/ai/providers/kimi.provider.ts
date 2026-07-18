import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import OpenAI from 'openai';
import { AIProvider, GenerateRequest, GenerateResponse } from './ai-provider.interface';
import { AiConfig } from '../config/ai.config';
import { AI_ERRORS } from '../errors/ai.errors';
import { AppException } from '@core/exceptions/app.exception';

@Injectable()
export class KimiProvider extends AIProvider implements OnModuleInit {
  private readonly _logger = new Logger(KimiProvider.name);
  private readonly _client: OpenAI;

  readonly name = 'kimi';

  constructor(private readonly _aiConfig: AiConfig) {
    super();
    this._client = new OpenAI({
      apiKey: this._aiConfig.kimiApiKey,
      baseURL: this._aiConfig.kimiBaseUrl,
    });
  }

  async onModuleInit(): Promise<void> {
    this._logStartupConfig();
    this._assertApiKeyConfigured();
    await this._assertModelAvailable();
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const startTime = Date.now();

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (request.systemInstruction) {
      messages.push({ role: 'system', content: request.systemInstruction });
    }

    messages.push({ role: 'user', content: request.prompt });

    try {
      const response = await this._withTimeout(
        this._client.chat.completions.create({
          model: this._aiConfig.kimiModel,
          messages,
          temperature: request.temperature ?? this._aiConfig.kimiTemperature,
          max_tokens: request.maxOutputTokens ?? this._aiConfig.kimiMaxOutputTokens,
          top_p: request.topP,
        }),
        this._aiConfig.timeoutMs,
      );

      const choice = response.choices?.[0];
      const text = choice?.message?.content ?? '';
      const tokenUsage = {
        input: response.usage?.prompt_tokens ?? 0,
        output: response.usage?.completion_tokens ?? 0,
      };

      const durationMs = Date.now() - startTime;
      this._logger.log(
        `[generate] Completed in ${durationMs}ms, tokens: ${tokenUsage.input}+${tokenUsage.output}, finish_reason: ${choice?.finish_reason ?? 'n/a'}`,
      );

      return {
        text,
        tokenUsage,
        provider: this.name,
        model: this._aiConfig.kimiModel,
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this._logger.error(`[generate] Failed after ${durationMs}ms`);
      this._handleApiError(error);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.generate({ prompt: 'Say OK', maxOutputTokens: 10 });
      return true;
    } catch {
      return false;
    }
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  supportsStreaming(): boolean {
    return true;
  }

  private _logStartupConfig(): void {
    const key = this._aiConfig.kimiApiKey ?? '';
    const fingerprint =
      key.length >= 10 ? `${key.substring(0, 6)}...${key.substring(key.length - 4)}` : '***';
    this._logger.log(`[startup] Provider: ${this.name}`);
    this._logger.log(`[startup] Model: ${this._aiConfig.kimiModel}`);
    this._logger.log(`[startup] Base URL: ${this._aiConfig.kimiBaseUrl}`);
    this._logger.log(`[startup] API key fingerprint: ${fingerprint}`);
    this._logger.log(`[startup] Node version: ${process.version}`);
  }

  private _assertApiKeyConfigured(): void {
    if (!this._aiConfig.kimiApiKey) {
      this._logger.error('[startup] KIMI_API_KEY is not configured');
      AppException.throw(
        AI_ERRORS.CONFIGURATION_ERROR,
        'KIMI_API_KEY is missing. The AI provider cannot start.',
      );
    }
  }

  private async _assertModelAvailable(): Promise<void> {
    try {
      const models = await this._client.models.list();
      const availableIds = models.data.map((m) => m.id);
      const configured = this._aiConfig.kimiModel;

      if (!availableIds.includes(configured)) {
        this._logger.error(
          `[startup] Model "${configured}" is NOT available. Available models: ${availableIds.join(', ')}`,
        );
        AppException.throw(AI_ERRORS.INVALID_MODEL);
      }

      this._logger.log(`[startup] Model "${configured}" is available`);
    } catch (error) {
      if (
        error instanceof Error &&
        (error as any).status !== undefined
      ) {
        this._handleApiError(error, 'startup validation');
      }

      this._logger.warn(
        `[startup] Could not verify model availability: ${(error as Error).message}. Proceeding.`,
      );
    }
  }

  private _handleApiError(error: unknown, context = 'generate'): never {
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
      if (message.includes('quota')) {
        AppException.throw(AI_ERRORS.QUOTA_EXCEEDED);
      }
      AppException.throw(AI_ERRORS.RATE_LIMIT_EXCEEDED);
    }

    if (status === 408 || message.includes('timeout')) {
      AppException.throw(AI_ERRORS.REQUEST_TIMEOUT);
    }

    if (status !== undefined && status >= 500) {
      AppException.throw(AI_ERRORS.PROVIDER_UNAVAILABLE);
    }

    AppException.throw(AI_ERRORS.PROVIDER_UNAVAILABLE);
  }

  private _withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('AI request timeout')), timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }
}
