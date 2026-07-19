import { Test, TestingModule } from '@nestjs/testing';
import { AnswerEvaluationService } from './answer-evaluation.service';
import { AIService } from './ai.service';
import { PromptService } from './prompt.service';
import { AiEvaluationRepository } from '../repositories/ai-evaluation.repository';
import { AnswerRepository } from '@modules/answer/repositories/answer.repository';
import { QuestionRepository } from '@modules/question/repositories/question.repository';
import { CandidateProfileRepository } from '@modules/candidate-profile/repositories/candidate-profile.repository';
import { InterviewMetricsRepository } from '@modules/metrics/repositories/interview-metrics.repository';
import { InterviewRepository } from '@modules/interview/repositories/interview.repository';
import { Types } from 'mongoose';

const mockAnswerDoc = {
  _id: new Types.ObjectId('666666666666666666666601'),
  interviewId: new Types.ObjectId('666666666666666666666602'),
  questionId: new Types.ObjectId('666666666666666666666603'),
  transcript: 'I would use dependency injection to decouple...',
  audioUrl: null,
  durationSeconds: 45,
};

const mockQuestionDoc = {
  _id: new Types.ObjectId('666666666666666666666603'),
  text: 'Explain dependency injection',
  type: 'TECHNICAL',
  difficulty: 'MEDIUM',
  expectedKeywords: ['DI', 'IoC', 'containers'],
};

const mockInterviewDoc = {
  _id: new Types.ObjectId('666666666666666666666602'),
  userId: new Types.ObjectId('666666666666666666666604'),
};

const mockProfileDoc = {
  userId: new Types.ObjectId('666666666666666666666604'),
  summary: 'Senior backend developer',
  skills: ['TypeScript', 'NestJS', 'MongoDB'],
  technologies: ['Node.js', 'Docker', 'AWS'],
};

const mockMetricsDoc = {
  wordsPerMinute: 140,
  confidenceScore: 75,
  vocabularyRichness: 0.85,
  keywordCoverage: 60,
  fillerCount: 3,
  repetitionScore: 0.1,
};

const validAiResponse = JSON.stringify({
  technicalScore: 80,
  communicationScore: 85,
  correctnessScore: 75,
  completenessScore: 70,
  strengths: ['Good explanation of DI basics'],
  weaknesses: ['Missed IoC container details'],
  missingConcepts: ['Constructor injection vs property injection'],
  followUpQuestions: ['How does this differ from service locator?'],
  feedback: 'Solid understanding demonstrated.',
});

describe('AnswerEvaluationService', () => {
  let service: AnswerEvaluationService;
  let mockAiService: jest.Mocked<AIService>;
  let mockPromptService: jest.Mocked<PromptService>;
  let mockEvaluationRepo: jest.Mocked<AiEvaluationRepository>;
  let mockAnswerRepo: jest.Mocked<AnswerRepository>;
  let mockQuestionRepo: jest.Mocked<QuestionRepository>;
  let mockCandidateProfileRepo: jest.Mocked<CandidateProfileRepository>;
  let mockInterviewRepo: jest.Mocked<InterviewRepository>;
  let mockMetricsRepo: jest.Mocked<InterviewMetricsRepository>;

  beforeEach(async () => {
    mockAiService = {
      generate: jest.fn().mockResolvedValue({
        text: validAiResponse,
        tokenUsage: { input: 200, output: 300 },
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        durationMs: 1500,
      }),
    } as unknown as jest.Mocked<AIService>;

    mockPromptService = {
      buildAnswerEvaluationPrompt: jest.fn().mockReturnValue({
        prompt: 'Evaluate this answer...',
        systemInstruction: 'You are an expert evaluator.',
      }),
    } as unknown as jest.Mocked<PromptService>;

    mockEvaluationRepo = {
      create: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AiEvaluationRepository>;

    mockAnswerRepo = {
      findById: jest.fn().mockResolvedValue(mockAnswerDoc),
    } as unknown as jest.Mocked<AnswerRepository>;

    mockQuestionRepo = {
      findById: jest.fn().mockResolvedValue(mockQuestionDoc),
    } as unknown as jest.Mocked<QuestionRepository>;

    mockInterviewRepo = {
      findById: jest.fn().mockResolvedValue(mockInterviewDoc),
    } as unknown as jest.Mocked<InterviewRepository>;

    mockCandidateProfileRepo = {
      findByUserId: jest.fn().mockResolvedValue(mockProfileDoc),
    } as unknown as jest.Mocked<CandidateProfileRepository>;

    mockMetricsRepo = {
      findByAnswerId: jest.fn().mockResolvedValue(mockMetricsDoc),
    } as unknown as jest.Mocked<InterviewMetricsRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswerEvaluationService,
        { provide: AIService, useValue: mockAiService },
        { provide: PromptService, useValue: mockPromptService },
        { provide: AiEvaluationRepository, useValue: mockEvaluationRepo },
        { provide: AnswerRepository, useValue: mockAnswerRepo },
        { provide: QuestionRepository, useValue: mockQuestionRepo },
        { provide: CandidateProfileRepository, useValue: mockCandidateProfileRepo },
        { provide: InterviewRepository, useValue: mockInterviewRepo },
        { provide: InterviewMetricsRepository, useValue: mockMetricsRepo },
      ],
    }).compile();

    service = module.get<AnswerEvaluationService>(AnswerEvaluationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('evaluate', () => {
    it('should return evaluation with all scores and metadata', async () => {
      const result = await service.evaluate({ answerId: '666666666666666666666601' });

      expect(result.technicalScore).toBe(80);
      expect(result.communicationScore).toBe(85);
      expect(result.correctnessScore).toBe(75);
      expect(result.completenessScore).toBe(70);
      expect(result.strengths).toEqual(['Good explanation of DI basics']);
      expect(result.weaknesses).toEqual(['Missed IoC container details']);
      expect(result.missingConcepts).toEqual(['Constructor injection vs property injection']);
      expect(result.followUpQuestions).toEqual(['How does this differ from service locator?']);
      expect(result.feedback).toBe('Solid understanding demonstrated.');
      expect(result.answerId).toBe('666666666666666666666601');
    });

    it('should persist evaluation to repository', async () => {
      await service.evaluate({ answerId: '666666666666666666666601' });

      expect(mockEvaluationRepo.create).toHaveBeenCalledTimes(1);
      const createArg = mockEvaluationRepo.create.mock.calls[0][0];
      expect(createArg.technicalScore).toBe(80);
      expect(createArg.communicationScore).toBe(85);
      expect(createArg.correctnessScore).toBe(75);
      expect(createArg.completenessScore).toBe(70);
      expect(createArg.provider).toBe('gemini');
    });

    it('should persist null technicalScore when AI omits it (HR/COMMUNICATION questions)', async () => {
      const hrResponse = JSON.stringify({
        communicationScore: 85,
        correctnessScore: 75,
        completenessScore: 70,
        strengths: ['Good interpersonal skills'],
        weaknesses: ['Could be more specific'],
        missingConcepts: [],
        followUpQuestions: [],
        feedback: 'Good answer.',
      });

      mockAiService.generate.mockResolvedValueOnce({
        text: hrResponse,
        tokenUsage: { input: 100, output: 200 },
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        durationMs: 1000,
      });

      await service.evaluate({ answerId: '666666666666666666666601' });

      const createArg = mockEvaluationRepo.create.mock.calls[0][0];
      expect(createArg.technicalScore).toBeNull();
      expect(createArg.communicationScore).toBe(85);
    });

    it('should load answer, question, interview, and profile data', async () => {
      await service.evaluate({ answerId: '666666666666666666666601' });

      expect(mockAnswerRepo.findById).toHaveBeenCalledWith('666666666666666666666601');
      expect(mockQuestionRepo.findById).toHaveBeenCalledWith(mockAnswerDoc.questionId.toString());
      expect(mockInterviewRepo.findById).toHaveBeenCalledWith(mockAnswerDoc.interviewId.toString());
      expect(mockCandidateProfileRepo.findByUserId).toHaveBeenCalledWith(
        mockInterviewDoc.userId.toString(),
      );
      expect(mockMetricsRepo.findByAnswerId).toHaveBeenCalledWith('666666666666666666666601');
    });

    it('should call prompt service with correct arguments', async () => {
      await service.evaluate({ answerId: '666666666666666666666601' });

      expect(mockPromptService.buildAnswerEvaluationPrompt).toHaveBeenCalledWith(
        'Explain dependency injection',
        'TECHNICAL',
        'MEDIUM',
        ['DI', 'IoC', 'containers'],
        'I would use dependency injection to decouple...',
        expect.any(String),
        {
          wordsPerMinute: 140,
          confidenceScore: 75,
          vocabularyRichness: 0.85,
          keywordCoverage: 60,
          fillerCount: 3,
          repetitionScore: 0.1,
        },
      );
    });

    it('should call AI service generate with prompt payload', async () => {
      await service.evaluate({ answerId: '666666666666666666666601' });

      expect(mockAiService.generate).toHaveBeenCalledWith({
        prompt: 'Evaluate this answer...',
        systemInstruction: 'You are an expert evaluator.',
      });
    });

    it('should include candidate summary in prompt', async () => {
      await service.evaluate({ answerId: '666666666666666666666601' });

      const promptArg = mockPromptService.buildAnswerEvaluationPrompt.mock.calls[0][5];
      expect(promptArg).toContain('Senior backend developer');
      expect(promptArg).toContain('TypeScript');
      expect(promptArg).toContain('NestJS');
    });

    it('should handle missing answer document', async () => {
      mockAnswerRepo.findById.mockResolvedValueOnce(null);

      await expect(service.evaluate({ answerId: '000000000000000000000099' })).rejects.toThrow(
        'Answer not found: 000000000000000000000099',
      );
    });

    it('should handle missing question document gracefully', async () => {
      mockQuestionRepo.findById.mockResolvedValueOnce(null);

      const result = await service.evaluate({ answerId: '666666666666666666666601' });

      expect(result.technicalScore).toBeDefined();
      expect(mockPromptService.buildAnswerEvaluationPrompt).toHaveBeenCalledWith(
        'Unknown question',
        'UNKNOWN',
        'MEDIUM',
        [],
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    it('should handle missing interview document gracefully', async () => {
      mockInterviewRepo.findById.mockResolvedValueOnce(null);

      const result = await service.evaluate({ answerId: '666666666666666666666601' });

      expect(result.technicalScore).toBeDefined();
      expect(mockCandidateProfileRepo.findByUserId).not.toHaveBeenCalled();
    });

    it('should handle missing candidate profile gracefully', async () => {
      mockCandidateProfileRepo.findByUserId.mockResolvedValueOnce(null);

      const result = await service.evaluate({ answerId: '666666666666666666666601' });

      expect(result.technicalScore).toBeDefined();
      const promptArg = mockPromptService.buildAnswerEvaluationPrompt.mock.calls[0][5];
      expect(promptArg).toBe('');
    });

    it('should handle missing metrics gracefully', async () => {
      mockMetricsRepo.findByAnswerId.mockResolvedValueOnce(null);

      const result = await service.evaluate({ answerId: '666666666666666666666601' });

      expect(result.technicalScore).toBeDefined();
      const metricsArg = mockPromptService.buildAnswerEvaluationPrompt.mock.calls[0][6];
      expect(metricsArg).toEqual({
        wordsPerMinute: undefined,
        confidenceScore: undefined,
        vocabularyRichness: undefined,
        keywordCoverage: undefined,
        fillerCount: undefined,
        repetitionScore: undefined,
      });
    });

    it('should handle empty transcript', async () => {
      mockAnswerRepo.findById.mockResolvedValueOnce({
        ...mockAnswerDoc,
        transcript: '',
      } as never);

      const result = await service.evaluate({ answerId: '666666666666666666666601' });

      expect(result.technicalScore).toBeDefined();
      const transcriptArg = mockPromptService.buildAnswerEvaluationPrompt.mock.calls[0][4];
      expect(transcriptArg).toBe('');
    });

    it('should include tokensUsed and evaluationDurationMs in result', async () => {
      const result = await service.evaluate({ answerId: '666666666666666666666601' });

      expect(result.tokensUsed).toBe(500);
      expect(result.evaluationDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('should build candidate summary with all profile sections', async () => {
      await service.evaluate({ answerId: '666666666666666666666601' });

      const summary = mockPromptService.buildAnswerEvaluationPrompt.mock.calls[0][5];
      expect(summary).toContain('Senior backend developer');
      expect(summary).toContain('Skills: TypeScript, NestJS, MongoDB');
      expect(summary).toContain('Technologies: Node.js, Docker, AWS');
    });

    it('should handle profile with no summary', async () => {
      mockCandidateProfileRepo.findByUserId.mockResolvedValueOnce({
        ...mockProfileDoc,
        summary: '',
      } as never);

      await service.evaluate({ answerId: '666666666666666666666601' });

      const summary = mockPromptService.buildAnswerEvaluationPrompt.mock.calls[0][5];
      expect(summary).toContain('Skills:');
      expect(summary).toContain('Technologies:');
    });

    it('should handle profile with empty skills and technologies', async () => {
      mockCandidateProfileRepo.findByUserId.mockResolvedValueOnce({
        ...mockProfileDoc,
        skills: [],
        technologies: [],
      } as never);

      await service.evaluate({ answerId: '666666666666666666666601' });

      const summary = mockPromptService.buildAnswerEvaluationPrompt.mock.calls[0][5];
      expect(summary).toContain('Senior backend developer');
    });
  });
});
