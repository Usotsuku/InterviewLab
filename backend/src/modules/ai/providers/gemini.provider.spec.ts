import { Test, TestingModule } from '@nestjs/testing';
import { GeminiProvider } from './gemini.provider';
import { AiConfig } from '../config/ai.config';
import { AI_ERRORS } from '../errors/ai.errors';

jest.mock('@google/generative-ai', () => {
  const mockGenerateContent = jest.fn();
  const mockGetGenerativeModel = jest.fn(() => ({
    generateContent: mockGenerateContent,
  }));
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
    __mockGenerateContent: mockGenerateContent,
    __mockGetGenerativeModel: mockGetGenerativeModel,
  };
});

describe('GeminiProvider', () => {
  let provider: GeminiProvider;
  let mockGenerateContent: jest.Mock;

  const mockAiConfig = {
    geminiApiKey: 'test-api-key',
    model: 'gemini-1.5-pro',
    temperature: 0.4,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  };

  beforeAll(async () => {
    const mod = await import('@google/generative-ai');
    mockGenerateContent = (mod as unknown as { __mockGenerateContent: jest.Mock })
      .__mockGenerateContent;

    const module: TestingModule = await Test.createTestingModule({
      providers: [GeminiProvider, { provide: AiConfig, useValue: mockAiConfig }],
    }).compile();

    provider = module.get<GeminiProvider>(GeminiProvider);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('generate', () => {
    it('should return normalized response on success', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Hello world',
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
        },
      });

      const result = await provider.generate({ prompt: 'Test prompt' });
      expect(result.text).toBe('Hello world');
      expect(result.tokenUsage.input).toBe(10);
      expect(result.tokenUsage.output).toBe(5);
      expect(result.provider).toBe('gemini');
      expect(result.model).toBe('gemini-1.5-pro');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should throw on API error', async () => {
      mockGenerateContent.mockRejectedValue({ status: 500, message: 'Internal error' });
      await expect(provider.generate({ prompt: 'fail' })).rejects.toThrow();
    });

    it('should throw RATE_LIMIT_EXCEEDED on 429', async () => {
      mockGenerateContent.mockRejectedValue({ status: 429, code: 429 });
      await expect(provider.generate({ prompt: 'rate limited' })).rejects.toThrow();
    });

    it('should throw AUTHENTICATION_FAILED on 401', async () => {
      mockGenerateContent.mockRejectedValue({ status: 401 });
      await expect(provider.generate({ prompt: 'unauth' })).rejects.toThrow();
    });
  });

  describe('healthCheck', () => {
    it('should return true on success', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => 'OK', usageMetadata: {} },
      });
      expect(await provider.healthCheck()).toBe(true);
    });

    it('should return false on failure', async () => {
      mockGenerateContent.mockRejectedValue(new Error('fail'));
      expect(await provider.healthCheck()).toBe(false);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate ~1 token per 4 chars', () => {
      expect(provider.estimateTokens('1234')).toBe(1);
      expect(provider.estimateTokens('12345678')).toBe(2);
    });
  });

  describe('supportsStreaming', () => {
    it('should return true', () => {
      expect(provider.supportsStreaming()).toBe(true);
    });
  });

  describe('name', () => {
    it('should be gemini', () => {
      expect(provider.name).toBe('gemini');
    });
  });
});
