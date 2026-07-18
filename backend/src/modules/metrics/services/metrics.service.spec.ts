import { MetricsService, MetricsComputeInput } from './metrics.service';
import { MetricsCalculationService } from './metrics-calculation.service';
import { InterviewMetricsRepository } from '../repositories/interview-metrics.repository';
import { SpeakingSpeedCalculator } from '../calculators/speaking-speed.calculator';
import { PauseCalculator } from '../calculators/pause.calculator';
import { VocabularyCalculator } from '../calculators/vocabulary.calculator';
import { FillerCalculator } from '../calculators/filler.calculator';
import { RepetitionCalculator } from '../calculators/repetition.calculator';
import { KeywordCoverageCalculator } from '../calculators/keyword-coverage.calculator';
import { DurationCalculator } from '../calculators/duration.calculator';
import { ConfidenceCalculator } from '../calculators/confidence.calculator';

describe('MetricsService', () => {
  let service: MetricsService;

  const mockMetricsRepository = {
    create: jest.fn(),
    findByAnswerId: jest.fn(),
    findByInterviewId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const calculationService = new MetricsCalculationService(
      new SpeakingSpeedCalculator(),
      new PauseCalculator(),
      new VocabularyCalculator(),
      new FillerCalculator(),
      new RepetitionCalculator(),
      new KeywordCoverageCalculator(),
      new DurationCalculator(),
      new ConfidenceCalculator(),
    );

    service = new MetricsService(
      calculationService,
      mockMetricsRepository as unknown as InterviewMetricsRepository,
    );
  });

  describe('compute', () => {
    it('should return metrics and persist to repository', async () => {
      mockMetricsRepository.create.mockResolvedValue({});

      const input: MetricsComputeInput = {
        answerId: '507f1f77bcf86cd799439011',
        interviewId: '507f1f77bcf86cd799439012',
        transcript: 'I have experience with Node.js and TypeScript',
        durationSeconds: 30,
        expectedKeywords: ['node.js', 'typescript'],
        estimatedAnswerDuration: 1.0,
      };

      const result = await service.compute(input);

      expect(result).toHaveProperty('wordsPerMinute');
      expect(result).toHaveProperty('confidenceScore');
      expect(mockMetricsRepository.create).toHaveBeenCalledTimes(1);

      const persisted = mockMetricsRepository.create.mock.calls[0][0];
      expect(persisted.answerId.toString()).toBe('507f1f77bcf86cd799439011');
      expect(persisted.interviewId.toString()).toBe('507f1f77bcf86cd799439012');
      expect(persisted.wordsPerMinute).toBe(result.wordsPerMinute);
      expect(persisted.confidenceScore).toBe(result.confidenceScore);
    });

    it('should persist all 10 metric fields', async () => {
      mockMetricsRepository.create.mockResolvedValue({});

      await service.compute({
        answerId: '507f1f77bcf86cd799439011',
        interviewId: '507f1f77bcf86cd799439012',
        transcript: 'hello world test',
        durationSeconds: 10,
        expectedKeywords: ['hello'],
      });

      const persisted = mockMetricsRepository.create.mock.calls[0][0];
      expect(persisted).toHaveProperty('wordsPerMinute');
      expect(persisted).toHaveProperty('answerDuration');
      expect(persisted).toHaveProperty('pauseCount');
      expect(persisted).toHaveProperty('averagePause');
      expect(persisted).toHaveProperty('longestPause');
      expect(persisted).toHaveProperty('fillerCount');
      expect(persisted).toHaveProperty('vocabularyRichness');
      expect(persisted).toHaveProperty('repetitionScore');
      expect(persisted).toHaveProperty('keywordCoverage');
      expect(persisted).toHaveProperty('confidenceScore');
    });
  });

  describe('getMetricsByAnswerId', () => {
    it('should return null when no metrics found', async () => {
      mockMetricsRepository.findByAnswerId.mockResolvedValue(null);
      const result = await service.getMetricsByAnswerId('nonexistent');
      expect(result).toBeNull();
    });

    it('should return metrics when found', async () => {
      mockMetricsRepository.findByAnswerId.mockResolvedValue({
        wordsPerMinute: 130,
        answerDuration: 1.0,
        pauseCount: 2,
        averagePause: 450,
        longestPause: 675,
        fillerCount: 1,
        vocabularyRichness: 0.85,
        repetitionScore: 0.05,
        keywordCoverage: 0.7,
        confidenceScore: 0.75,
      });

      const result = await service.getMetricsByAnswerId('answer-1');
      expect(result).not.toBeNull();
      expect(result!.wordsPerMinute).toBe(130);
      expect(result!.confidenceScore).toBe(0.75);
    });
  });
});
