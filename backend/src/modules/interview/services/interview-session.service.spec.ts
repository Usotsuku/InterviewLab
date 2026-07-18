import { Test, TestingModule } from '@nestjs/testing';
import { InterviewSessionService } from './interview-session.service';
import { InterviewRepository } from '../repositories/interview.repository';
import { QuestionRepository } from '@modules/question/repositories/question.repository';
import { InterviewStatus } from '@shared/enums/domain.enums';
import { Types } from 'mongoose';

describe('InterviewSessionService', () => {
  let service: InterviewSessionService;

  const USER_ID = '112233445566778899001122';
  const INTERVIEW_ID = '66554433221100aabbccddee';

  const mockInterviewRepo = {
    findById: jest.fn(),
    updateById: jest.fn(),
  };

  const mockQuestionRepo = {
    findByInterviewId: jest.fn(),
  };

  const mockInterview = {
    _id: new Types.ObjectId(INTERVIEW_ID),
    userId: new Types.ObjectId(USER_ID),
    status: InterviewStatus.READY,
    totalQuestions: 3,
    currentQuestionIndex: 0,
    startedAt: null,
    completedAt: null,
  };

  const mockQuestions = [
    {
      _id: new Types.ObjectId(),
      interviewId: new Types.ObjectId(INTERVIEW_ID),
      order: 1,
      text: 'Q1?',
      type: 'TECHNICAL',
      difficulty: 'MEDIUM',
    },
    {
      _id: new Types.ObjectId(),
      interviewId: new Types.ObjectId(INTERVIEW_ID),
      order: 2,
      text: 'Q2?',
      type: 'HR',
      difficulty: 'EASY',
    },
    {
      _id: new Types.ObjectId(),
      interviewId: new Types.ObjectId(INTERVIEW_ID),
      order: 3,
      text: 'Q3?',
      type: 'COMMUNICATION',
      difficulty: 'HARD',
    },
  ];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewSessionService,
        { provide: InterviewRepository, useValue: mockInterviewRepo },
        { provide: QuestionRepository, useValue: mockQuestionRepo },
      ],
    }).compile();

    service = module.get<InterviewSessionService>(InterviewSessionService);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('startInterview', () => {
    it('should start a READY interview', async () => {
      mockInterviewRepo.findById.mockResolvedValue(mockInterview);

      const result = await service.startInterview(INTERVIEW_ID, USER_ID);

      expect(result.status).toBe(InterviewStatus.IN_PROGRESS);
      expect(result.startedAt).toBeInstanceOf(Date);
      expect(mockInterviewRepo.updateById).toHaveBeenCalledWith(INTERVIEW_ID, {
        status: InterviewStatus.IN_PROGRESS,
        startedAt: expect.any(Date),
        currentQuestionIndex: 0,
      });
    });

    it('should throw when interview not found', async () => {
      mockInterviewRepo.findById.mockResolvedValue(null);

      await expect(service.startInterview(INTERVIEW_ID, USER_ID)).rejects.toThrow();
    });

    it('should throw when interview not READY', async () => {
      mockInterviewRepo.findById.mockResolvedValue({
        ...mockInterview,
        status: InterviewStatus.IN_PROGRESS,
      });

      await expect(service.startInterview(INTERVIEW_ID, USER_ID)).rejects.toThrow();
    });

    it('should throw when user does not own interview', async () => {
      mockInterviewRepo.findById.mockResolvedValue({
        ...mockInterview,
        userId: new Types.ObjectId('999999999999999999999999'),
      });

      await expect(service.startInterview(INTERVIEW_ID, USER_ID)).rejects.toThrow();
    });
  });

  describe('getCurrentQuestion', () => {
    it('should return the current question', async () => {
      mockInterviewRepo.findById.mockResolvedValue({
        ...mockInterview,
        status: InterviewStatus.IN_PROGRESS,
        currentQuestionIndex: 0,
      });
      mockQuestionRepo.findByInterviewId.mockResolvedValue(mockQuestions);

      const result = await service.getCurrentQuestion(INTERVIEW_ID, USER_ID);

      expect(result.currentQuestionIndex).toBe(0);
      expect(result.question).not.toBeNull();
      expect(result.question!.text).toBe('Q1?');
    });

    it('should throw when interview not in progress', async () => {
      mockInterviewRepo.findById.mockResolvedValue({
        ...mockInterview,
        status: InterviewStatus.READY,
      });

      await expect(service.getCurrentQuestion(INTERVIEW_ID, USER_ID)).rejects.toThrow();
    });
  });

  describe('nextQuestion', () => {
    it('should advance to the next question', async () => {
      mockInterviewRepo.findById.mockResolvedValue({
        ...mockInterview,
        status: InterviewStatus.IN_PROGRESS,
        currentQuestionIndex: 0,
      });
      mockQuestionRepo.findByInterviewId.mockResolvedValue(mockQuestions);

      const result = await service.nextQuestion(INTERVIEW_ID, USER_ID);

      expect(result.currentQuestionIndex).toBe(1);
      expect(result.question).not.toBeNull();
      expect(result.question!.text).toBe('Q2?');
      expect(result.completed).toBe(false);
    });

    it('should mark completed when on last question', async () => {
      mockInterviewRepo.findById.mockResolvedValue({
        ...mockInterview,
        status: InterviewStatus.IN_PROGRESS,
        currentQuestionIndex: 2,
      });
      mockQuestionRepo.findByInterviewId.mockResolvedValue(mockQuestions);

      const result = await service.nextQuestion(INTERVIEW_ID, USER_ID);

      expect(result.completed).toBe(true);
      expect(result.question).toBeNull();
    });

    it('should throw when interview not in progress', async () => {
      mockInterviewRepo.findById.mockResolvedValue({
        ...mockInterview,
        status: InterviewStatus.COMPLETED,
      });

      await expect(service.nextQuestion(INTERVIEW_ID, USER_ID)).rejects.toThrow();
    });
  });

  describe('finishInterview', () => {
    it('should finish an IN_PROGRESS interview', async () => {
      mockInterviewRepo.findById.mockResolvedValue({
        ...mockInterview,
        status: InterviewStatus.IN_PROGRESS,
        currentQuestionIndex: 2,
      });

      const result = await service.finishInterview(INTERVIEW_ID, USER_ID);

      expect(result.status).toBe(InterviewStatus.COMPLETED);
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(result.totalQuestionsAnswered).toBe(3);
      expect(mockInterviewRepo.updateById).toHaveBeenCalledWith(INTERVIEW_ID, {
        status: InterviewStatus.COMPLETED,
        completedAt: expect.any(Date),
      });
    });

    it('should throw when interview not in progress', async () => {
      mockInterviewRepo.findById.mockResolvedValue({
        ...mockInterview,
        status: InterviewStatus.COMPLETED,
      });

      await expect(service.finishInterview(INTERVIEW_ID, USER_ID)).rejects.toThrow();
    });

    it('should throw when interview not found', async () => {
      mockInterviewRepo.findById.mockResolvedValue(null);

      await expect(service.finishInterview(INTERVIEW_ID, USER_ID)).rejects.toThrow();
    });
  });
});
