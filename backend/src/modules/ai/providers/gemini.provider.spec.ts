jest.mock('@google/genai', () => {
  const mockGenerateContent = jest.fn();
  const mockList = jest.fn().mockResolvedValue({
    [Symbol.asyncIterator]: async function* () {},
  });
  const MockGoogleGenAI = jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent, list: mockList },
  }));
  return {
    GoogleGenAI: MockGoogleGenAI,
    __mockGenerateContent: mockGenerateContent,
    __mockList: mockList,
  };
});

import { GoogleGenAI } from '@google/genai';
import { Test } from '@nestjs/testing';
import { GeminiProvider } from './gemini.provider';
import { AiConfig } from '../config/ai.config';
import { AI_ERRORS } from '../errors/ai.errors';

describe('GeminiProvider', () => {
  let provider: GeminiProvider;
  let mockGenerateContent: jest.Mock;
  let mockList: jest.Mock;

  const mockAiConfig = {
    geminiApiKey: 'test-api-key',
    geminiModel: 'gemini-2.5-flash',
    geminiTemperature: 0.4,
    topP: 0.95,
    topK: 40,
    geminiMaxOutputTokens: 2048,
    timeoutMs: 30000,
  };

  beforeAll(async () => {
    const mod = await import('@google/genai');
    mockGenerateContent = (mod as unknown as { __mockGenerateContent: jest.Mock })
      .__mockGenerateContent;
    mockList = (mod as unknown as { __mockList: jest.Mock }).__mockList;

    const module = await Test.createTestingModule({
      providers: [GeminiProvider, { provide: AiConfig, useValue: mockAiConfig }],
    }).compile();

    provider = module.get<GeminiProvider>(GeminiProvider);
  });

  beforeEach(() => {
    if (mockGenerateContent) {
      mockGenerateContent.mockReset();
    }
    if (mockList) {
      mockList.mockReset();
      mockList.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {},
      });
    }
  });

  describe('generate', () => {
    it('should return normalized response on success', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Hello world',
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
      });

      const result = await provider.generate({ prompt: 'Test prompt' });

      expect(result.text).toBe('Hello world');
      expect(result.tokenUsage.input).toBe(10);
      expect(result.tokenUsage.output).toBe(5);
      expect(result.provider).toBe('gemini');
      expect(result.model).toBe('gemini-2.5-flash');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    });

    it('should pass modern generation config and system instruction', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'ok', usageMetadata: {} });

      await provider.generate({
        prompt: 'p',
        systemInstruction: 'sys',
        temperature: 0.1,
        topP: 0.5,
        topK: 10,
        maxOutputTokens: 100,
      });

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.model).toBe('gemini-2.5-flash');
      expect(call.contents).toBe('p');
      expect(call.config.systemInstruction).toBe('sys');
      expect(call.config.temperature).toBe(0.1);
      expect(call.config.topP).toBe(0.5);
      expect(call.config.topK).toBe(10);
      expect(call.config.maxOutputTokens).toBe(100);
    });

    it('should fall back to config defaults when request omits parameters', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'ok', usageMetadata: {} });

      await provider.generate({ prompt: 'p' });

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.config.temperature).toBe(0.4);
      expect(call.config.topP).toBe(0.95);
      expect(call.config.topK).toBe(40);
      expect(call.config.maxOutputTokens).toBe(2048);
      expect(call.config.systemInstruction).toBeUndefined();
    });

    it('should throw AUTHENTICATION_FAILED on 401', async () => {
      mockGenerateContent.mockRejectedValue({ status: 401, message: 'Unauthorized' });
      await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
        AI_ERRORS.AUTHENTICATION_FAILED.message,
      );
    });

    it('should throw AUTHENTICATION_FAILED on 403', async () => {
      mockGenerateContent.mockRejectedValue({ status: 403, message: 'Forbidden' });
      await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
        AI_ERRORS.AUTHENTICATION_FAILED.message,
      );
    });

    it('should throw INVALID_MODEL on 404', async () => {
      mockGenerateContent.mockRejectedValue({ status: 404, message: 'model not found' });
      await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
        AI_ERRORS.INVALID_MODEL.message,
      );
    });

    it('should throw QUOTA_EXCEEDED on 429 quota exhaustion', async () => {
      mockGenerateContent.mockRejectedValue({
        status: 429,
        message: 'RESOURCE_EXHAUSTED: quota exceeded',
      });
      await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
        AI_ERRORS.QUOTA_EXCEEDED.message,
      );
    });

    it('should throw RATE_LIMIT_EXCEEDED on 429 rate limit', async () => {
      mockGenerateContent.mockRejectedValue({ status: 429, message: 'Too many requests' });
      await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
        AI_ERRORS.RATE_LIMIT_EXCEEDED.message,
      );
    });

    it('should throw MALFORMED_REQUEST on 400', async () => {
      mockGenerateContent.mockRejectedValue({ status: 400, message: 'invalid argument' });
      await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
        AI_ERRORS.MALFORMED_REQUEST.message,
      );
    });

    it('should throw PROVIDER_UNAVAILABLE on 5xx', async () => {
      mockGenerateContent.mockRejectedValue({ status: 503, message: 'unavailable' });
      await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
        AI_ERRORS.PROVIDER_UNAVAILABLE.message,
      );
    });

    it('should throw NETWORK_ERROR on connection failure', async () => {
      const networkError = Object.assign(new Error('fetch failed'), {
        cause: { code: 'ENOTFOUND' },
      });
      mockGenerateContent.mockRejectedValue(networkError);
      await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
        AI_ERRORS.NETWORK_ERROR.message,
      );
    });

    it('should throw REQUEST_TIMEOUT on timeout', async () => {
      mockGenerateContent.mockRejectedValue(new Error('AI request timeout'));
      await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
        AI_ERRORS.REQUEST_TIMEOUT.message,
      );
    });
  });

  describe('onModuleInit (startup validation)', () => {
    it('should pass when the API key is set and the model is reachable', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'pong', usageMetadata: {} });
      await expect(provider.onModuleInit()).resolves.toBeUndefined();
    });

    it('should fail fast when GEMINI_API_KEY is missing', async () => {
      const noKeyProvider = new GeminiProvider({
        ...mockAiConfig,
        geminiApiKey: '',
      } as AiConfig);
      await expect(noKeyProvider.onModuleInit()).rejects.toThrow(
        AI_ERRORS.CONFIGURATION_ERROR.message,
      );
    });

    it('should fail fast when the configured model is unavailable', async () => {
      mockGenerateContent.mockRejectedValue({ status: 404, message: 'model not found' });
      await expect(provider.onModuleInit()).rejects.toThrow(AI_ERRORS.INVALID_MODEL.message);
    });

    it('should list available models when the configured model fails', async () => {
      mockGenerateContent.mockRejectedValue({ status: 404, message: 'model not found' });
      mockList.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield {
            name: 'models/gemini-3.5-flash',
            displayName: 'Gemini 3.5 Flash',
            supportedActions: ['generateContent'],
          };
          yield {
            name: 'models/gemini-2.0-flash',
            displayName: 'Gemini 2.0 Flash',
            supportedActions: ['generateContent', 'countTokens'],
          };
        },
      });

      await expect(provider.onModuleInit()).rejects.toThrow(AI_ERRORS.INVALID_MODEL.message);
      expect(mockList).toHaveBeenCalledWith({ config: { pageSize: 100 } });
    });
  });

  describe('healthCheck', () => {
    it('should return true on success', async () => {
      const freshProvider = new GeminiProvider(mockAiConfig as AiConfig);
      mockGenerateContent.mockResolvedValue({ text: 'OK', usageMetadata: {} });
      expect(await freshProvider.healthCheck()).toBe(true);
    });

    it('should return false on failure', async () => {
      const freshProvider = new GeminiProvider(mockAiConfig as AiConfig);
      mockGenerateContent.mockRejectedValue({ status: 500, message: 'fail' });
      expect(await freshProvider.healthCheck()).toBe(false);
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
