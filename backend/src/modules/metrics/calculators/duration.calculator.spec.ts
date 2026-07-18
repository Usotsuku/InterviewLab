import { DurationCalculator } from './duration.calculator';

describe('DurationCalculator', () => {
  let calculator: DurationCalculator;

  beforeEach(() => {
    calculator = new DurationCalculator();
  });

  it('should return raw seconds when no estimate provided', () => {
    expect(calculator.calculate(45)).toBe(45);
  });

  it('should return ratio when estimate provided', () => {
    expect(calculator.calculate(10, 10)).toBe(1);
  });

  it('should return ratio > 1 when over estimate', () => {
    expect(calculator.calculate(15, 10)).toBe(1.5);
  });

  it('should return ratio < 1 when under estimate', () => {
    expect(calculator.calculate(8, 10)).toBe(0.8);
  });

  it('should handle zero duration', () => {
    expect(calculator.calculate(0)).toBe(0);
  });

  it('should handle zero estimate gracefully', () => {
    expect(calculator.calculate(10, 0)).toBe(10);
  });

  it('should round to two decimal places', () => {
    expect(calculator.calculate(10, 3)).toBe(3.33);
  });
});
