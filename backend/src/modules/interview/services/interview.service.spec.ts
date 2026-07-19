import { Test, TestingModule } from '@nestjs/testing';
import { InterviewService } from './interview.service';
import { InterviewRepository } from '../repositories/interview.repository';
import { InterviewMode, InterviewStatus } from '@shared/enums/domain.enums';
import { Types } from 'mongoose';

describe('InterviewService', () => {
  let service: InterviewService;

  const mockInterviewRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    updateById: jest.fn(),
    softDeleteById: jest.fn(),
  };

  const USER_ID = '112233445566778899001122';
  const INTERVIEW_ID = '66554433221100aabbccddee';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewService,
        { provide: InterviewRepository, useValue: mockInterviewRepo },
      ],
    }).compile();

    service = module.get<InterviewService>(InterviewService);
  });

  describe('createInterview', () => {
    it('should persist the provided questionCount as totalQuestions', async () => {
      mockInterviewRepo.create.mockResolvedValue({
        _id: new Types.ObjectId(INTERVIEW_ID),
      });

      const result = await service.createInterview(USER_ID, InterviewMode.TECHNICAL, 10);

      expect(mockInterviewRepo.create).toHaveBeenCalledWith({
        userId: expect.any(Types.ObjectId),
        mode: InterviewMode.TECHNICAL,
        status: InterviewStatus.CREATED,
        currentQuestionIndex: 0,
        totalQuestions: 10,
      });
      expect(result.id).toBe(INTERVIEW_ID);
    });

    it('should default questionCount to 5 when not provided', async () => {
      mockInterviewRepo.create.mockResolvedValue({
        _id: new Types.ObjectId(INTERVIEW_ID),
      });

      await service.createInterview(USER_ID, InterviewMode.HR);

      expect(mockInterviewRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalQuestions: 5 }),
      );
    });

    it('should use the provided questionCount when explicitly passed (including edge cases)', async () => {
      mockInterviewRepo.create.mockResolvedValue({
        _id: new Types.ObjectId(INTERVIEW_ID),
      });

      await service.createInterview(USER_ID, InterviewMode.TECHNICAL, 1);

      expect(mockInterviewRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalQuestions: 1 }),
      );
    });

    it('should accept any valid questionCount between 1 and 20', async () => {
      mockInterviewRepo.create.mockResolvedValue({
        _id: new Types.ObjectId(INTERVIEW_ID),
      });

      await service.createInterview(USER_ID, InterviewMode.MIXED, 15);

      expect(mockInterviewRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalQuestions: 15 }),
      );
    });
  });
});
