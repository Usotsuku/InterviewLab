import { Module } from '@nestjs/common';
import { SpeechService } from './services/speech.service';

@Module({
  providers: [SpeechService],
  exports: [SpeechService],
})
export class SpeechModule {}
