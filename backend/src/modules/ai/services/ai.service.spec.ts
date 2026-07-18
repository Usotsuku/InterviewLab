import { Test, TestingModule } from '@nestjs/testing';
import { AIService } from './ai.service';
import { RetryService } from './retry.service';
import { ContextService } from './context.service';
import { PromptService } from './prompt.service';
import { AiConfig } from '../config/ai.config';
import { AI_PROVIDER, AIProvider } from '../providers/ai-provider.interface';

describe('AIService', () => {
  let service: AIService;

  const mockProvider = {
    name: 'gemini',
    generate: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue(true),
    estimateTokens: jest.fn().mockReturnValue(10),
    supportsStreaming: jest.fn().mockReturnValue(true),
  };

  const mockRetryService = {
    execute: jest.fn().mockImplementation((fn) => fn()),
  };

  const mockContextService = {
    buildContext: jest.fn(),
    buildRequest: jest.fn(),
  };

  const mockPromptService = {
    buildCvPrompt: jest.fn(),
    buildInterviewPrompt: jest.fn(),
    buildEvaluationPrompt: jest.fn(),
  };

  const mockAiConfig = {
    retryMaxAttempts: 3,
    retryBaseDelayMs: 100,
    retryMaxDelayMs: 5000,
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        { provide: AI_PROVIDER, useValue: mockProvider },
        { provide: RetryService, useValue: mockRetryService },
        { provide: ContextService, useValue: mockContextService },
        { provide: PromptService, useValue: mockPromptService },
        { provide: AiConfig, useValue: mockAiConfig },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('generate', () => {
    it('should call retry with provider.generate', async () => {
      mockProvider.generate.mockResolvedValue({
        text: 'result',
        tokenUsage: { input: 10, output: 5 },
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        durationMs: 100,
      });

      const result = await service.generate({ prompt: 'test' });
      expect(result.text).toBe('result');
      expect(mockRetryService.execute).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should delegate to provider', async () => {
      const result = await service.healthCheck();
      expect(result).toBe(true);
      expect(mockProvider.healthCheck).toHaveBeenCalled();
    });
  });

  describe('analyzeCv', () => {
    it('should return placeholder result', async () => {
      const result = await service.analyzeCv('cv text');
      expect(result.summary).toContain('TODO');
      expect(result.skills).toEqual([]);
    });
  });

  describe('generateQuestions', () => {
    it('should return empty array placeholder', async () => {
      const result = await service.generateQuestions('profile', 'HR', 5);
      expect(result).toEqual([]);
    });
  });

  describe('evaluateAnswer', () => {
    it('should return placeholder evaluation', async () => {
      const result = await service.evaluateAnswer('question', 'answer');
      expect(result.technicalScore).toBe(85);
      expect(result.semanticScore).toBe(80);
    });
  });
});
