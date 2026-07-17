import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InterviewMetrics, InterviewMetricsSchema } from './schemas/interview-metrics.schema';
import { InterviewMetricsRepository } from './repositories/interview-metrics.repository';
import { MetricsService } from './services/metrics.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: InterviewMetrics.name, schema: InterviewMetricsSchema }]),
  ],
  providers: [MetricsService, InterviewMetricsRepository],
  exports: [MetricsService, InterviewMetricsRepository],
})
export class MetricsModule {}
