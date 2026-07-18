import { MetricsCalculationService } from './metrics-calculation.service';
import { SpeakingSpeedCalculator } from '../calculators/speaking-speed.calculator';
import { PauseCalculator } from '../calculators/pause.calculator';
import { VocabularyCalculator } from '../calculators/vocabulary.calculator';
import { FillerCalculator } from '../calculators/filler.calculator';
import { RepetitionCalculator } from '../calculators/repetition.calculator';
import { KeywordCoverageCalculator } from '../calculators/keyword-coverage.calculator';
import { DurationCalculator } from '../calculators/duration.calculator';
import { ConfidenceCalculator } from '../calculators/confidence.calculator';

describe('MetricsCalculationService', () => {
  let service: MetricsCalculationService;

  beforeEach(() => {
    service = new MetricsCalculationService(
      new SpeakingSpeedCalculator(),
      new PauseCalculator(),
      new VocabularyCalculator(),
      new FillerCalculator(),
      new RepetitionCalculator(),
      new KeywordCoverageCalculator(),
      new DurationCalculator(),
      new ConfidenceCalculator(),
    );
  });

  it('should return all 10 metric fields', () => {
    const result = service.calculate({
      transcript: 'I have experience with Node.js and TypeScript',
      durationSeconds: 30,
      expectedKeywords: ['node.js', 'typescript'],
      estimatedAnswerDuration: 1.0,
    });

    expect(result).toHaveProperty('wordsPerMinute');
    expect(result).toHaveProperty('answerDuration');
    expect(result).toHaveProperty('pauseCount');
    expect(result).toHaveProperty('averagePause');
    expect(result).toHaveProperty('longestPause');
    expect(result).toHaveProperty('fillerCount');
    expect(result).toHaveProperty('vocabularyRichness');
    expect(result).toHaveProperty('repetitionScore');
    expect(result).toHaveProperty('keywordCoverage');
    expect(result).toHaveProperty('confidenceScore');
  });

  it('should calculate wordsPerMinute correctly', () => {
    const result = service.calculate({
      transcript: 'one two three four five',
      durationSeconds: 10,
      expectedKeywords: [],
    });
    expect(result.wordsPerMinute).toBe(30);
  });

  it('should calculate vocabulary richness', () => {
    const result = service.calculate({
      transcript: 'I have experience with Node.js',
      durationSeconds: 30,
      expectedKeywords: [],
    });
    expect(result.vocabularyRichness).toBe(1);
  });

  it('should calculate keyword coverage', () => {
    const result = service.calculate({
      transcript: 'I know Node.js and TypeScript',
      durationSeconds: 30,
      expectedKeywords: ['node.js', 'typescript'],
    });
    expect(result.keywordCoverage).toBe(1);
  });

  it('should calculate answerDuration as ratio when estimate provided', () => {
    const result = service.calculate({
      transcript: 'hello world',
      durationSeconds: 15,
      expectedKeywords: [],
      estimatedAnswerDuration: 10,
    });
    expect(result.answerDuration).toBe(1.5);
  });

  it('should calculate answerDuration as raw seconds when no estimate', () => {
    const result = service.calculate({
      transcript: 'hello world',
      durationSeconds: 15,
      expectedKeywords: [],
    });
    expect(result.answerDuration).toBe(15);
  });

  it('should return zeros for empty transcript', () => {
    const result = service.calculate({
      transcript: '',
      durationSeconds: 0,
      expectedKeywords: [],
    });
    expect(result.wordsPerMinute).toBe(0);
    expect(result.pauseCount).toBe(0);
    expect(result.vocabularyRichness).toBe(0);
  });

  it('should produce a confidenceScore between 0 and 1', () => {
    const result = service.calculate({
      transcript: 'I have five years of experience with Node.js and TypeScript',
      durationSeconds: 30,
      expectedKeywords: ['node.js', 'typescript'],
    });
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.confidenceScore).toBeLessThanOrEqual(1);
  });
});
