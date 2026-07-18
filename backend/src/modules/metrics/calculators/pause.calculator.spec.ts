import { PauseCalculator } from './pause.calculator';

describe('PauseCalculator', () => {
  let calculator: PauseCalculator;

  beforeEach(() => {
    calculator = new PauseCalculator();
  });

  it('should return zeros for empty transcript', () => {
    const result = calculator.calculate('', 60);
    expect(result).toEqual({ pauseCount: 0, averagePause: 0, longestPause: 0 });
  });

  it('should return zeros for zero duration', () => {
    const result = calculator.calculate('hello world.', 0);
    expect(result).toEqual({ pauseCount: 0, averagePause: 0, longestPause: 0 });
  });

  it('should return zeros for single sentence', () => {
    const result = calculator.calculate('hello world', 10);
    expect(result).toEqual({ pauseCount: 0, averagePause: 0, longestPause: 0 });
  });

  it('should detect pause between two sentences', () => {
    const result = calculator.calculate('hello world. how are you?', 10);
    expect(result.pauseCount).toBe(1);
    expect(result.averagePause).toBeGreaterThan(0);
    expect(result.longestPause).toBeGreaterThan(result.averagePause);
  });

  it('should detect multiple pauses', () => {
    const result = calculator.calculate('first sentence. second sentence. third sentence.', 30);
    expect(result.pauseCount).toBe(2);
  });

  it('should handle transcript with no actual pauses needed', () => {
    const result = calculator.calculate('short.', 60);
    expect(result.pauseCount).toBe(0);
  });

  it('should calculate longestPause as 1.5x averagePause', () => {
    const result = calculator.calculate('first. second.', 10);
    expect(result.longestPause).toBe(Math.round(result.averagePause * 1.5));
  });
});
