import { KeywordCoverageCalculator } from './keyword-coverage.calculator';

describe('KeywordCoverageCalculator', () => {
  let calculator: KeywordCoverageCalculator;

  beforeEach(() => {
    calculator = new KeywordCoverageCalculator();
  });

  it('should return 0 for empty keywords', () => {
    expect(calculator.calculate('hello world', [])).toBe(0);
  });

  it('should return 0 for null keywords', () => {
    expect(calculator.calculate('hello world', null as unknown as string[])).toBe(0);
  });

  it('should return 1.0 when all keywords present', () => {
    const result = calculator.calculate(
      'I know Node.js and TypeScript well',
      ['node.js', 'typescript'],
    );
    expect(result).toBe(1);
  });

  it('should return 0.0 when no keywords present', () => {
    const result = calculator.calculate(
      'I have experience with Python',
      ['node.js', 'typescript'],
    );
    expect(result).toBe(0);
  });

  it('should return partial coverage', () => {
    const result = calculator.calculate(
      'I know Node.js but not React',
      ['node.js', 'typescript', 'react'],
    );
    expect(result).toBeCloseTo(0.67, 1);
  });

  it('should be case insensitive', () => {
    const result = calculator.calculate(
      'I know NODE.JS and TYPESCRIPT',
      ['node.js', 'typescript'],
    );
    expect(result).toBe(1);
  });

  it('should handle single keyword', () => {
    const result = calculator.calculate('I know Node.js', ['node.js']);
    expect(result).toBe(1);
  });
});
