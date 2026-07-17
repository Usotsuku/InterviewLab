import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiEvaluation, AiEvaluationSchema } from './schemas/ai-evaluation.schema';
import { AiEvaluationRepository } from './repositories/ai-evaluation.repository';
import { AIService } from './services/ai.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AiEvaluation.name, schema: AiEvaluationSchema }]),
  ],
  providers: [AIService, AiEvaluationRepository],
  exports: [AIService, AiEvaluationRepository],
})
export class AIModule {}
