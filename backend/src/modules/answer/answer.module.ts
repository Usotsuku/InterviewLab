import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Answer, AnswerSchema } from './schemas/answer.schema';
import { AnswerRepository } from './repositories/answer.repository';
import { AnswerController } from './controllers/answer.controller';
import { AnswerService } from './services/answer.service';
import { AIModule } from '@modules/ai/ai.module';
import { MetricsModule } from '@modules/metrics/metrics.module';
import { SpeechModule } from '@modules/speech/speech.module';
import { InterviewModule } from '@modules/interview/interview.module';
import { QuestionModule } from '@modules/question/question.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Answer.name, schema: AnswerSchema }]),
    forwardRef(() => AIModule.forRoot()),
    forwardRef(() => MetricsModule),
    forwardRef(() => SpeechModule),
    forwardRef(() => InterviewModule),
    QuestionModule,
  ],
  controllers: [AnswerController],
  providers: [AnswerService, AnswerRepository],
  exports: [AnswerService, AnswerRepository],
})
export class AnswerModule {}
