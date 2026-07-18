import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { AI_PROVIDER, AIProvider, GenerateRequest, GenerateResponse } from '../providers/ai-provider.interface';
import { RetryService } from './retry.service';
import { ContextService } from './context.service';
import { PromptService } from './prompt.service';
import { AiConfig } from '../config/ai.config';

interface CvAnalysisResult {
  summary: string;
  skills: string[];
  technologies: string[];
  strengths: string[];
  weaknesses: string[];
}

interface QuestionGenerationResult {
  id: string;
  text: string;
  type: string;
}

interface AnswerEvaluationResult {
  technicalScore: number;
  semanticScore: number;
  missingConcepts: string[];
  communicationTips: string[];
  idealAnswer: string;
}

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
    return this._retryService.execute(
      () => this._provider.generate(request),
      {
        maxAttempts: this._aiConfig.retryMaxAttempts,
        baseDelayMs: this._aiConfig.retryBaseDelayMs,
        maxDelayMs: this._aiConfig.retryMaxDelayMs,
        operationName: `generate:${request.prompt.substring(0, 50)}...`,
      },
    );
  }

  async analyzeCv(cvText: string): Promise<CvAnalysisResult> {
    this._logger.log('[analyzeCv] Initiating CV analysis');
    // TODO: implement in Sprint 5 using generate() + PromptService
    return {
      summary: 'TODO: summary background',
      skills: [],
      technologies: [],
      strengths: [],
      weaknesses: [],
    };
  }

  async generateQuestions(profileSummary: string, mode: string, count: number): Promise<QuestionGenerationResult[]> {
    this._logger.log(`[generateQuestions] Generating ${count} questions for mode: ${mode}`);
    // TODO: implement in Sprint 5 using generate() + PromptService
    return [];
  }

  async evaluateAnswer(question: string, transcript: string, _sessionId?: string): Promise<AnswerEvaluationResult> {
    this._logger.log('[evaluateAnswer] Evaluating candidate answer');
    // TODO: implement in Sprint 5 using generate() + PromptService
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
