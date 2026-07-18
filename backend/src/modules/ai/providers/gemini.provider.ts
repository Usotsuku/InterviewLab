import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { AIProvider, GenerateRequest, GenerateResponse } from './ai-provider.interface';
import { AiConfig } from '../config/ai.config';
import { AI_ERRORS } from '../errors/ai.errors';
import { AppException } from '@core/exceptions/app.exception';

@Injectable()
export class GeminiProvider extends AIProvider {
  private readonly _logger = new Logger(GeminiProvider.name);
  private readonly _genAI: GoogleGenerativeAI;
  private readonly _model: GenerativeModel;

  readonly name = 'gemini';

  constructor(private readonly _aiConfig: AiConfig) {
    super();
    this._genAI = new GoogleGenerativeAI(this._aiConfig.geminiApiKey);
    this._model = this._genAI.getGenerativeModel({
      model: this._aiConfig.model,
    });
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const startTime = Date.now();

    const generationConfig: GenerationConfig = {
      temperature: request.temperature ?? this._aiConfig.temperature,
      maxOutputTokens: request.maxOutputTokens ?? this._aiConfig.maxOutputTokens,
      topP: request.topP ?? this._aiConfig.topP,
      topK: request.topK ?? this._aiConfig.topK,
    };

    const modelConfig: Parameters<typeof this._genAI.getGenerativeModel>[0] = {
      model: this._aiConfig.model,
      generationConfig,
    };

    if (request.systemInstruction) {
      modelConfig.systemInstruction = request.systemInstruction;
    }

    const model = this._genAI.getGenerativeModel(modelConfig);

    try {
      const result = await this._withTimeout(
        model.generateContent(request.prompt),
        this._aiConfig.timeoutMs,
      );
      const response = result.response;
      const text = response.text();
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

  private _handleApiError(error: unknown): never {
    const err = error as { status?: number; message?: string; code?: number };
    this._logger.error(
      `[generate] Provider error: ${err.status ?? 'n/a'} ${err.message ?? String(error)}`,
    );

    if (err.status === 429 || err.code === 429) {
      AppException.throw(AI_ERRORS.RATE_LIMIT_EXCEEDED);
    }

    if (err.status === 401 || err.status === 403) {
      AppException.throw(AI_ERRORS.AUTHENTICATION_FAILED);
    }

    if (err.message?.includes('timeout') || err.message?.includes('DEADLINE_EXCEEDED')) {
      AppException.throw(AI_ERRORS.REQUEST_TIMEOUT);
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
