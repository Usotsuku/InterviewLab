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

import OpenAI from 'openai';
import { Test } from '@nestjs/testing';
import { KimiProvider } from './kimi.provider';
import { AiConfig } from '../config/ai.config';
import { AI_ERRORS } from '../errors/ai.errors';

describe('KimiProvider', () => {
  let provider: KimiProvider;
  let mockCreate: jest.Mock;
  let mockList: jest.Mock;

  const mockAiConfig = {
    kimiApiKey: 'test-kimi-key',
    kimiModel: 'kimi-k2.6',
    kimiBaseUrl: 'https://api.moonshot.ai/v1',
    kimiTemperature: 0.4,
    kimiMaxOutputTokens: 2048,
    timeoutMs: 30000,
  };

  beforeAll(async () => {
    const mod = await import('openai');
    mockCreate = (mod as unknown as { __mockCreate: jest.Mock }).__mockCreate;
    mockList = (mod as unknown as { __mockList: jest.Mock }).__mockList;

    mockList.mockResolvedValue({ data: [{ id: 'kimi-k2.6' }] });

    const module = await Test.createTestingModule({
      providers: [KimiProvider, { provide: AiConfig, useValue: mockAiConfig }],
    }).compile();

    provider = module.get<KimiProvider>(KimiProvider);
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
        choices: [{ message: { content: 'Hello from kimi' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 12, completion_tokens: 8 },
      });

      const result = await provider.generate({ prompt: 'Test prompt' });

      expect(result.text).toBe('Hello from kimi');
      expect(result.tokenUsage.input).toBe(12);
      expect(result.tokenUsage.output).toBe(8);
      expect(result.provider).toBe('kimi');
      expect(result.model).toBe('kimi-k2.6');
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
      expect(call.model).toBe('kimi-k2.6');
      expect(call.messages).toEqual([
        { role: 'system', content: 'Be concise' },
        { role: 'user', content: 'p' },
      ]);
      expect(call.temperature).toBe(0.1);
      expect(call.top_p).toBe(0.5);
      expect(call.max_tokens).toBe(200);
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
      mockList.mockResolvedValue({ data: [{ id: 'kimi-k2.6' }] });
      await expect(provider.onModuleInit()).resolves.toBeUndefined();
    });

    it('should fail fast when KIMI_API_KEY is missing', async () => {
      const noKeyProvider = new KimiProvider({
        ...mockAiConfig,
        kimiApiKey: '',
      } as AiConfig);
      await expect(noKeyProvider.onModuleInit()).rejects.toThrow(
        AI_ERRORS.CONFIGURATION_ERROR.message,
      );
    });

    it('should fail fast when the configured model is unavailable', async () => {
      mockList.mockResolvedValue({ data: [{ id: 'kimi-k2.5' }] });
      await expect(provider.onModuleInit()).rejects.toThrow(AI_ERRORS.INVALID_MODEL.message);
    });

    it('should proceed with warning when model list fails', async () => {
      mockList.mockRejectedValue({ status: 500, message: 'internal error' });
      await expect(provider.onModuleInit()).resolves.toBeUndefined();
    });
  });

  describe('healthCheck', () => {
    it('should return true on success', async () => {
      const freshProvider = new KimiProvider(mockAiConfig as AiConfig);
      jest.spyOn(freshProvider, 'generate').mockResolvedValue({
        text: 'OK',
        tokenUsage: { input: 0, output: 1 },
        provider: 'kimi',
        model: 'test',
        durationMs: 1,
      });
      expect(await freshProvider.healthCheck()).toBe(true);
    });

    it('should return false on failure', async () => {
      const freshProvider = new KimiProvider(mockAiConfig as AiConfig);
      jest.spyOn(freshProvider, 'generate').mockRejectedValue(new Error('fail'));
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
    it('should be kimi', () => {
      expect(provider.name).toBe('kimi');
    });
  });
});
