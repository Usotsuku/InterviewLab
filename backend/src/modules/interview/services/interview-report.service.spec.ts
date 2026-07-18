import { Test, TestingModule } from '@nestjs/testing';
import { InterviewReportService } from './interview-report.service';
import { InterviewRepository } from '../repositories/interview.repository';
import { QuestionRepository } from '@modules/question/repositories/question.repository';
import { AnswerRepository } from '@modules/answer/repositories/answer.repository';
import { InterviewMetricsRepository } from '@modules/metrics/repositories/interview-metrics.repository';
import { AiEvaluationRepository } from '@modules/ai/repositories/ai-evaluation.repository';
import { Types } from 'mongoose';

describe('InterviewReportService', () => {
  let service: InterviewReportService;

  const USER_ID = '112233445566778899001122';
  const INTERVIEW_ID = '66554433221100aabbccddee';

  const mockInterviewRepo = { findById: jest.fn() };
  const mockQuestionRepo = { findByInterviewId: jest.fn() };
  const mockAnswerRepo = { findByInterviewId: jest.fn() };
  const mockMetricsRepo = { findByInterviewId: jest.fn() };
  const mockEvaluationRepo = { findByInterviewId: jest.fn() };

  const mockInterview = {
    _id: new Types.ObjectId(INTERVIEW_ID),
    userId: new Types.ObjectId(USER_ID),
    status: 'COMPLETED',
    mode: 'TECHNICAL',
    title: 'Technical Interview',
    estimatedDuration: 60,
    totalQuestions: 2,
    currentQuestionIndex: 2,
    overallScore: 8.0,
    communicationScore: 7.5,
    technicalScore: 8.5,
    confidenceScore: 8.0,
    startedAt: new Date('2025-01-01T10:00:00Z'),
    completedAt: new Date('2025-01-01T11:00:00Z'),
    createdAt: new Date('2025-01-01T09:00:00Z'),
  };

  const Q1_ID = new Types.ObjectId();
  const Q2_ID = new Types.ObjectId();
  const A1_ID = new Types.ObjectId();
  const A2_ID = new Types.ObjectId();

  const mockQuestions = [
    {
      _id: Q1_ID,
      interviewId: new Types.ObjectId(INTERVIEW_ID),
      order: 1,
      text: 'Q1?',
      type: 'TECHNICAL',
      difficulty: 'MEDIUM',
      targetSkills: ['node.js'],
      estimatedAnswerDuration: 120,
    },
    {
      _id: Q2_ID,
      interviewId: new Types.ObjectId(INTERVIEW_ID),
      order: 2,
      text: 'Q2?',
      type: 'HR',
      difficulty: 'EASY',
      targetSkills: [],
      estimatedAnswerDuration: 60,
    },
  ];

  const mockAnswers = [
    {
      _id: A1_ID,
      interviewId: new Types.ObjectId(INTERVIEW_ID),
      questionId: Q1_ID,
      transcript: 'Answer 1',
      durationSeconds: 45,
      audioUrl: 'url1',
    },
    {
      _id: A2_ID,
      interviewId: new Types.ObjectId(INTERVIEW_ID),
      questionId: Q2_ID,
      transcript: 'Answer 2',
      durationSeconds: 30,
      audioUrl: 'url2',
    },
  ];

  const mockMetrics = [
    {
      _id: new Types.ObjectId(),
      answerId: A1_ID,
      interviewId: new Types.ObjectId(INTERVIEW_ID),
      wordsPerMinute: 120,
      answerDuration: 45,
      pauseCount: 3,
      averagePause: 1.2,
      longestPause: 3.5,
      fillerCount: 2,
      vocabularyRichness: 0.75,
      repetitionScore: 0.9,
      keywordCoverage: 0.6,
      confidenceScore: 0.8,
    },
    {
      _id: new Types.ObjectId(),
      answerId: A2_ID,
      interviewId: new Types.ObjectId(INTERVIEW_ID),
      wordsPerMinute: 100,
      answerDuration: 30,
      pauseCount: 1,
      averagePause: 0.8,
      longestPause: 2.0,
      fillerCount: 1,
      vocabularyRichness: 0.8,
      repetitionScore: 0.95,
      keywordCoverage: 0.7,
      confidenceScore: 0.85,
    },
  ];

  const mockEvaluations = [
    {
      _id: new Types.ObjectId(),
      answerId: A1_ID,
      interviewId: new Types.ObjectId(INTERVIEW_ID),
      technicalScore: 9,
      communicationScore: 7,
      correctnessScore: 8,
      completenessScore: 8,
      strengths: ['Good'],
      weaknesses: ['Needs detail'],
      missingConcepts: [],
      followUpQuestions: ['Q?'],
      feedback: 'Great',
    },
    {
      _id: new Types.ObjectId(),
      answerId: A2_ID,
      interviewId: new Types.ObjectId(INTERVIEW_ID),
      technicalScore: 8,
      communicationScore: 8,
      correctnessScore: 7,
      completenessScore: 7,
      strengths: ['Clear'],
      weaknesses: [],
      missingConcepts: ['Advanced'],
      followUpQuestions: [],
      feedback: 'Good',
    },
  ];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewReportService,
        { provide: InterviewRepository, useValue: mockInterviewRepo },
        { provide: QuestionRepository, useValue: mockQuestionRepo },
        { provide: AnswerRepository, useValue: mockAnswerRepo },
        { provide: InterviewMetricsRepository, useValue: mockMetricsRepo },
        { provide: AiEvaluationRepository, useValue: mockEvaluationRepo },
      ],
    }).compile();

    service = module.get<InterviewReportService>(InterviewReportService);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('getReport', () => {
    beforeEach(() => {
      mockInterviewRepo.findById.mockResolvedValue(mockInterview);
      mockQuestionRepo.findByInterviewId.mockResolvedValue(mockQuestions);
      mockAnswerRepo.findByInterviewId.mockResolvedValue(mockAnswers);
      mockMetricsRepo.findByInterviewId.mockResolvedValue(mockMetrics);
      mockEvaluationRepo.findByInterviewId.mockResolvedValue(mockEvaluations);
    });

    it('should return a complete report for a valid interview', async () => {
      const result = await service.getReport(INTERVIEW_ID, USER_ID);

      expect(result.interview).toBeDefined();
      expect(result.interview.id).toBe(INTERVIEW_ID);
      expect(result.interview.mode).toBe('TECHNICAL');
      expect(result.interview.status).toBe('COMPLETED');
      expect(result.questions).toHaveLength(2);
      expect(result.totalAnswered).toBe(2);
      expect(result.totalQuestions).toBe(2);
      expect(result.durationMinutes).toBe(1.3);
    });

    it('should map question metrics and evaluations correctly', async () => {
      const result = await service.getReport(INTERVIEW_ID, USER_ID);

      const q1Report = result.questions[0];
      expect(q1Report.questionId).toBe(Q1_ID.toString());
      expect(q1Report.text).toBe('Q1?');
      expect(q1Report.transcript).toBe('Answer 1');
      expect(q1Report.metrics).toBeDefined();
      expect(q1Report.metrics!.wordsPerMinute).toBe(120);
      expect(q1Report.evaluation).toBeDefined();
      expect(q1Report.evaluation!.technicalScore).toBe(9);
    });

    it('should handle interview not found', async () => {
      mockInterviewRepo.findById.mockResolvedValue(null);

      await expect(service.getReport('nonexistent', USER_ID)).rejects.toThrow();
    });

    it('should throw when user does not own interview', async () => {
      mockInterviewRepo.findById.mockResolvedValue({
        ...mockInterview,
        userId: new Types.ObjectId('999999999999999999999999'),
      });

      await expect(service.getReport(INTERVIEW_ID, USER_ID)).rejects.toThrow();
    });

    it('should handle questions with no answers', async () => {
      mockAnswerRepo.findByInterviewId.mockResolvedValue([]);

      const result = await service.getReport(INTERVIEW_ID, USER_ID);

      expect(result.totalAnswered).toBe(0);
      result.questions.forEach((q) => {
        expect(q.transcript).toBeUndefined();
        expect(q.metrics).toBeUndefined();
        expect(q.evaluation).toBeUndefined();
      });
    });

    it('should handle empty questions list', async () => {
      mockQuestionRepo.findByInterviewId.mockResolvedValue([]);
      mockAnswerRepo.findByInterviewId.mockResolvedValue([]);
      mockMetricsRepo.findByInterviewId.mockResolvedValue([]);
      mockEvaluationRepo.findByInterviewId.mockResolvedValue([]);

      const result = await service.getReport(INTERVIEW_ID, USER_ID);

      expect(result.questions).toHaveLength(0);
      expect(result.totalAnswered).toBe(0);
      expect(result.totalQuestions).toBe(0);
      expect(result.durationMinutes).toBe(0);
    });

    it('should handle missing metrics for some answers', async () => {
      mockMetricsRepo.findByInterviewId.mockResolvedValue([mockMetrics[0]]);

      const result = await service.getReport(INTERVIEW_ID, USER_ID);

      expect(result.questions[0].metrics).toBeDefined();
      expect(result.questions[1].metrics).toBeUndefined();
    });

    it('should handle missing evaluations for some answers', async () => {
      mockEvaluationRepo.findByInterviewId.mockResolvedValue([]);

      const result = await service.getReport(INTERVIEW_ID, USER_ID);

      result.questions.forEach((q) => {
        expect(q.evaluation).toBeUndefined();
      });
    });
  });
});
