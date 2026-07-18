import { parseAndValidate, AiEvaluationInput } from './evaluation.mapper';

describe('EvaluationMapper', () => {
  const baseInput: AiEvaluationInput = {
    answerId: 'answer-123',
    interviewId: 'interview-456',
    rawAiResponse: '{"technicalScore":50,"communicationScore":50,"correctnessScore":50,"completenessScore":50,"strengths":[],"weaknesses":[],"missingConcepts":[],"followUpQuestions":[],"feedback":""}',
    promptUsed: 'test prompt',
    provider: 'gemini',
  };

  describe('parseAndValidate', () => {
    it('should parse a valid AI response with all fields', () => {
      const input: AiEvaluationInput = {
        ...baseInput,
        rawAiResponse: JSON.stringify({
          technicalScore: 85,
          communicationScore: 90,
          correctnessScore: 80,
          completenessScore: 75,
          strengths: ['Clear explanation'],
          weaknesses: ['Missed edge cases'],
          missingConcepts: ['Error handling'],
          followUpQuestions: ['Can you elaborate?'],
          feedback: 'Solid answer overall.',
        }),
        tokensUsed: 500,
        evaluationDurationMs: 1200,
      };

      const result = parseAndValidate(input);

      expect(result.technicalScore).toBe(85);
      expect(result.communicationScore).toBe(90);
      expect(result.correctnessScore).toBe(80);
      expect(result.completenessScore).toBe(75);
      expect(result.strengths).toEqual(['Clear explanation']);
      expect(result.weaknesses).toEqual(['Missed edge cases']);
      expect(result.missingConcepts).toEqual(['Error handling']);
      expect(result.followUpQuestions).toEqual(['Can you elaborate?']);
      expect(result.feedback).toBe('Solid answer overall.');
      expect(result.tokensUsed).toBe(500);
      expect(result.evaluationDurationMs).toBe(1200);
      expect(result.provider).toBe('gemini');
      expect(result.answerId).toBe('answer-123');
      expect(result.interviewId).toBe('interview-456');
    });

    it('should handle response wrapped in markdown code blocks', () => {
      const input: AiEvaluationInput = {
        ...baseInput,
        rawAiResponse: '```json\n{"technicalScore": 70, "communicationScore": 80, "correctnessScore": 65, "completenessScore": 60, "strengths": ["Good"], "weaknesses": ["Needs work"], "missingConcepts": [], "followUpQuestions": [], "feedback": "OK answer"}\n```',
      };

      const result = parseAndValidate(input);

      expect(result.technicalScore).toBe(70);
      expect(result.communicationScore).toBe(80);
      expect(result.correctnessScore).toBe(65);
      expect(result.completenessScore).toBe(60);
    });

    it('should handle response with extra text before/after JSON', () => {
      const input: AiEvaluationInput = {
        ...baseInput,
        rawAiResponse: 'Here is the evaluation:\n{"technicalScore": 50, "communicationScore": 60, "correctnessScore": 55, "completenessScore": 45, "strengths": ["A"], "weaknesses": ["B"], "missingConcepts": [], "followUpQuestions": [], "feedback": "Fair"}\nHope this helps!',
      };

      const result = parseAndValidate(input);

      expect(result.technicalScore).toBe(50);
      expect(result.communicationScore).toBe(60);
    });

    it('should clamp scores above 100 to 100', () => {
      const input: AiEvaluationInput = {
        ...baseInput,
        rawAiResponse: JSON.stringify({
          technicalScore: 120,
          communicationScore: 150,
          correctnessScore: 200,
          completenessScore: 110,
          strengths: [],
          weaknesses: [],
          missingConcepts: [],
          followUpQuestions: [],
          feedback: '',
        }),
      };

      const result = parseAndValidate(input);

      expect(result.technicalScore).toBe(100);
      expect(result.communicationScore).toBe(100);
      expect(result.correctnessScore).toBe(100);
      expect(result.completenessScore).toBe(100);
    });

    it('should clamp negative scores to 0', () => {
      const input: AiEvaluationInput = {
        ...baseInput,
        rawAiResponse: JSON.stringify({
          technicalScore: -10,
          communicationScore: -5,
          correctnessScore: -1,
          completenessScore: -50,
          strengths: [],
          weaknesses: [],
          missingConcepts: [],
          followUpQuestions: [],
          feedback: '',
        }),
      };

      const result = parseAndValidate(input);

      expect(result.technicalScore).toBe(0);
      expect(result.communicationScore).toBe(0);
      expect(result.correctnessScore).toBe(0);
      expect(result.completenessScore).toBe(0);
    });

    it('should default to 0 for missing score fields', () => {
      const input: AiEvaluationInput = {
        ...baseInput,
        rawAiResponse: JSON.stringify({
          strengths: [],
          weaknesses: [],
          missingConcepts: [],
          followUpQuestions: [],
          feedback: '',
        }),
      };

      const result = parseAndValidate(input);

      expect(result.technicalScore).toBe(0);
      expect(result.communicationScore).toBe(0);
      expect(result.correctnessScore).toBe(0);
      expect(result.completenessScore).toBe(0);
    });

    it('should default to 0 for non-numeric score fields', () => {
      const input: AiEvaluationInput = {
        ...baseInput,
        rawAiResponse: JSON.stringify({
          technicalScore: 'high',
          communicationScore: null,
          correctnessScore: undefined,
          completenessScore: {},
          strengths: [],
          weaknesses: [],
          missingConcepts: [],
          followUpQuestions: [],
          feedback: '',
        }),
      };

      const result = parseAndValidate(input);

      expect(result.technicalScore).toBe(0);
      expect(result.communicationScore).toBe(0);
      expect(result.correctnessScore).toBe(0);
      expect(result.completenessScore).toBe(0);
    });

    it('should filter non-string items from arrays', () => {
      const input: AiEvaluationInput = {
        ...baseInput,
        rawAiResponse: JSON.stringify({
          technicalScore: 50,
          communicationScore: 50,
          correctnessScore: 50,
          completenessScore: 50,
          strengths: ['good', 123, null, 'clear'],
          weaknesses: ['needs work', undefined],
          missingConcepts: [42, 'concept'],
          followUpQuestions: [true, 'follow up?'],
          feedback: '',
        }),
      };

      const result = parseAndValidate(input);

      expect(result.strengths).toEqual(['good', 'clear']);
      expect(result.weaknesses).toEqual(['needs work']);
      expect(result.missingConcepts).toEqual(['concept']);
      expect(result.followUpQuestions).toEqual(['follow up?']);
    });

    it('should default to empty arrays for missing array fields', () => {
      const input: AiEvaluationInput = {
        ...baseInput,
        rawAiResponse: JSON.stringify({
          technicalScore: 50,
          communicationScore: 50,
          correctnessScore: 50,
          completenessScore: 50,
        }),
      };

      const result = parseAndValidate(input);

      expect(result.strengths).toEqual([]);
      expect(result.weaknesses).toEqual([]);
      expect(result.missingConcepts).toEqual([]);
      expect(result.followUpQuestions).toEqual([]);
    });

    it('should default feedback to empty string when missing', () => {
      const input: AiEvaluationInput = {
        ...baseInput,
        rawAiResponse: JSON.stringify({
          technicalScore: 50,
          communicationScore: 50,
          correctnessScore: 50,
          completenessScore: 50,
          strengths: [],
          weaknesses: [],
          missingConcepts: [],
          followUpQuestions: [],
        }),
      };

      const result = parseAndValidate(input);

      expect(result.feedback).toBe('');
    });

    it('should default tokensUsed and evaluationDurationMs to 0 when not provided', () => {
      const input: AiEvaluationInput = {
        ...baseInput,
        rawAiResponse: JSON.stringify({
          technicalScore: 50,
          communicationScore: 50,
          correctnessScore: 50,
          completenessScore: 50,
          strengths: [],
          weaknesses: [],
          missingConcepts: [],
          followUpQuestions: [],
          feedback: '',
        }),
      };

      const result = parseAndValidate(input);

      expect(result.tokensUsed).toBe(0);
      expect(result.evaluationDurationMs).toBe(0);
    });

    it('should default provider to empty string when not provided', () => {
      const input: AiEvaluationInput = {
        answerId: 'a1',
        interviewId: 'i1',
        rawAiResponse: '{"technicalScore":50,"communicationScore":50,"correctnessScore":50,"completenessScore":50,"strengths":[],"weaknesses":[],"missingConcepts":[],"followUpQuestions":[],"feedback":""}',
        promptUsed: 'prompt',
      };

      const result = parseAndValidate(input);

      expect(result.provider).toBe('');
    });

    it('should throw when response contains no JSON object', () => {
      const input: AiEvaluationInput = {
        ...baseInput,
        rawAiResponse: 'This is just plain text with no JSON.',
      };

      expect(() => parseAndValidate(input)).toThrow();
    });

    it('should throw when JSON is malformed', () => {
      const input: AiEvaluationInput = {
        ...baseInput,
        rawAiResponse: '{"technicalScore": 50, invalid json',
      };

      expect(() => parseAndValidate(input)).toThrow();
    });

    it('should round non-integer scores within range', () => {
      const input: AiEvaluationInput = {
        ...baseInput,
        rawAiResponse: JSON.stringify({
          technicalScore: 85.7,
          communicationScore: 72.3,
          correctnessScore: 90.1,
          completenessScore: 66.6,
          strengths: [],
          weaknesses: [],
          missingConcepts: [],
          followUpQuestions: [],
          feedback: '',
        }),
      };

      const result = parseAndValidate(input);

      expect(result.technicalScore).toBe(86);
      expect(result.communicationScore).toBe(72);
      expect(result.correctnessScore).toBe(90);
      expect(result.completenessScore).toBe(67);
    });

    it('should preserve rawAiResponse and promptUsed', () => {
      const rawResponse = '{"technicalScore":50,"communicationScore":50,"correctnessScore":50,"completenessScore":50,"strengths":[],"weaknesses":[],"missingConcepts":[],"followUpQuestions":[],"feedback":"good"}';
      const input: AiEvaluationInput = {
        ...baseInput,
        rawAiResponse: rawResponse,
        promptUsed: 'my prompt text',
      };

      const result = parseAndValidate(input);

      expect(result.rawAiResponse).toBe(rawResponse);
      expect(result.promptUsed).toBe('my prompt text');
    });

    it('should handle NaN scores by defaulting to 0', () => {
      const input: AiEvaluationInput = {
        ...baseInput,
        rawAiResponse: JSON.stringify({
          technicalScore: NaN,
          communicationScore: NaN,
          correctnessScore: NaN,
          completenessScore: NaN,
          strengths: [],
          weaknesses: [],
          missingConcepts: [],
          followUpQuestions: [],
          feedback: '',
        }),
      };

      const result = parseAndValidate(input);

      expect(result.technicalScore).toBe(0);
      expect(result.communicationScore).toBe(0);
      expect(result.correctnessScore).toBe(0);
      expect(result.completenessScore).toBe(0);
    });
  });
});
