import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpeechService } from './services/speech.service';
import { SpeechGateway } from './gateways/speech.gateway';
import { WhisperProvider } from './providers/whisper.provider';
import { SPEECH_PROVIDER } from './providers/speech-provider.interface';
import { StorageModule } from '@modules/storage/storage.module';
import { AnswerModule } from '@modules/answer/answer.module';
import { QuestionModule } from '@modules/question/question.module';
import { InterviewModule } from '@modules/interview/interview.module';
import { Answer, AnswerSchema } from '@modules/answer/schemas/answer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Answer.name, schema: AnswerSchema }]),
    StorageModule,
    forwardRef(() => AnswerModule),
    QuestionModule,
    forwardRef(() => InterviewModule),
  ],
  providers: [
    SpeechService,
    SpeechGateway,
    WhisperProvider,
    { provide: SPEECH_PROVIDER, useExisting: WhisperProvider },
  ],
  exports: [SpeechService, SpeechGateway, SPEECH_PROVIDER],
})
export class SpeechModule {}
