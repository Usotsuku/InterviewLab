import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SpeechService {
  private readonly _logger = new Logger(SpeechService.name);

  async storeAudio(audioBlob: string, interviewId: string, questionId: string): Promise<string> {
    this._logger.log(`[storeAudio] Storing audio chunk for question: ${questionId}`);
    // TODO: implement Storage Service uploading
    return `https://storage.interviewlab.local/audio/${interviewId}/${questionId}.webm`;
  }
}
