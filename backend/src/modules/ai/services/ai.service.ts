import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  AI_PROVIDER,
  AIProvider,
  GenerateRequest,
  GenerateResponse,
} from '../providers/ai-provider.interface';
import { RetryService } from './retry.service';
import { ContextService } from './context.service';
import { PromptService } from './prompt.service';
import { AiConfig } from '../config/ai.config';

@Injectable()
export class AIService {
  private readonly _logger = new Logger(AIService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly _provider: AIProvider,
    private readonly _retryService: RetryService,
    private readonly _contextService: ContextService,
    private readonly _promptService: PromptService,
    private readonly _aiConfig: AiConfig,
  ) {}

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    return this._retryService.execute(() => this._provider.generate(request), {
      maxAttempts: this._aiConfig.retryMaxAttempts,
      baseDelayMs: this._aiConfig.retryBaseDelayMs,
      maxDelayMs: this._aiConfig.retryMaxDelayMs,
      operationName: 'ai:generate',
    });
  }

  async generateQuestions(
    profileSummary: string,
    mode: string,
    count: number,
  ): Promise<{ id: string; text: string; type: string }[]> {
    this._logger.log(`[generateQuestions] Generating ${count} questions for mode: ${mode}`);
    // TODO: implement in Sprint 6 using generate() + PromptService
    return [];
  }

  async evaluateAnswer(
    question: string,
    transcript: string,
    _sessionId?: string,
  ): Promise<Record<string, unknown>> {
    this._logger.log('[evaluateAnswer] Evaluating candidate answer');
    // TODO: implement in Sprint 6 using generate() + PromptService
    return {
      technicalScore: 85,
      semanticScore: 80,
      missingConcepts: [],
      communicationTips: [],
      idealAnswer: 'TODO: ideal answer text',
    };
  }

  async healthCheck(): Promise<boolean> {
    return this._provider.healthCheck();
  }
}
