import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Interview, InterviewSchema } from './schemas/interview.schema';
import { InterviewRepository } from './repositories/interview.repository';
import { InterviewController } from './controllers/interview.controller';
import { InterviewService } from './services/interview.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Interview.name, schema: InterviewSchema }]),
  ],
  controllers: [InterviewController],
  providers: [InterviewService, InterviewRepository],
  exports: [InterviewService, InterviewRepository],
})
export class InterviewModule {}
