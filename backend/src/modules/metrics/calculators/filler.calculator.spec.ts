import { FillerCalculator } from './filler.calculator';

describe('FillerCalculator', () => {
  let calculator: FillerCalculator;

  beforeEach(() => {
    calculator = new FillerCalculator();
  });

  it('should return 0 for empty transcript', () => {
    expect(calculator.calculate('')).toBe(0);
  });

  it('should return 0 when no fillers present', () => {
    expect(calculator.calculate('I have five years of experience')).toBe(0);
  });

  it('should count single filler words', () => {
    const result = calculator.calculate('um I think uh yes');
    expect(result).toBe(2);
  });

  it('should count filler phrases', () => {
    const result = calculator.calculate('I mean, you know, it is sort of difficult');
    expect(result).toBeGreaterThanOrEqual(3);
  });

  it('should count repeated fillers', () => {
    const result = calculator.calculate('um um um');
    expect(result).toBe(3);
  });

  it('should be case insensitive', () => {
    const result = calculator.calculate('UM I think Uh yes');
    expect(result).toBe(2);
  });

  it('should handle mixed single and phrase fillers', () => {
    const result = calculator.calculate('um you know basically');
    expect(result).toBeGreaterThanOrEqual(2);
  });
});
