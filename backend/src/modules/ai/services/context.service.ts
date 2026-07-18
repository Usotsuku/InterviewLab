import { Injectable } from '@nestjs/common';
import { AiConfig } from '../config/ai.config';
import { GenerateRequest } from '../providers/ai-provider.interface';

export interface ContextConfig {
  provider: string;
  model: string;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  topK: number;
  timeoutMs: number;
}

@Injectable()
export class ContextService {
  constructor(private readonly _aiConfig: AiConfig) {}

  buildContext(overrides?: {
    temperature?: number;
    maxOutputTokens?: number;
    timeoutMs?: number;
  }): ContextConfig {
    return {
      provider: this._aiConfig.provider,
      model: this._aiConfig.model,
      temperature: overrides?.temperature ?? this._aiConfig.temperature,
      maxOutputTokens: overrides?.maxOutputTokens ?? this._aiConfig.maxOutputTokens,
      topP: this._aiConfig.topP,
      topK: this._aiConfig.topK,
      timeoutMs: overrides?.timeoutMs ?? this._aiConfig.timeoutMs,
    };
  }

  buildRequest(
    prompt: string,
    systemInstruction?: string,
    overrides?: {
      temperature?: number;
      maxOutputTokens?: number;
    },
  ): GenerateRequest {
    return {
      prompt,
      systemInstruction,
      temperature: overrides?.temperature,
      maxOutputTokens: overrides?.maxOutputTokens,
    };
  }

  getSafetySettings(): Array<{ category: string; threshold: string }> {
    return [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ];
  }
}
