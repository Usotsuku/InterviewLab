import { mapAiResponseToQuestions, AiInterviewResponse } from './question.mapper';

describe('QuestionMapper', () => {
  describe('mapAiResponseToQuestions', () => {
    const validResponse: AiInterviewResponse = {
      title: 'Backend Developer Interview',
      estimatedDuration: 30,
      questions: [
        {
          order: 1,
          type: 'TECHNICAL',
          difficulty: 'MEDIUM',
          text: 'Explain Dependency Injection.',
        },
        { order: 2, type: 'HR', difficulty: 'EASY', text: 'Tell me about yourself.' },
        {
          order: 3,
          type: 'COMMUNICATION',
          difficulty: 'MEDIUM',
          text: 'How do you handle disagreements?',
        },
      ],
    };

    it('should parse a valid JSON response', () => {
      const result = mapAiResponseToQuestions(JSON.stringify(validResponse), 3);
      expect(result.title).toBe('Backend Developer Interview');
      expect(result.estimatedDuration).toBe(30);
      expect(result.questions).toHaveLength(3);
      expect(result.questions[0].type).toBe('TECHNICAL');
      expect(result.questions[1].type).toBe('HR');
      expect(result.questions[2].type).toBe('COMMUNICATION');
    });

    it('should extract expectedKeywords from questions when present', () => {
      const withKeywords: AiInterviewResponse = {
        title: 'Test',
        estimatedDuration: 30,
        questions: [
          {
            order: 1,
            type: 'TECHNICAL',
            difficulty: 'MEDIUM',
            text: 'Explain DI.',
            expectedKeywords: ['dependency injection', 'IoC', 'inversion of control'],
          },
          {
            order: 2,
            type: 'HR',
            difficulty: 'EASY',
            text: 'Tell me about yourself.',
          },
        ],
      };
      const result = mapAiResponseToQuestions(JSON.stringify(withKeywords), 2);
      expect(result.questions[0].expectedKeywords).toEqual([
        'dependency injection',
        'IoC',
        'inversion of control',
      ]);
      expect(result.questions[1].expectedKeywords).toEqual([]);
    });

    it('should extract JSON from markdown code blocks', () => {
      const wrapped = '```json\n' + JSON.stringify(validResponse) + '\n```';
      const result = mapAiResponseToQuestions(wrapped, 3);
      expect(result.title).toBe('Backend Developer Interview');
      expect(result.questions).toHaveLength(3);
    });

    it('should handle JSON with surrounding text', () => {
      const wrapped = 'Here is the interview:\n' + JSON.stringify(validResponse) + '\nDone.';
      const result = mapAiResponseToQuestions(wrapped, 3);
      expect(result.title).toBe('Backend Developer Interview');
    });

    it('should throw INVALID_AI_RESPONSE for invalid JSON', () => {
      expect(() => mapAiResponseToQuestions('not json at all', 3)).toThrow();
    });

    it('should throw when title is missing', () => {
      const incomplete = JSON.stringify({
        estimatedDuration: 30,
        questions: [{ order: 1, type: 'TECHNICAL', difficulty: 'MEDIUM', text: 'Q1' }],
      });
      expect(() => mapAiResponseToQuestions(incomplete, 1)).toThrow();
    });

    it('should throw when questions array is empty', () => {
      const response = {
        title: 'Test',
        estimatedDuration: 30,
        questions: [],
      };
      expect(() => mapAiResponseToQuestions(JSON.stringify(response), 5)).toThrow();
    });

    it('should throw when questions is not an array', () => {
      const response = {
        title: 'Test',
        estimatedDuration: 30,
        questions: 'not an array',
      };
      expect(() => mapAiResponseToQuestions(JSON.stringify(response), 5)).toThrow();
    });

    it('should throw when question type is invalid', () => {
      const response = {
        title: 'Test',
        estimatedDuration: 30,
        questions: [{ order: 1, type: 'INVALID', difficulty: 'MEDIUM', text: 'Q1' }],
      };
      expect(() => mapAiResponseToQuestions(JSON.stringify(response), 1)).toThrow();
    });

    it('should throw when question difficulty is invalid', () => {
      const response = {
        title: 'Test',
        estimatedDuration: 30,
        questions: [{ order: 1, type: 'TECHNICAL', difficulty: 'IMPOSSIBLE', text: 'Q1' }],
      };
      expect(() => mapAiResponseToQuestions(JSON.stringify(response), 1)).toThrow();
    });

    it('should throw when question text is empty', () => {
      const response = {
        title: 'Test',
        estimatedDuration: 30,
        questions: [{ order: 1, type: 'TECHNICAL', difficulty: 'MEDIUM', text: '' }],
      };
      expect(() => mapAiResponseToQuestions(JSON.stringify(response), 1)).toThrow();
    });

    it('should throw when estimatedDuration is not positive', () => {
      const response = {
        title: 'Test',
        estimatedDuration: -5,
        questions: [{ order: 1, type: 'TECHNICAL', difficulty: 'MEDIUM', text: 'Q1' }],
      };
      expect(() => mapAiResponseToQuestions(JSON.stringify(response), 1)).toThrow();
    });

    it('should throw when question count does not match expected', () => {
      const response = {
        title: 'Test',
        estimatedDuration: 30,
        questions: [
          { order: 1, type: 'TECHNICAL', difficulty: 'MEDIUM', text: 'Q1' },
          { order: 2, type: 'HR', difficulty: 'EASY', text: 'Q2' },
        ],
      };
      expect(() => mapAiResponseToQuestions(JSON.stringify(response), 5)).toThrow();
    });

    it('should default expectedCount to 5 when not provided', () => {
      const fiveQuestions = {
        title: 'Test',
        estimatedDuration: 30,
        questions: Array.from({ length: 5 }, (_, i) => ({
          order: i + 1,
          type: 'TECHNICAL',
          difficulty: 'MEDIUM',
          text: `Question ${i + 1}`,
        })),
      };
      const result = mapAiResponseToQuestions(JSON.stringify(fiveQuestions));
      expect(result.questions).toHaveLength(5);
    });

    it('should trim whitespace from text', () => {
      const response = {
        title: 'Test',
        estimatedDuration: 30,
        questions: [
          { order: 1, type: 'TECHNICAL', difficulty: 'MEDIUM', text: '  Question with spaces  ' },
        ],
      };
      const result = mapAiResponseToQuestions(JSON.stringify(response), 1);
      expect(result.questions[0].text).toBe('Question with spaces');
    });
  });
});
