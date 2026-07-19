import { InterviewScoreAggregator } from './interview-score-aggregator';

describe('InterviewScoreAggregator', () => {
  let aggregator: InterviewScoreAggregator;

  beforeEach(() => {
    aggregator = new InterviewScoreAggregator();
  });

  it('should return all nulls when no evaluations', () => {
    const result = aggregator.aggregate([]);
    expect(result).toEqual({ overallScore: null, technicalScore: null, communicationScore: null });
  });

  it('should return single evaluation scores unchanged', () => {
    const result = aggregator.aggregate([
      { technicalScore: 80, communicationScore: 70, correctnessScore: 90, completenessScore: 60 },
    ]);
    expect(result.technicalScore).toBe(80);
    expect(result.communicationScore).toBe(70);
    // overallScore = (80 + 70 + 90 + 60) / 4 = 75
    expect(result.overallScore).toBe(75);
  });

  it('should average multiple evaluations', () => {
    const result = aggregator.aggregate([
      { technicalScore: 80, communicationScore: 60, correctnessScore: 70, completenessScore: 50 },
      { technicalScore: 60, communicationScore: 80, correctnessScore: 90, completenessScore: 70 },
    ]);
    expect(result.technicalScore).toBe(70);
    expect(result.communicationScore).toBe(70);
    // eval1 overall = (80+60+70+50)/4 = 65
    // eval2 overall = (60+80+90+70)/4 = 75
    // mean = (65+75)/2 = 70
    expect(result.overallScore).toBe(70);
  });

  it('should exclude undefined dimensions from averages instead of treating as 0', () => {
    const result = aggregator.aggregate([
      { technicalScore: 100, communicationScore: undefined, correctnessScore: undefined, completenessScore: undefined },
    ]);
    expect(result.technicalScore).toBe(100);
    expect(result.communicationScore).toBeNull();
    // Only non-null dimension is technicalScore=100, so overall = 100
    expect(result.overallScore).toBe(100);
  });

  it('should return null technicalScore for all-HR interview (all technicalScore null)', () => {
    const result = aggregator.aggregate([
      { technicalScore: null, communicationScore: 80, correctnessScore: 70, completenessScore: 60 },
      { technicalScore: null, communicationScore: 90, correctnessScore: 80, completenessScore: 70 },
      { technicalScore: null, communicationScore: 70, correctnessScore: 60, completenessScore: 50 },
    ]);
    expect(result.technicalScore).toBeNull();
    expect(result.communicationScore).toBe(80);
    // Each eval's overall excludes null technicalScore:
    // eval1 = (80+70+60)/3 = 70
    // eval2 = (90+80+70)/3 = 80
    // eval3 = (70+60+50)/3 = 60
    // mean = (70+80+60)/3 = 70
    expect(result.overallScore).toBe(70);
  });

  it('should average technicalScore only over evaluations where it is non-null (mixed interview)', () => {
    const result = aggregator.aggregate([
      { technicalScore: null, communicationScore: 80, correctnessScore: 70, completenessScore: 60 },
      { technicalScore: 80, communicationScore: 70, correctnessScore: 90, completenessScore: 60 },
      { technicalScore: null, communicationScore: 90, correctnessScore: 80, completenessScore: 70 },
      { technicalScore: 60, communicationScore: 60, correctnessScore: 70, completenessScore: 50 },
    ]);
    // technicalScore averaged only over non-null: (80 + 60) / 2 = 70
    expect(result.technicalScore).toBe(70);
    // communicationScore averaged over all 4 (all non-null): (80+70+90+60)/4 = 75
    expect(result.communicationScore).toBe(75);
    // overall per eval (non-null dims only):
    // eval1: (80+70+60)/3 = 70
    // eval2: (80+70+90+60)/4 = 75
    // eval3: (90+80+70)/3 = 80
    // eval4: (60+60+70+50)/4 = 60
    // mean = (70+75+80+60)/4 = 71.25 → 71.3
    expect(result.overallScore).toBe(71.3);
  });

  it('should return null overallScore when all evaluations have only null dimensions', () => {
    const result = aggregator.aggregate([
      { technicalScore: null, communicationScore: null, correctnessScore: null, completenessScore: null },
    ]);
    expect(result.overallScore).toBeNull();
    expect(result.technicalScore).toBeNull();
    expect(result.communicationScore).toBeNull();
  });

  it('should not deflation overallScore by factoring null scores as 0', () => {
    const result = aggregator.aggregate([
      { technicalScore: null, communicationScore: 80, correctnessScore: 80, completenessScore: 80 },
    ]);
    // Old behavior: overall = (0+80+80+80)/4 = 60 (deflated)
    // New behavior: overall = (80+80+80)/3 = 80 (correct)
    expect(result.overallScore).toBe(80);
    expect(result.technicalScore).toBeNull();
  });

  it('should round to one decimal place', () => {
    const result = aggregator.aggregate([
      { technicalScore: 33, communicationScore: 33, correctnessScore: 33, completenessScore: 33 },
      { technicalScore: 34, communicationScore: 34, correctnessScore: 34, completenessScore: 34 },
      { technicalScore: 33, communicationScore: 33, correctnessScore: 33, completenessScore: 33 },
    ]);
    // technical = mean(33,34,33) = 33.333.. → 33.3
    expect(result.technicalScore).toBe(33.3);
  });
});
