import { Test, TestingModule } from '@nestjs/testing';
import { InterviewGenerationService } from './interview-generation.service';
import { AIService } from '@modules/ai/services/ai.service';
import { PromptService } from '@modules/ai/services/prompt.service';
import { CandidateProfileService } from '@modules/candidate-profile/services/candidate-profile.service';
import { InterviewRepository } from '../repositories/interview.repository';
import { QuestionRepository } from '@modules/question/repositories/question.repository';
import { InterviewStatus } from '@shared/enums/domain.enums';

describe('InterviewGenerationService', () => {
  let service: InterviewGenerationService;

  const INTERVIEW_ID = '66554433221100aabbccddee';
  const USER_ID = '112233445566778899001122';

  const mockAiService = {
    generate: jest.fn(),
  };

  const mockPromptService = {
    buildInterviewPrompt: jest.fn().mockReturnValue({
      prompt: 'Generate interview...',
      systemInstruction: 'You are an expert.',
    }),
  };

  const mockProfileService = {
    findByUserId: jest.fn(),
  };

  const mockInterviewRepo = {
    create: jest.fn(),
    updateById: jest.fn(),
    findById: jest.fn(),
  };

  const mockQuestionRepo = {
    create: jest.fn(),
  };

  const validAiResponse = JSON.stringify({
    title: 'Backend Developer Interview',
    estimatedDuration: 30,
    questions: [
      { order: 1, type: 'TECHNICAL', difficulty: 'MEDIUM', text: 'Explain Dependency Injection.' },
      { order: 2, type: 'HR', difficulty: 'EASY', text: 'Tell me about yourself.' },
      {
        order: 3,
        type: 'COMMUNICATION',
        difficulty: 'MEDIUM',
        text: 'How do you handle disagreements?',
      },
    ],
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewGenerationService,
        { provide: AIService, useValue: mockAiService },
        { provide: PromptService, useValue: mockPromptService },
        { provide: CandidateProfileService, useValue: mockProfileService },
        { provide: InterviewRepository, useValue: mockInterviewRepo },
        { provide: QuestionRepository, useValue: mockQuestionRepo },
      ],
    }).compile();

    service = module.get<InterviewGenerationService>(InterviewGenerationService);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('generate', () => {
    it('should generate an interview successfully', async () => {
      mockProfileService.findByUserId.mockResolvedValue({
        summary: 'Senior developer',
        skills: ['TypeScript', 'NestJS'],
        technologies: ['MongoDB', 'Node.js'],
        experience: [{ company: 'Corp', position: 'Dev' }],
        projects: [{ name: 'Project X' }],
        strengths: ['Problem solving'],
        weaknesses: ['Public speaking'],
        completionPercent: 80,
      });

      mockAiService.generate.mockResolvedValue({
        text: validAiResponse,
        tokenUsage: { input: 100, output: 200 },
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        durationMs: 5000,
      });

      mockInterviewRepo.updateById.mockResolvedValue(undefined);
      mockQuestionRepo.create.mockResolvedValue({});

      const result = await service.generate(USER_ID, INTERVIEW_ID, 'TECHNICAL');

      expect(result.status).toBe(InterviewStatus.READY);
      expect(result.title).toBe('Backend Developer Interview');
      expect(result.totalQuestions).toBe(3);
      expect(result.estimatedDuration).toBe(30);

      expect(mockInterviewRepo.updateById).toHaveBeenCalledWith(INTERVIEW_ID, {
        status: InterviewStatus.GENERATING,
      });
      expect(mockInterviewRepo.updateById).toHaveBeenCalledWith(INTERVIEW_ID, {
        status: InterviewStatus.READY,
      });
      expect(mockInterviewRepo.updateById).toHaveBeenCalledWith(INTERVIEW_ID, {
        title: 'Backend Developer Interview',
        estimatedDuration: 30,
        totalQuestions: 3,
      });
      expect(mockQuestionRepo.create).toHaveBeenCalledTimes(3);
    });

    it('should throw when profile not found', async () => {
      mockProfileService.findByUserId.mockRejectedValue(new Error('not found'));

      await expect(service.generate(USER_ID, INTERVIEW_ID, 'TECHNICAL')).rejects.toThrow();
    });

    it('should set FAILED status when AI call fails', async () => {
      mockProfileService.findByUserId.mockResolvedValue({
        summary: 'Dev',
        skills: ['JS'],
        technologies: ['Node'],
        experience: [],
        projects: [],
        strengths: [],
        weaknesses: [],
        completionPercent: 40,
      });

      mockAiService.generate.mockRejectedValue(new Error('AI error'));
      mockInterviewRepo.updateById.mockResolvedValue(undefined);

      await expect(service.generate(USER_ID, INTERVIEW_ID, 'TECHNICAL')).rejects.toThrow();
      expect(mockInterviewRepo.updateById).toHaveBeenCalledWith(INTERVIEW_ID, {
        status: InterviewStatus.FAILED,
      });
    });

    it('should set FAILED status when AI returns invalid JSON', async () => {
      mockProfileService.findByUserId.mockResolvedValue({
        summary: 'Dev',
        skills: ['JS'],
        technologies: ['Node'],
        experience: [],
        projects: [],
        strengths: [],
        weaknesses: [],
        completionPercent: 40,
      });

      mockAiService.generate.mockResolvedValue({
        text: 'not valid json',
        tokenUsage: { input: 10, output: 5 },
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        durationMs: 1000,
      });
      mockInterviewRepo.updateById.mockResolvedValue(undefined);

      await expect(service.generate(USER_ID, INTERVIEW_ID, 'TECHNICAL')).rejects.toThrow();
      expect(mockInterviewRepo.updateById).toHaveBeenCalledWith(INTERVIEW_ID, {
        status: InterviewStatus.FAILED,
      });
    });
  });
});
