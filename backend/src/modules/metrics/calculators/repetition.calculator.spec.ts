import { RepetitionCalculator } from './repetition.calculator';

describe('RepetitionCalculator', () => {
  let calculator: RepetitionCalculator;

  beforeEach(() => {
    calculator = new RepetitionCalculator();
  });

  it('should return 0 for empty transcript', () => {
    expect(calculator.calculate('')).toBe(0);
  });

  it('should return 0 for single word', () => {
    expect(calculator.calculate('hello')).toBe(0);
  });

  it('should return 0 for no repetitions', () => {
    expect(calculator.calculate('I have experience with Node.js')).toBe(0);
  });

  it('should detect adjacent word repetition', () => {
    const result = calculator.calculate('I I I think this is good');
    expect(result).toBeGreaterThan(0);
  });

  it('should detect bigram repetition', () => {
    const result = calculator.calculate('I think I think this is important');
    expect(result).toBeGreaterThan(0);
  });

  it('should return higher score for more repetition', () => {
    const low = calculator.calculate('I think the answer is yes');
    const high = calculator.calculate('I I I I think think think the answer');
    expect(high).toBeGreaterThan(low);
  });

  it('should cap score at 1.0', () => {
    const result = calculator.calculate('yes yes yes yes yes yes yes yes');
    expect(result).toBeLessThanOrEqual(1);
  });

  it('should handle two words with no repetition', () => {
    expect(calculator.calculate('hello world')).toBe(0);
  });
});
