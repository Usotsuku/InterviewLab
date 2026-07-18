import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiEvaluation, AiEvaluationSchema } from './schemas/ai-evaluation.schema';
import { AiEvaluationRepository } from './repositories/ai-evaluation.repository';
import { AIService } from './services/ai.service';
import { RetryService } from './services/retry.service';
import { ContextService } from './services/context.service';
import { PromptService } from './services/prompt.service';
import { GeminiProvider } from './providers/gemini.provider';
import { AiConfig } from './config/ai.config';
import { AI_PROVIDER } from './providers/ai-provider.interface';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AiEvaluation.name, schema: AiEvaluationSchema }]),
  ],
  providers: [
    AiConfig,
    RetryService,
    ContextService,
    PromptService,
    GeminiProvider,
    {
      provide: AI_PROVIDER,
      useExisting: GeminiProvider,
    },
    AIService,
    AiEvaluationRepository,
  ],
  exports: [AIService, AiEvaluationRepository, AI_PROVIDER],
})
export class AIModule {}
