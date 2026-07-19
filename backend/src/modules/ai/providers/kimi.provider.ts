import { Injectable, OnModuleInit } from '@nestjs/common';
import { OpenAiBaseProvider } from './openai-base.provider';
import { AiConfig } from '../config/ai.config';

@Injectable()
export class KimiProvider extends OpenAiBaseProvider implements OnModuleInit {
  readonly name = 'kimi';

  constructor(aiConfig: AiConfig) {
    super(aiConfig, KimiProvider.name);
  }

  async onModuleInit(): Promise<void> {
    await this.init();
  }

  protected async init(): Promise<void> {
    this.logStartupConfig(this._aiConfig.kimiApiKey, {
      Model: this._aiConfig.kimiModel,
      'Base URL': this._aiConfig.kimiBaseUrl,
    });
    this.assertApiKey(this._aiConfig.kimiApiKey, 'KIMI_API_KEY');
    this.initClient(this._aiConfig.kimiApiKey, this._aiConfig.kimiBaseUrl);
    await this.assertModelAvailable();
  }

  protected getModelName(): string {
    return this._aiConfig.kimiModel;
  }

  protected getTemperature(): number {
    return this._aiConfig.kimiTemperature;
  }

  protected getMaxOutputTokens(): number {
    return this._aiConfig.kimiMaxOutputTokens;
  }
}
