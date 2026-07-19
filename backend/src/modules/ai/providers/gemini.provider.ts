import { Injectable, OnModuleInit } from '@nestjs/common';
import { GoogleGenAI, GenerateContentConfig } from '@google/genai';
import { GenerateRequest, GenerateResponse } from './ai-provider.interface';
import { BaseAiProvider } from './base-ai.provider';
import { AiConfig } from '../config/ai.config';

@Injectable()
export class GeminiProvider extends BaseAiProvider implements OnModuleInit {
  private readonly _client: GoogleGenAI;

  readonly name = 'gemini';

  constructor(aiConfig: AiConfig) {
    super(aiConfig, GeminiProvider.name);
    this._client = new GoogleGenAI({ apiKey: aiConfig.geminiApiKey });
  }

  async onModuleInit(): Promise<void> {
    await this.init();
  }

  protected async init(): Promise<void> {
    this.logStartupConfig(this._aiConfig.geminiApiKey, {
      'Configured model': this._aiConfig.geminiModel,
    });
    this.assertApiKey(this._aiConfig.geminiApiKey, 'GEMINI_API_KEY');
    await this._assertModelAvailable();
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const startTime = Date.now();

    const config: GenerateContentConfig = {
      temperature: request.temperature ?? this._aiConfig.geminiTemperature,
      topP: request.topP ?? this._aiConfig.topP,
      topK: request.topK ?? this._aiConfig.topK,
      maxOutputTokens: request.maxOutputTokens ?? this._aiConfig.geminiMaxOutputTokens,
    };

    if (request.systemInstruction) {
      config.systemInstruction = request.systemInstruction;
    }

    try {
      const response = await this.withTimeout(
        this._client.models.generateContent({
          model: this._aiConfig.geminiModel,
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
        model: this._aiConfig.geminiModel,
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this._logger.error(`[generate] Failed after ${durationMs}ms`);
      this.handleApiError(error);
    }
  }

  private async _assertModelAvailable(): Promise<void> {
    try {
      await this._client.models.generateContent({
        model: this._aiConfig.geminiModel,
        contents: 'ping',
        config: { maxOutputTokens: 1 },
      });
      this._logger.log(
        `[startup] Model "${this._aiConfig.geminiModel}" is available for generateContent`,
      );
    } catch (error) {
      this._logger.error(
        `[startup] Model "${this._aiConfig.geminiModel}" is NOT available for generateContent`,
      );
      await this._logAvailableModels();
      this.handleApiError(error, 'startup validation');
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
}
