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

    it('should use exact count wording instead of approximate', () => {
      const result = service.buildInterviewPrompt('Profile', 'HR', 10);
      expect(result.prompt).toContain('EXACTLY 10');
      expect(result.prompt).toContain('exactly 10');
      expect(result.prompt).not.toContain('approximately');
    });

    it('should mention exact count in system instruction', () => {
      const result = service.buildInterviewPrompt('Profile', 'MIXED', 3);
      expect(result.systemInstruction).toContain('EXACTLY the number');
    });

    it('should constrain to HR-only questions for HR mode', () => {
      const result = service.buildInterviewPrompt('Profile', 'HR', 5);
      expect(result.prompt).toContain('ALL questions MUST be of type "HR"');
      expect(result.prompt).toContain('Do NOT include TECHNICAL or COMMUNICATION');
    });

    it('should constrain to TECHNICAL-only questions for TECHNICAL mode', () => {
      const result = service.buildInterviewPrompt('Profile', 'TECHNICAL', 5);
      expect(result.prompt).toContain('ALL questions MUST be of type "TECHNICAL"');
      expect(result.prompt).toContain('Do NOT include HR or COMMUNICATION');
    });

    it('should allow mixed types for MIXED mode', () => {
      const result = service.buildInterviewPrompt('Profile', 'MIXED', 5);
      expect(result.prompt).toContain('Mix question types across TECHNICAL, HR, and COMMUNICATION');
    });
  });

  describe('buildEvaluationPrompt', () => {
    it('should include question and transcript', () => {
      const result = service.buildEvaluationPrompt('What is DI?', 'DI is a pattern...');
      expect(result.prompt).toContain('What is DI?');
      expect(result.prompt).toContain('DI is a pattern...');
    });
  });

  describe('buildAnswerEvaluationPrompt', () => {
    it('should include question text, type, and difficulty', () => {
      const result = service.buildAnswerEvaluationPrompt(
        'Explain closures',
        'TECHNICAL',
        'MEDIUM',
        ['closure', 'scope'],
        'A closure is...',
        'Profile summary',
        { wordsPerMinute: 120, confidenceScore: 80 },
      );
      expect(result.prompt).toContain('Explain closures');
      expect(result.prompt).toContain('TECHNICAL');
      expect(result.prompt).toContain('MEDIUM');
      expect(result.systemInstruction).toBeDefined();
    });

    it('should include expected keywords', () => {
      const result = service.buildAnswerEvaluationPrompt(
        'What is DI?',
        'TECHNICAL',
        'EASY',
        ['IoC', 'constructor injection'],
        'DI is...',
        '',
        {},
      );
      expect(result.prompt).toContain('IoC');
      expect(result.prompt).toContain('constructor injection');
    });

    it('should include transcript', () => {
      const result = service.buildAnswerEvaluationPrompt(
        'What is DI?',
        'TECHNICAL',
        'EASY',
        [],
        'DI decouples dependencies...',
        '',
        {},
      );
      expect(result.prompt).toContain('DI decouples dependencies...');
    });

    it('should include candidate profile summary', () => {
      const result = service.buildAnswerEvaluationPrompt(
        'Q?',
        'HR',
        'EASY',
        [],
        'A',
        'Senior dev with 5 years experience',
        {},
      );
      expect(result.prompt).toContain('Senior dev with 5 years experience');
    });

    it('should include all metrics values', () => {
      const result = service.buildAnswerEvaluationPrompt('Q?', 'TECHNICAL', 'MEDIUM', [], 'A', '', {
        wordsPerMinute: 140,
        confidenceScore: 75,
        vocabularyRichness: 0.85,
        keywordCoverage: 60,
        fillerCount: 3,
        repetitionScore: 0.1,
      });
      expect(result.prompt).toContain('Words per minute: 140');
      expect(result.prompt).toContain('Confidence score: 75');
      expect(result.prompt).toContain('Vocabulary richness: 0.85');
      expect(result.prompt).toContain('Keyword coverage: 60');
      expect(result.prompt).toContain('Filler word count: 3');
      expect(result.prompt).toContain('Repetition score: 0.1');
    });

    it('should display N/A for missing metrics', () => {
      const result = service.buildAnswerEvaluationPrompt(
        'Q?',
        'TECHNICAL',
        'MEDIUM',
        [],
        'A',
        '',
        {},
      );
      expect(result.prompt).toContain('Words per minute: N/A');
      expect(result.prompt).toContain('Confidence score: N/A');
    });

    it('should include expected JSON schema', () => {
      const result = service.buildAnswerEvaluationPrompt(
        'Q?',
        'TECHNICAL',
        'MEDIUM',
        [],
        'A',
        '',
        {},
      );
      expect(result.prompt).toContain('technicalScore');
      expect(result.prompt).toContain('communicationScore');
      expect(result.prompt).toContain('correctnessScore');
      expect(result.prompt).toContain('completenessScore');
      expect(result.prompt).toContain('strengths');
      expect(result.prompt).toContain('weaknesses');
      expect(result.prompt).toContain('missingConcepts');
      expect(result.prompt).toContain('followUpQuestions');
      expect(result.prompt).toContain('feedback');
    });

    it('should handle empty expected keywords', () => {
      const result = service.buildAnswerEvaluationPrompt(
        'Q?',
        'TECHNICAL',
        'MEDIUM',
        [],
        'A',
        '',
        {},
      );
      expect(result.prompt).toContain('None specified');
    });

    it('should handle empty profile summary', () => {
      const result = service.buildAnswerEvaluationPrompt('Q?', 'HR', 'EASY', [], 'A', '', {});
      expect(result.prompt).toContain('No profile available');
    });

    it('should handle empty transcript', () => {
      const result = service.buildAnswerEvaluationPrompt(
        'Q?',
        'COMMUNICATION',
        'HARD',
        [],
        '',
        '',
        {},
      );
      expect(result.prompt).toContain('(No transcript provided)');
    });
  });
});
