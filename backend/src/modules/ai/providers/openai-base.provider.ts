import OpenAI from 'openai';
import { GenerateRequest, GenerateResponse } from './ai-provider.interface';
import { BaseAiProvider } from './base-ai.provider';
import { AiConfig } from '../config/ai.config';

export abstract class OpenAiBaseProvider extends BaseAiProvider {
  protected _client!: OpenAI;

  protected constructor(aiConfig: AiConfig, className: string) {
    super(aiConfig, className);
  }

  protected initClient(apiKey: string | undefined, baseURL: string | undefined): void {
    this._client = new OpenAI({ apiKey, baseURL });
  }

  protected async assertModelAvailable(): Promise<void> {
    try {
      const models = await this._client.models.list();
      const availableIds = models.data.map((m) => m.id);
      const configured = this.getModelName();

      if (!availableIds.includes(configured)) {
        this._logger.error(
          `[startup] Model "${configured}" is NOT available. Available models: ${availableIds.join(', ')}`,
        );
        const { AI_ERRORS } = await import('../errors/ai.errors');
        const { AppException } = await import('@core/exceptions/app.exception');
        AppException.throw(AI_ERRORS.INVALID_MODEL);
      }

      this._logger.log(`[startup] Model "${configured}" validated successfully`);
    } catch (error) {
      if (error instanceof Error && (error as any).status !== undefined) {
        this.handleApiError(error, 'startup validation');
      }

      this._logger.warn(
        `[startup] Could not verify model availability: ${(error as Error).message}. Proceeding.`,
      );
    }
  }

  protected abstract getModelName(): string;
  protected abstract getTemperature(): number;
  protected abstract getMaxOutputTokens(): number;

  protected getExtraRequestParams(): Record<string, unknown> {
    return {};
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const startTime = Date.now();

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (request.systemInstruction) {
      messages.push({ role: 'system', content: request.systemInstruction });
    }

    messages.push({ role: 'user', content: request.prompt });

    try {
      const response = await this.withTimeout(
        this._client.chat.completions.create({
          model: this.getModelName(),
          messages,
          temperature: request.temperature ?? this.getTemperature(),
          max_tokens: request.maxOutputTokens ?? this.getMaxOutputTokens(),
          top_p: request.topP,
          ...this.getExtraRequestParams(),
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
        model: this.getModelName(),
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this._logger.error(`[generate] Failed after ${durationMs}ms`);
      this.handleApiError(error);
    }
  }
}
