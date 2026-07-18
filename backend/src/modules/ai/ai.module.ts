import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiEvaluation, AiEvaluationSchema } from './schemas/ai-evaluation.schema';
import { AiEvaluationRepository } from './repositories/ai-evaluation.repository';
import { AIService } from './services/ai.service';
import { RetryService } from './services/retry.service';
import { ContextService } from './services/context.service';
import { PromptService } from './services/prompt.service';
import { AnswerEvaluationService } from './services/answer-evaluation.service';
import { GeminiProvider } from './providers/gemini.provider';
import { KimiProvider } from './providers/kimi.provider';
import { AiConfig } from './config/ai.config';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import { AnswerModule } from '@modules/answer/answer.module';
import { QuestionModule } from '@modules/question/question.module';
import { CandidateProfileModule } from '@modules/candidate-profile/candidate-profile.module';
import { InterviewModule } from '@modules/interview/interview.module';
import { MetricsModule } from '@modules/metrics/metrics.module';

const providerFactory = {
  provide: AI_PROVIDER,
  useFactory: (config: AiConfig, gemini: GeminiProvider, kimi: KimiProvider) => {
    switch (config.provider) {
      case 'kimi':
        return kimi;
      case 'gemini':
      default:
        return gemini;
    }
  },
  inject: [AiConfig, GeminiProvider, KimiProvider],
};

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AiEvaluation.name, schema: AiEvaluationSchema }]),
    forwardRef(() => AnswerModule),
    QuestionModule,
    CandidateProfileModule,
    forwardRef(() => InterviewModule),
    MetricsModule,
  ],
  providers: [
    AiConfig,
    RetryService,
    ContextService,
    PromptService,
    GeminiProvider,
    KimiProvider,
    providerFactory,
    AIService,
    AiEvaluationRepository,
    AnswerEvaluationService,
  ],
  exports: [AIService, AiEvaluationRepository, AnswerEvaluationService, PromptService, AI_PROVIDER],
})
export class AIModule {}
