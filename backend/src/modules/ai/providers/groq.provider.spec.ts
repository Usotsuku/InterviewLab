jest.mock('openai', () => {
  const mockCreate = jest.fn();
  const mockList = jest.fn().mockResolvedValue({ data: [] });
  const MockOpenAI = jest.fn().mockImplementation(() => ({
    models: { list: mockList },
    chat: { completions: { create: mockCreate } },
  }));
  return {
    __esModule: true,
    default: MockOpenAI,
    __mockCreate: mockCreate,
    __mockList: mockList,
    __MockOpenAI: MockOpenAI,
  };
});

import { Test } from '@nestjs/testing';
import { GroqProvider } from './groq.provider';
import { AiConfig } from '../config/ai.config';
import { AI_ERRORS } from '../errors/ai.errors';

describe('GroqProvider', () => {
  let provider: GroqProvider;
  let mockCreate: jest.Mock;
  let mockList: jest.Mock;

  const mockAiConfig = {
    groqApiKey: 'gsk_test_key_1234567890abcdef',
    groqModel: 'openai/gpt-oss-120b',
    groqBaseUrl: 'https://api.groq.com/openai/v1',
    groqTemperature: 0.4,
    groqMaxOutputTokens: 2048,
    timeoutMs: 30000,
  };

  beforeAll(async () => {
    const mod = await import('openai');
    mockCreate = (mod as unknown as { __mockCreate: jest.Mock }).__mockCreate;
    mockList = (mod as unknown as { __mockList: jest.Mock }).__mockList;

    mockList.mockResolvedValue({ data: [{ id: 'openai/gpt-oss-120b' }] });

    const module = await Test.createTestingModule({
      providers: [GroqProvider, { provide: AiConfig, useValue: mockAiConfig }],
    }).compile();

    provider = module.get<GroqProvider>(GroqProvider);
    await provider.onModuleInit();
  });

  beforeEach(() => {
    if (mockCreate) {
      mockCreate.mockReset();
    }
    if (mockList) {
      mockList.mockReset();
      mockList.mockResolvedValue({ data: [] });
    }
  });

  describe('generate', () => {
    it('should return normalized response on success', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Hello from Groq' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 12, completion_tokens: 8 },
      });

      const result = await provider.generate({ prompt: 'Test prompt' });

      expect(result.text).toBe('Hello from Groq');
      expect(result.tokenUsage.input).toBe(12);
      expect(result.tokenUsage.output).toBe(8);
      expect(result.provider).toBe('groq');
      expect(result.model).toBe('openai/gpt-oss-120b');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should pass system instruction, temperature, topP, max_tokens', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
        usage: {},
      });

      await provider.generate({
        prompt: 'p',
        systemInstruction: 'Be concise',
        temperature: 0.1,
        topP: 0.5,
        maxOutputTokens: 200,
      });

      const call = mockCreate.mock.calls[0][0];
      expect(call.model).toBe('openai/gpt-oss-120b');
      expect(call.messages).toEqual([
        { role: 'system', content: 'Be concise' },
        { role: 'user', content: 'p' },
      ]);
      expect(call.temperature).toBe(0.1);
      expect(call.top_p).toBe(0.5);
      expect(call.max_tokens).toBe(200);
      expect(call.reasoning_effort).toBe('none');
    });

    it('should fall back to config defaults when request omits parameters', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
        usage: {},
      });

      await provider.generate({ prompt: 'p' });

      const call = mockCreate.mock.calls[0][0];
      expect(call.temperature).toBe(0.4);
      expect(call.max_tokens).toBe(2048);
      expect(call.messages).toEqual([{ role: 'user', content: 'p' }]);
    });

    it('should handle missing usage gracefully', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
      });

      const result = await provider.generate({ prompt: 'p' });

      expect(result.tokenUsage.input).toBe(0);
      expect(result.tokenUsage.output).toBe(0);
    });

    it('should handle missing choices gracefully', async () => {
      mockCreate.mockResolvedValue({ usage: { prompt_tokens: 1, completion_tokens: 1 } });

      const result = await provider.generate({ prompt: 'p' });

      expect(result.text).toBe('');
    });

    it('should throw AUTHENTICATION_FAILED on 401', async () => {
      mockCreate.mockRejectedValue({ status: 401, message: 'Unauthorized' });
      await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
        AI_ERRORS.AUTHENTICATION_FAILED.message,
      );
    });

    it('should throw AUTHENTICATION_FAILED on 403', async () => {
      mockCreate.mockRejectedValue({ status: 403, message: 'Forbidden' });
      await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
        AI_ERRORS.AUTHENTICATION_FAILED.message,
      );
    });

    it('should throw INVALID_MODEL on 404', async () => {
      mockCreate.mockRejectedValue({ status: 404, message: 'model not found' });
      await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
        AI_ERRORS.INVALID_MODEL.message,
      );
    });

    it('should throw QUOTA_EXCEEDED on 429 with quota message', async () => {
      mockCreate.mockRejectedValue({ status: 429, message: 'quota exceeded' });
      await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
        AI_ERRORS.QUOTA_EXCEEDED.message,
      );
    });

    it('should throw RATE_LIMIT_EXCEEDED on 429 without quota message', async () => {
      mockCreate.mockRejectedValue({ status: 429, message: 'Too many requests' });
      await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
        AI_ERRORS.RATE_LIMIT_EXCEEDED.message,
      );
    });

    it('should throw MALFORMED_REQUEST on 400', async () => {
      mockCreate.mockRejectedValue({ status: 400, message: 'invalid argument' });
      await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
        AI_ERRORS.MALFORMED_REQUEST.message,
      );
    });

    it('should throw PROVIDER_UNAVAILABLE on 5xx', async () => {
      mockCreate.mockRejectedValue({ status: 503, message: 'unavailable' });
      await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
        AI_ERRORS.PROVIDER_UNAVAILABLE.message,
      );
    });

    it('should throw NETWORK_ERROR on connection failure', async () => {
      const networkError = Object.assign(new Error('fetch failed'), {
        cause: { code: 'ENOTFOUND' },
      });
      mockCreate.mockRejectedValue(networkError);
      await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
        AI_ERRORS.NETWORK_ERROR.message,
      );
    });

    it('should throw REQUEST_TIMEOUT on timeout', async () => {
      mockCreate.mockRejectedValue(new Error('AI request timeout'));
      await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
        AI_ERRORS.REQUEST_TIMEOUT.message,
      );
    });
  });

  describe('onModuleInit (startup validation)', () => {
    it('should pass when the API key is set and the model is reachable', async () => {
      mockList.mockResolvedValue({ data: [{ id: 'openai/gpt-oss-120b' }] });
      const freshProvider = new GroqProvider({ ...mockAiConfig } as AiConfig);
      await expect(freshProvider.onModuleInit()).resolves.toBeUndefined();
    });

    it('should fail fast when GROQ_API_KEY is missing', async () => {
      const noKeyProvider = new GroqProvider({
        ...mockAiConfig,
        groqApiKey: '',
      } as AiConfig);
      await expect(noKeyProvider.onModuleInit()).rejects.toThrow(
        AI_ERRORS.CONFIGURATION_ERROR.message,
      );
    });

    it('should fail fast when the configured model is unavailable', async () => {
      mockList.mockResolvedValue({ data: [{ id: 'llama-3.1-8b-instant' }] });
      const provider2 = new GroqProvider({ ...mockAiConfig } as AiConfig);
      await expect(provider2.onModuleInit()).rejects.toThrow(AI_ERRORS.INVALID_MODEL.message);
    });

    it('should proceed with warning when model list fails', async () => {
      const provider2 = new GroqProvider({ ...mockAiConfig } as AiConfig);
      mockList.mockRejectedValue({ status: 500, message: 'internal error' });
      await expect(provider2.onModuleInit()).resolves.toBeUndefined();
    });
  });

  describe('healthCheck', () => {
    it('should return true on success', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'OK' }, finish_reason: 'stop' }],
        usage: {},
      });
      expect(await provider.healthCheck()).toBe(true);
    });

    it('should return false on failure', async () => {
      mockCreate.mockRejectedValue({ status: 500, message: 'fail' });
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
    it('should be groq', () => {
      expect(provider.name).toBe('groq');
    });
  });
});
