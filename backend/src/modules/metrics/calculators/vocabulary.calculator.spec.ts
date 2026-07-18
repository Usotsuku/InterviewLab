import { VocabularyCalculator } from './vocabulary.calculator';

describe('VocabularyCalculator', () => {
  let calculator: VocabularyCalculator;

  beforeEach(() => {
    calculator = new VocabularyCalculator();
  });

  it('should return 0 for empty transcript', () => {
    expect(calculator.calculate('')).toBe(0);
  });

  it('should return 1.0 for all unique words', () => {
    expect(calculator.calculate('I have experience')).toBe(1);
  });

  it('should return 0.5 for half unique words', () => {
    expect(calculator.calculate('hello hello world world')).toBe(0.5);
  });

  it('should handle case insensitivity', () => {
    expect(calculator.calculate('Hello hello')).toBe(0.5);
  });

  it('should strip punctuation', () => {
    expect(calculator.calculate('hello! hello?')).toBe(0.5);
  });

  it('should handle single word', () => {
    expect(calculator.calculate('hello')).toBe(1);
  });

  it('should compute richness correctly for mixed vocabulary', () => {
    const result = calculator.calculate('the cat sat on the mat the cat');
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
  });
});
