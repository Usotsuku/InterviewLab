import { Injectable } from '@nestjs/common';
import { MetricsInput, MetricsResult } from '../calculators/calculator.types';
import { SpeakingSpeedCalculator } from '../calculators/speaking-speed.calculator';
import { PauseCalculator } from '../calculators/pause.calculator';
import { VocabularyCalculator } from '../calculators/vocabulary.calculator';
import { FillerCalculator } from '../calculators/filler.calculator';
import { RepetitionCalculator } from '../calculators/repetition.calculator';
import { KeywordCoverageCalculator } from '../calculators/keyword-coverage.calculator';
import { DurationCalculator } from '../calculators/duration.calculator';
import { ConfidenceCalculator } from '../calculators/confidence.calculator';

@Injectable()
export class MetricsCalculationService {
  constructor(
    private readonly _speakingSpeed: SpeakingSpeedCalculator,
    private readonly _pause: PauseCalculator,
    private readonly _vocabulary: VocabularyCalculator,
    private readonly _filler: FillerCalculator,
    private readonly _repetition: RepetitionCalculator,
    private readonly _keywordCoverage: KeywordCoverageCalculator,
    private readonly _duration: DurationCalculator,
    private readonly _confidence: ConfidenceCalculator,
  ) {}

  calculate(input: MetricsInput): MetricsResult {
    const wordCount = this._countWords(input.transcript);

    const wordsPerMinute = this._speakingSpeed.calculate(
      input.transcript,
      input.durationSeconds,
    );

    const pauseMetrics = this._pause.calculate(
      input.transcript,
      input.durationSeconds,
    );

    const vocabularyRichness = this._vocabulary.calculate(input.transcript);
    const fillerCount = this._filler.calculate(input.transcript);
    const repetitionScore = this._repetition.calculate(input.transcript);

    const keywordCoverage = this._keywordCoverage.calculate(
      input.transcript,
      input.expectedKeywords,
    );

    const answerDuration = this._duration.calculate(
      input.durationSeconds,
      input.estimatedAnswerDuration,
    );

    const confidenceScore = this._confidence.calculate({
      wordsPerMinute,
      pauseCount: pauseMetrics.pauseCount,
      averagePause: pauseMetrics.averagePause,
      longestPause: pauseMetrics.longestPause,
      vocabularyRichness,
      fillerCount,
      repetitionScore,
      keywordCoverage,
      answerDuration,
      wordCount,
    });

    return {
      wordsPerMinute,
      answerDuration,
      pauseCount: pauseMetrics.pauseCount,
      averagePause: pauseMetrics.averagePause,
      longestPause: pauseMetrics.longestPause,
      fillerCount,
      vocabularyRichness,
      repetitionScore,
      keywordCoverage,
      confidenceScore,
    };
  }

  private _countWords(transcript: string): number {
    return transcript
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  }
}
