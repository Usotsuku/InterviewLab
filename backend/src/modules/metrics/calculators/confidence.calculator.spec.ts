import { ConfidenceCalculator } from './confidence.calculator';
import { ConfidenceInput } from './calculator.types';

describe('ConfidenceCalculator', () => {
  let calculator: ConfidenceCalculator;

  const baseInput: ConfidenceInput = {
    wordsPerMinute: 150,
    pauseCount: 2,
    averagePause: 400,
    longestPause: 600,
    vocabularyRichness: 0.8,
    fillerCount: 1,
    repetitionScore: 0.1,
    keywordCoverage: 0.7,
    answerDuration: 1.0,
    wordCount: 50,
  };

  beforeEach(() => {
    calculator = new ConfidenceCalculator();
  });

  it('should return a score between 0 and 1', () => {
    const result = calculator.calculate(baseInput);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('should penalize very slow speech', () => {
    const slow = calculator.calculate({ ...baseInput, wordsPerMinute: 30 });
    const normal = calculator.calculate({ ...baseInput, wordsPerMinute: 150 });
    expect(slow).toBeLessThan(normal);
  });

  it('should penalize very fast speech', () => {
    const fast = calculator.calculate({ ...baseInput, wordsPerMinute: 300 });
    const normal = calculator.calculate({ ...baseInput, wordsPerMinute: 150 });
    expect(fast).toBeLessThan(normal);
  });

  it('should penalize high filler count', () => {
    const highFillers = calculator.calculate({ ...baseInput, fillerCount: 10 });
    const lowFillers = calculator.calculate({ ...baseInput, fillerCount: 0 });
    expect(highFillers).toBeLessThan(lowFillers);
  });

  it('should penalize high repetition', () => {
    const highRep = calculator.calculate({ ...baseInput, repetitionScore: 0.8 });
    const lowRep = calculator.calculate({ ...baseInput, repetitionScore: 0.0 });
    expect(highRep).toBeLessThan(lowRep);
  });

  it('should reward high vocabulary richness', () => {
    const rich = calculator.calculate({ ...baseInput, vocabularyRichness: 1.0 });
    const poor = calculator.calculate({ ...baseInput, vocabularyRichness: 0.3 });
    expect(rich).toBeGreaterThan(poor);
  });

  it('should reward high keyword coverage', () => {
    const covered = calculator.calculate({ ...baseInput, keywordCoverage: 1.0 });
    const uncovered = calculator.calculate({ ...baseInput, keywordCoverage: 0.0 });
    expect(covered).toBeGreaterThan(uncovered);
  });

  it('should handle optimal inputs for high score', () => {
    const result = calculator.calculate({
      wordsPerMinute: 150,
      pauseCount: 3,
      averagePause: 400,
      longestPause: 600,
      vocabularyRichness: 0.9,
      fillerCount: 0,
      repetitionScore: 0.0,
      keywordCoverage: 1.0,
      answerDuration: 1.0,
      wordCount: 50,
    });
    expect(result).toBeGreaterThanOrEqual(0.8);
  });

  it('should handle poor inputs for low score', () => {
    const result = calculator.calculate({
      wordsPerMinute: 30,
      pauseCount: 0,
      averagePause: 0,
      longestPause: 0,
      vocabularyRichness: 0.2,
      fillerCount: 15,
      repetitionScore: 0.9,
      keywordCoverage: 0.0,
      answerDuration: 3.0,
      wordCount: 50,
    });
    expect(result).toBeLessThan(0.5);
  });
});
