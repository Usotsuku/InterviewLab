import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StorageService {
  private readonly _logger = new Logger(StorageService.name);

  async store(fileBuffer: Buffer, path: string): Promise<string> {
    this._logger.log(`[store] Storing file payload to path: ${path}`);
    // TODO: implement local or s3 upload logic
    return `https://storage.interviewlab.local/${path}`;
  }
}
