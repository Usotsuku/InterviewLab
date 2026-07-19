import { Injectable } from '@nestjs/common';

export interface AiEvaluationScore {
  technicalScore?: number | null;
  communicationScore?: number | null;
  correctnessScore?: number | null;
  completenessScore?: number | null;
}

export interface AggregatedScores {
  overallScore: number | null;
  technicalScore: number | null;
  communicationScore: number | null;
}

@Injectable()
export class InterviewScoreAggregator {
  /**
   * Aggregates per-answer AI evaluation scores into interview-level scores.
   *
   * Each AiEvaluation record contains four score dimensions (0-100 scale):
   *   - technicalScore:       domain-specific knowledge demonstrated
   *   - communicationScore:   clarity, structure, articulation
   *   - correctnessScore:     factual accuracy of the answer
   *   - completenessScore:    coverage of the expected answer
   *
   * Per-dimension interview scores are computed as the arithmetic mean of
   * non-null values only. Returns null for any dimension where all
   * evaluations have null/undefined for that score.
   *
   * overallScore is computed as the mean of per-evaluation averages,
   * where each per-evaluation average includes only non-null dimensions.
   *
   * Formulas:
   *   technicalScore     = mean(technicalScore_i)         for i where technicalScore_i is not null
   *   communicationScore = mean(communicationScore_i)     for i where communicationScore_i is not null
   *   overallScore       = mean(overallScore_i)            for i where overallScore_i is defined
   *     where overallScore_i = mean of non-null values among {technical_i, communication_i, correctness_i, completeness_i}
   */
  aggregate(evaluations: AiEvaluationScore[]): {
    overallScore: number | null;
    technicalScore: number | null;
    communicationScore: number | null;
  } {
    if (evaluations.length === 0) {
      return { overallScore: null, technicalScore: null, communicationScore: null };
    }

    const technicalValues = evaluations
      .map((e) => e.technicalScore)
      .filter((v): v is number => v != null);

    const communicationValues = evaluations
      .map((e) => e.communicationScore)
      .filter((v): v is number => v != null);

    const perEvaluationOverall: number[] = [];
    for (const e of evaluations) {
      const dimensions = [e.technicalScore, e.communicationScore, e.correctnessScore, e.completenessScore];
      const nonNull = dimensions.filter((v): v is number => v != null);
      if (nonNull.length > 0) {
        perEvaluationOverall.push(nonNull.reduce((a, b) => a + b, 0) / nonNull.length);
      }
    }

    return {
      technicalScore: technicalValues.length > 0 ? this._mean(technicalValues) : null,
      communicationScore: communicationValues.length > 0 ? this._mean(communicationValues) : null,
      overallScore: perEvaluationOverall.length > 0 ? this._mean(perEvaluationOverall) : null,
    };
  }

  private _mean(values: number[]): number {
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round((sum / values.length) * 10) / 10;
  }
}
