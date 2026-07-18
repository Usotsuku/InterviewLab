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
      const result = mapAiResponseToQuestions(JSON.stringify(validResponse));
      expect(result.title).toBe('Backend Developer Interview');
      expect(result.estimatedDuration).toBe(30);
      expect(result.questions).toHaveLength(3);
      expect(result.questions[0].type).toBe('TECHNICAL');
      expect(result.questions[1].type).toBe('HR');
      expect(result.questions[2].type).toBe('COMMUNICATION');
    });

    it('should extract JSON from markdown code blocks', () => {
      const wrapped = '```json\n' + JSON.stringify(validResponse) + '\n```';
      const result = mapAiResponseToQuestions(wrapped);
      expect(result.title).toBe('Backend Developer Interview');
      expect(result.questions).toHaveLength(3);
    });

    it('should handle JSON with surrounding text', () => {
      const wrapped = 'Here is the interview:\n' + JSON.stringify(validResponse) + '\nDone.';
      const result = mapAiResponseToQuestions(wrapped);
      expect(result.title).toBe('Backend Developer Interview');
    });

    it('should throw INVALID_AI_RESPONSE for invalid JSON', () => {
      expect(() => mapAiResponseToQuestions('not json at all')).toThrow();
    });

    it('should throw when title is missing', () => {
      const incomplete = JSON.stringify({
        estimatedDuration: 30,
        questions: [{ order: 1, type: 'TECHNICAL', difficulty: 'MEDIUM', text: 'Q1' }],
      });
      expect(() => mapAiResponseToQuestions(incomplete)).toThrow();
    });

    it('should throw when questions array is empty', () => {
      const response = {
        title: 'Test',
        estimatedDuration: 30,
        questions: [],
      };
      expect(() => mapAiResponseToQuestions(JSON.stringify(response))).toThrow();
    });

    it('should throw when questions is not an array', () => {
      const response = {
        title: 'Test',
        estimatedDuration: 30,
        questions: 'not an array',
      };
      expect(() => mapAiResponseToQuestions(JSON.stringify(response))).toThrow();
    });

    it('should throw when question type is invalid', () => {
      const response = {
        title: 'Test',
        estimatedDuration: 30,
        questions: [{ order: 1, type: 'INVALID', difficulty: 'MEDIUM', text: 'Q1' }],
      };
      expect(() => mapAiResponseToQuestions(JSON.stringify(response))).toThrow();
    });

    it('should throw when question difficulty is invalid', () => {
      const response = {
        title: 'Test',
        estimatedDuration: 30,
        questions: [{ order: 1, type: 'TECHNICAL', difficulty: 'IMPOSSIBLE', text: 'Q1' }],
      };
      expect(() => mapAiResponseToQuestions(JSON.stringify(response))).toThrow();
    });

    it('should throw when question text is empty', () => {
      const response = {
        title: 'Test',
        estimatedDuration: 30,
        questions: [{ order: 1, type: 'TECHNICAL', difficulty: 'MEDIUM', text: '' }],
      };
      expect(() => mapAiResponseToQuestions(JSON.stringify(response))).toThrow();
    });

    it('should throw when estimatedDuration is not positive', () => {
      const response = {
        title: 'Test',
        estimatedDuration: -5,
        questions: [{ order: 1, type: 'TECHNICAL', difficulty: 'MEDIUM', text: 'Q1' }],
      };
      expect(() => mapAiResponseToQuestions(JSON.stringify(response))).toThrow();
    });

    it('should trim whitespace from text', () => {
      const response = {
        title: 'Test',
        estimatedDuration: 30,
        questions: [
          { order: 1, type: 'TECHNICAL', difficulty: 'MEDIUM', text: '  Question with spaces  ' },
        ],
      };
      const result = mapAiResponseToQuestions(JSON.stringify(response));
      expect(result.questions[0].text).toBe('Question with spaces');
    });
  });
});
