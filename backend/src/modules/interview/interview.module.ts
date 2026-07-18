import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Interview, InterviewSchema } from './schemas/interview.schema';
import { InterviewRepository } from './repositories/interview.repository';
import { InterviewController } from './controllers/interview.controller';
import { InterviewService } from './services/interview.service';
import { InterviewGenerationService } from './services/interview-generation.service';
import { InterviewSessionService } from './services/interview-session.service';
import { AIModule } from '@modules/ai/ai.module';
import { CandidateProfileModule } from '@modules/candidate-profile/candidate-profile.module';
import { QuestionModule } from '@modules/question/question.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Interview.name, schema: InterviewSchema }]),
    AIModule,
    CandidateProfileModule,
    QuestionModule,
  ],
  controllers: [InterviewController],
  providers: [
    InterviewService,
    InterviewRepository,
    InterviewGenerationService,
    InterviewSessionService,
  ],
  exports: [InterviewService, InterviewRepository, InterviewGenerationService, InterviewSessionService],
})
export class InterviewModule {}
