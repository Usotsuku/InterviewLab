import { Test, TestingModule } from '@nestjs/testing';
import { PromptService } from './prompt.service';

describe('PromptService', () => {
  let service: PromptService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptService],
    }).compile();

    service = module.get<PromptService>(PromptService);
  });

  describe('buildCvPrompt', () => {
    it('should include CV text in prompt', () => {
      const result = service.buildCvPrompt('John Doe, 5 years experience...');
      expect(result.prompt).toContain('John Doe, 5 years experience...');
      expect(result.systemInstruction).toBeDefined();
    });
  });

  describe('buildInterviewPrompt', () => {
    it('should include profile summary, mode, and count', () => {
      const result = service.buildInterviewPrompt('Experienced dev', 'TECHNICAL', 5);
      expect(result.prompt).toContain('5');
      expect(result.prompt).toContain('TECHNICAL');
      expect(result.prompt).toContain('Experienced dev');
    });
  });

  describe('buildEvaluationPrompt', () => {
    it('should include question and transcript', () => {
      const result = service.buildEvaluationPrompt('What is DI?', 'DI is a pattern...');
      expect(result.prompt).toContain('What is DI?');
      expect(result.prompt).toContain('DI is a pattern...');
    });
  });
});
