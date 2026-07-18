import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InterviewMetrics, InterviewMetricsSchema } from './schemas/interview-metrics.schema';
import { InterviewMetricsRepository } from './repositories/interview-metrics.repository';
import { MetricsService } from './services/metrics.service';
import { MetricsCalculationService } from './services/metrics-calculation.service';
import { SpeakingSpeedCalculator } from './calculators/speaking-speed.calculator';
import { PauseCalculator } from './calculators/pause.calculator';
import { VocabularyCalculator } from './calculators/vocabulary.calculator';
import { FillerCalculator } from './calculators/filler.calculator';
import { RepetitionCalculator } from './calculators/repetition.calculator';
import { KeywordCoverageCalculator } from './calculators/keyword-coverage.calculator';
import { DurationCalculator } from './calculators/duration.calculator';
import { ConfidenceCalculator } from './calculators/confidence.calculator';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: InterviewMetrics.name, schema: InterviewMetricsSchema }]),
  ],
  providers: [
    MetricsService,
    MetricsCalculationService,
    InterviewMetricsRepository,
    SpeakingSpeedCalculator,
    PauseCalculator,
    VocabularyCalculator,
    FillerCalculator,
    RepetitionCalculator,
    KeywordCoverageCalculator,
    DurationCalculator,
    ConfidenceCalculator,
  ],
  exports: [MetricsService, MetricsCalculationService, InterviewMetricsRepository],
})
export class MetricsModule {}
