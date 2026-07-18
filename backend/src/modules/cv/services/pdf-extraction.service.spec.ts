import { Test, TestingModule } from '@nestjs/testing';
import { PdfExtractionService } from './pdf-extraction.service';

jest.mock('pdf-parse', () => {
  return jest.fn().mockResolvedValue({
    text: 'John Doe\nSoftware Engineer\nSkills: JavaScript, TypeScript, React',
    numpages: 2,
    numrender: 2,
  });
});

describe('PdfExtractionService', () => {
  let service: PdfExtractionService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfExtractionService],
    }).compile();

    service = module.get<PdfExtractionService>(PdfExtractionService);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('extractText', () => {
    it('should extract text from a valid PDF buffer', async () => {
      const buffer = Buffer.from('fake pdf content');
      const result = await service.extractText(buffer);
      expect(result).toBe('John Doe\nSoftware Engineer\nSkills: JavaScript, TypeScript, React');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw EMPTY_CV_CONTENT when pdf-parse returns empty text', async () => {
      const pdfParse = require('pdf-parse');
      pdfParse.mockResolvedValueOnce({ text: '', numpages: 1 });

      const buffer = Buffer.from('empty pdf');
      await expect(service.extractText(buffer)).rejects.toThrow();
    });

    it('should throw EXTRACTION_FAILED on parse error', async () => {
      const pdfParse = require('pdf-parse');
      pdfParse.mockRejectedValueOnce(new Error('corrupted'));

      const buffer = Buffer.from('bad pdf');
      await expect(service.extractText(buffer)).rejects.toThrow();
    });
  });

  describe('validateDocument', () => {
    it('should return valid for a good PDF', async () => {
      const buffer = Buffer.from('valid pdf');
      const result = await service.validateDocument(buffer);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for empty text', async () => {
      const pdfParse = require('pdf-parse');
      pdfParse.mockResolvedValueOnce({ text: '', numpages: 1 });

      const buffer = Buffer.from('empty');
      const result = await service.validateDocument(buffer);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('PDF contains no extractable text');
    });

    it('should return invalid on parse error', async () => {
      const pdfParse = require('pdf-parse');
      pdfParse.mockRejectedValueOnce(new Error('bad'));

      const buffer = Buffer.from('bad');
      const result = await service.validateDocument(buffer);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('PDF file is corrupted or unreadable');
    });
  });
});
