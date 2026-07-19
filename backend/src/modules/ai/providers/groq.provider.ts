import { Injectable, OnModuleInit } from '@nestjs/common';
import { OpenAiBaseProvider } from './openai-base.provider';
import { AiConfig } from '../config/ai.config';

@Injectable()
export class GroqProvider extends OpenAiBaseProvider implements OnModuleInit {
  readonly name = 'groq';

  constructor(aiConfig: AiConfig) {
    super(aiConfig, GroqProvider.name);
  }

  async onModuleInit(): Promise<void> {
    await this.init();
  }

  protected async init(): Promise<void> {
    this.logStartupConfig(this._aiConfig.groqApiKey, {
      Model: this._aiConfig.groqModel,
      'Base URL': this._aiConfig.groqBaseUrl,
    });
    this.assertApiKey(this._aiConfig.groqApiKey, 'GROQ_API_KEY');
    this.initClient(this._aiConfig.groqApiKey, this._aiConfig.groqBaseUrl);
    await this.assertModelAvailable();
  }

  protected getModelName(): string {
    return this._aiConfig.groqModel;
  }

  protected getTemperature(): number {
    return this._aiConfig.groqTemperature;
  }

  protected getMaxOutputTokens(): number {
    return this._aiConfig.groqMaxOutputTokens;
  }

  protected getExtraRequestParams(): Record<string, unknown> {
    return { reasoning_effort: 'none' };
  }
}
