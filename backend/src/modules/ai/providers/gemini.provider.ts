import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GoogleGenAI, GenerateContentConfig } from '@google/genai';
import { AIProvider, GenerateRequest, GenerateResponse } from './ai-provider.interface';
import { AiConfig } from '../config/ai.config';
import { AI_ERRORS } from '../errors/ai.errors';
import { AppException } from '@core/exceptions/app.exception';

@Injectable()
export class GeminiProvider extends AIProvider implements OnModuleInit {
  private readonly _logger = new Logger(GeminiProvider.name);
  private readonly _client: GoogleGenAI;

  readonly name = 'gemini';

  constructor(private readonly _aiConfig: AiConfig) {
    super();
    this._client = new GoogleGenAI({ apiKey: this._aiConfig.geminiApiKey });
  }

  async onModuleInit(): Promise<void> {
    this._logStartupConfig();
    this._assertApiKeyConfigured();
    await this._assertModelAvailable();
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const startTime = Date.now();

    const config: GenerateContentConfig = {
      temperature: request.temperature ?? this._aiConfig.temperature,
      topP: request.topP ?? this._aiConfig.topP,
      topK: request.topK ?? this._aiConfig.topK,
      maxOutputTokens: request.maxOutputTokens ?? this._aiConfig.maxOutputTokens,
    };

    if (request.systemInstruction) {
      config.systemInstruction = request.systemInstruction;
    }

    try {
      const response = await this._withTimeout(
        this._client.models.generateContent({
          model: this._aiConfig.model,
          contents: request.prompt,
          config,
        }),
        this._aiConfig.timeoutMs,
      );

      const text = response.text ?? '';
      const tokenUsage = {
        input: response.usageMetadata?.promptTokenCount ?? 0,
        output: response.usageMetadata?.candidatesTokenCount ?? 0,
      };

      const durationMs = Date.now() - startTime;
      this._logger.log(
        `[generate] Completed in ${durationMs}ms, tokens: ${tokenUsage.input}+${tokenUsage.output}`,
      );

      return {
        text,
        tokenUsage,
        provider: this.name,
        model: this._aiConfig.model,
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
    const key = this._aiConfig.geminiApiKey ?? '';
    const fingerprint =
      key.length >= 10 ? `${key.substring(0, 6)}...${key.substring(key.length - 4)}` : '***';
    this._logger.log(`[startup] Provider: ${this.name}`);
    this._logger.log(`[startup] Configured model: ${this._aiConfig.model}`);
    this._logger.log(`[startup] API key fingerprint: ${fingerprint}`);
    this._logger.log(`[startup] Node version: ${process.version}`);
  }

  private _assertApiKeyConfigured(): void {
    if (!this._aiConfig.geminiApiKey) {
      this._logger.error('[startup] GEMINI_API_KEY is not configured');
      AppException.throw(
        AI_ERRORS.CONFIGURATION_ERROR,
        'GEMINI_API_KEY is missing. The AI provider cannot start.',
      );
    }
  }

  private async _assertModelAvailable(): Promise<void> {
    try {
      await this._client.models.generateContent({
        model: this._aiConfig.model,
        contents: 'ping',
        config: { maxOutputTokens: 1 },
      });
      this._logger.log(
        `[startup] Model "${this._aiConfig.model}" is available for generateContent`,
      );
    } catch (error) {
      this._logger.error(
        `[startup] Model "${this._aiConfig.model}" is NOT available for generateContent`,
      );
      await this._logAvailableModels();
      this._handleApiError(error, 'startup validation');
    }
  }

  private async _logAvailableModels(): Promise<void> {
    try {
      this._logger.log('[startup] Listing models that support generateContent...');
      const pager = await this._client.models.list({ config: { pageSize: 100 } });
      const available: string[] = [];
      for await (const model of pager) {
        if (model.supportedActions?.includes('generateContent') && model.name) {
          const modelName = model.name.replace('models/', '');
          available.push(modelName);
          this._logger.log(`[startup]   - ${modelName} (${model.displayName ?? 'n/a'})`);
        }
      }
      this._logger.log(`[startup] Found ${available.length} model(s) supporting generateContent`);
    } catch (listError) {
      this._logger.warn(`[startup] Could not list models: ${(listError as Error).message}`);
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

  private _withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('AI request timeout')), timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }
}
