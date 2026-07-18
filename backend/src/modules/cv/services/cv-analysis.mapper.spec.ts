import { mapAiResponseToProfile, AiCvAnalysisResponse } from './cv-analysis.mapper';

describe('CvAnalysisMapper', () => {
  describe('mapAiResponseToProfile', () => {
    it('should parse a valid JSON response', () => {
      const response: AiCvAnalysisResponse = {
        summary: 'Senior software engineer with 5 years experience.',
        skills: ['JavaScript', 'TypeScript', 'Node.js'],
        technologies: ['React', 'NestJS', 'MongoDB'],
        strengths: ['Strong problem solving', 'Team leadership'],
        weaknesses: ['Limited mobile development experience'],
        experience: [
          {
            company: 'Tech Corp',
            position: 'Senior Developer',
            startDate: '2020-01-15',
            endDate: '2023-06-30',
            description: 'Led a team of 5 developers.',
          },
        ],
        projects: [
          {
            name: 'E-commerce Platform',
            description: 'Full-stack web application.',
            technologies: ['React', 'Node.js', 'MongoDB'],
            url: 'https://github.com/example/ecommerce',
          },
        ],
      };

      const result = mapAiResponseToProfile(JSON.stringify(response));

      expect(result.summary).toBe('Senior software engineer with 5 years experience.');
      expect(result.skills).toEqual(['JavaScript', 'TypeScript', 'Node.js']);
      expect(result.technologies).toEqual(['React', 'NestJS', 'MongoDB']);
      expect(result.strengths).toEqual(['Strong problem solving', 'Team leadership']);
      expect(result.weaknesses).toEqual(['Limited mobile development experience']);
      expect(result.experience).toHaveLength(1);
      expect(result.experience[0].company).toBe('Tech Corp');
      expect(result.experience[0].startDate).toBeInstanceOf(Date);
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].name).toBe('E-commerce Platform');
    });

    it('should extract JSON from markdown code blocks', () => {
      const response: AiCvAnalysisResponse = {
        summary: 'Test summary',
        skills: ['skill1'],
        technologies: ['tech1'],
        strengths: ['strength1'],
        weaknesses: ['weakness1'],
        experience: [],
        projects: [],
      };

      const wrapped = '```json\n' + JSON.stringify(response) + '\n```';
      const result = mapAiResponseToProfile(wrapped);

      expect(result.summary).toBe('Test summary');
      expect(result.skills).toEqual(['skill1']);
    });

    it('should handle JSON with surrounding text', () => {
      const response: AiCvAnalysisResponse = {
        summary: 'Test',
        skills: ['a'],
        technologies: ['b'],
        strengths: ['c'],
        weaknesses: ['d'],
        experience: [],
        projects: [],
      };

      const wrapped = 'Here is the analysis:\n' + JSON.stringify(response) + '\nDone.';
      const result = mapAiResponseToProfile(wrapped);

      expect(result.summary).toBe('Test');
    });

    it('should throw INVALID_AI_RESPONSE for invalid JSON', () => {
      expect(() => mapAiResponseToProfile('not json at all')).toThrow();
    });

    it('should throw INVALID_AI_RESPONSE when required fields are missing', () => {
      const incomplete = JSON.stringify({ summary: 'test' });
      expect(() => mapAiResponseToProfile(incomplete)).toThrow();
    });

    it('should throw INVALID_AI_RESPONSE when skills is not an array', () => {
      const response = {
        summary: 'test',
        skills: 'not an array',
        technologies: ['tech'],
        strengths: ['str'],
        weaknesses: ['weak'],
      };
      expect(() => mapAiResponseToProfile(JSON.stringify(response))).toThrow();
    });

    it('should handle missing experience and projects gracefully', () => {
      const response: AiCvAnalysisResponse = {
        summary: 'Test',
        skills: ['a'],
        technologies: ['b'],
        strengths: ['c'],
        weaknesses: ['d'],
        experience: undefined as unknown as AiCvAnalysisResponse['experience'],
        projects: undefined as unknown as AiCvAnalysisResponse['projects'],
      };

      const result = mapAiResponseToProfile(JSON.stringify(response));
      expect(result.experience).toEqual([]);
      expect(result.projects).toEqual([]);
    });

    it('should handle experience with null end date', () => {
      const response: AiCvAnalysisResponse = {
        summary: 'Test',
        skills: ['a'],
        technologies: ['b'],
        strengths: ['c'],
        weaknesses: ['d'],
        experience: [
          {
            company: 'Current Corp',
            position: 'Developer',
            startDate: '2023-01-01',
            endDate: null,
            description: 'Current role',
          },
        ],
        projects: [],
      };

      const result = mapAiResponseToProfile(JSON.stringify(response));
      expect(result.experience[0].endDate).toBeUndefined();
    });

    it('should convert all values to strings in arrays', () => {
      const response = {
        summary: 'Test',
        skills: [123, true, 'valid'],
        technologies: ['a'],
        strengths: ['b'],
        weaknesses: ['c'],
        experience: [],
        projects: [],
      };

      const result = mapAiResponseToProfile(JSON.stringify(response));
      expect(result.skills).toEqual(['123', 'true', 'valid']);
    });
  });
});
