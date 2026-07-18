import { SpeakingSpeedCalculator } from './speaking-speed.calculator';

describe('SpeakingSpeedCalculator', () => {
  let calculator: SpeakingSpeedCalculator;

  beforeEach(() => {
    calculator = new SpeakingSpeedCalculator();
  });

  it('should return 0 for empty transcript', () => {
    expect(calculator.calculate('', 60)).toBe(0);
  });

  it('should return 0 for zero duration', () => {
    expect(calculator.calculate('hello world', 0)).toBe(0);
  });

  it('should calculate words per minute correctly', () => {
    const result = calculator.calculate('hello world test words here', 6);
    expect(result).toBe(50);
  });

  it('should handle single word', () => {
    const result = calculator.calculate('hello', 60);
    expect(result).toBe(1);
  });

  it('should round to one decimal place', () => {
    const result = calculator.calculate('one two three', 7);
    expect(result).toBe(25.7);
  });

  it('should handle longer transcripts', () => {
    const words = Array(150).fill('word').join(' ');
    const result = calculator.calculate(words, 60);
    expect(result).toBe(150);
  });
});
