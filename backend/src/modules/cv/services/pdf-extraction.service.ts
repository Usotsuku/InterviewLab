import { Injectable, Logger } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import { AppException } from '@core/exceptions/app.exception';
import { CV_ERRORS } from '../errors/cv.errors';

@Injectable()
export class PdfExtractionService {
  private readonly _logger = new Logger(PdfExtractionService.name);

  async extractText(fileBuffer: Buffer): Promise<string> {
    try {
      this._logger.log('[extractText] Starting PDF text extraction');

      const data = await pdfParse(fileBuffer);

      if (!data || !data.text || data.text.trim().length === 0) {
        AppException.throw(CV_ERRORS.EMPTY_CV_CONTENT);
      }

      const text = data.text.trim();
      this._logger.log(`[extractText] Extracted ${text.length} characters, ${data.numpages} pages`);

      return text;
    } catch (error) {
      if (error instanceof AppException) throw error;
      this._logger.error(`[extractText] PDF extraction failed: ${String(error)}`);
      AppException.throw(CV_ERRORS.EXTRACTION_FAILED);
    }
  }

  async validateDocument(fileBuffer: Buffer): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const data = await pdfParse(fileBuffer);

      if (!data || data.numpages === 0) {
        errors.push('PDF has no pages');
      }

      if (!data.text || data.text.trim().length === 0) {
        errors.push('PDF contains no extractable text');
      }
    } catch {
      errors.push('PDF file is corrupted or unreadable');
    }

    return { valid: errors.length === 0, errors };
  }
}
