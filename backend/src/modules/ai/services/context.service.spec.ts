import { Test, TestingModule } from '@nestjs/testing';
import { ContextService } from './context.service';
import { AiConfig } from '../config/ai.config';

describe('ContextService', () => {
  let service: ContextService;

  const mockAiConfig = {
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    temperature: 0.4,
    maxOutputTokens: 8192,
    topP: 0.95,
    topK: 40,
    timeoutMs: 45000,
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContextService, { provide: AiConfig, useValue: mockAiConfig }],
    }).compile();

    service = module.get<ContextService>(ContextService);
  });

  describe('buildContext', () => {
    it('should return default context from config', () => {
      const ctx = service.buildContext();
      expect(ctx.provider).toBe('gemini');
      expect(ctx.model).toBe('gemini-1.5-pro');
      expect(ctx.temperature).toBe(0.4);
      expect(ctx.maxOutputTokens).toBe(8192);
      expect(ctx.topP).toBe(0.95);
      expect(ctx.topK).toBe(40);
      expect(ctx.timeoutMs).toBe(45000);
    });

    it('should allow temperature override', () => {
      const ctx = service.buildContext({ temperature: 0.8 });
      expect(ctx.temperature).toBe(0.8);
    });

    it('should allow maxTokens override', () => {
      const ctx = service.buildContext({ maxOutputTokens: 1024 });
      expect(ctx.maxOutputTokens).toBe(1024);
    });
  });

  describe('buildRequest', () => {
    it('should build a GenerateRequest', () => {
      const req = service.buildRequest('Test prompt', 'System instruction');
      expect(req.prompt).toBe('Test prompt');
      expect(req.systemInstruction).toBe('System instruction');
    });

    it('should build request without system instruction', () => {
      const req = service.buildRequest('Test prompt');
      expect(req.systemInstruction).toBeUndefined();
    });
  });

  describe('getSafetySettings', () => {
    it('should return safety settings array', () => {
      const settings = service.getSafetySettings();
      expect(settings.length).toBe(4);
      expect(settings[0].category).toBe('HARM_CATEGORY_HARASSMENT');
    });
  });
});
