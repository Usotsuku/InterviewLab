import { Module, DynamicModule, forwardRef, Provider, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiEvaluation, AiEvaluationSchema } from './schemas/ai-evaluation.schema';
import { AiEvaluationRepository } from './repositories/ai-evaluation.repository';
import { AIService } from './services/ai.service';
import { RetryService } from './services/retry.service';
import { ContextService } from './services/context.service';
import { PromptService } from './services/prompt.service';
import { AnswerEvaluationService } from './services/answer-evaluation.service';
import { AiRateLimiterService } from './services/ai-rate-limiter.service';
import { GeminiProvider } from './providers/gemini.provider';
import { KimiProvider } from './providers/kimi.provider';
import { GroqProvider } from './providers/groq.provider';
import { AiConfig } from './config/ai.config';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import { AIProvider } from './providers/ai-provider.interface';
import { AnswerModule } from '@modules/answer/answer.module';
import { QuestionModule } from '@modules/question/question.module';
import { CandidateProfileModule } from '@modules/candidate-profile/candidate-profile.module';
import { InterviewModule } from '@modules/interview/interview.module';
import { MetricsModule } from '@modules/metrics/metrics.module';

const PROVIDER_MAP: Record<string, new (...args: any[]) => AIProvider> = {
  gemini: GeminiProvider,
  kimi: KimiProvider,
  groq: GroqProvider,
};

function parseActiveProviders(): string[] {
  const raw = process.env.AI_PROVIDER || 'gemini';
  return [...new Set(raw.split(',').map((p) => p.trim().toLowerCase()))];
}

const _moduleLogger = new Logger('AIModule');

@Module({})
export class AIModule {
  static forRoot(): DynamicModule {
    const active = parseActiveProviders();
    const providerClasses = active
      .map((name) => ({ name, cls: PROVIDER_MAP[name] }))
      .filter((p) => {
        if (!p.cls) {
          _moduleLogger.warn(`Unknown provider "${p.name}" in AI_PROVIDER — skipping`);
          return false;
        }
        return true;
      });

    const dynamicProviders: Provider[] = [
      AiConfig,
      RetryService,
      ContextService,
      PromptService,
      AIService,
      AiEvaluationRepository,
      AnswerEvaluationService,
      AiRateLimiterService,
      ...providerClasses.map((p) => p.cls),
    ];

    const primaryName = providerClasses[0]?.name ?? 'gemini';

    dynamicProviders.push({
      provide: AI_PROVIDER,
      useFactory: (...instances: AIProvider[]) => {
        const primary = instances.find((i) => i.name === primaryName);
        if (!primary) {
          throw new Error(
            `[AIModule] Primary provider "${primaryName}" not found among active providers: ${active.join(', ')}`,
          );
        }
        return primary;
      },
      inject: providerClasses.map((p) => p.cls),
    });

    return {
      module: AIModule,
      imports: [
        MongooseModule.forFeature([{ name: AiEvaluation.name, schema: AiEvaluationSchema }]),
        forwardRef(() => AnswerModule),
        QuestionModule,
        CandidateProfileModule,
        forwardRef(() => InterviewModule),
        MetricsModule,
      ],
      providers: dynamicProviders,
      exports: [
        AIService,
        AiEvaluationRepository,
        AnswerEvaluationService,
        PromptService,
        RetryService,
        AiRateLimiterService,
        AI_PROVIDER,
      ],
    };
  }
}
