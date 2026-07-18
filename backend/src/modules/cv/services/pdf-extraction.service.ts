import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PdfExtractionService {
  private readonly _logger = new Logger(PdfExtractionService.name);

  async extractText(_fileBuffer: Buffer): Promise<string> {
    this._logger.log('[extractText] PDF text extraction not yet implemented');
    // TODO: implement PDF text extraction in Sprint 4 (AI Foundation)
    return '';
  }

  async validateDocument(_fileBuffer: Buffer): Promise<{ valid: boolean; errors: string[] }> {
    this._logger.log('[validateDocument] PDF validation not yet implemented');
    // TODO: implement PDF structural validation
    return { valid: true, errors: [] };
  }
}
