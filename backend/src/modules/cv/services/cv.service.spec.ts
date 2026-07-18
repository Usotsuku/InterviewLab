import { Test, TestingModule } from '@nestjs/testing';
import { CvService } from './cv.service';
import { StorageService } from '@modules/storage/services/storage.service';
import { CandidateProfileService } from '@modules/candidate-profile/services/candidate-profile.service';
import { PdfExtractionService } from './pdf-extraction.service';
import { CvAnalysisService } from './cv-analysis.service';
import { ConfigService } from '@nestjs/config';
import { CV_ERRORS } from '../errors/cv.errors';
import { CvAnalysisStatus } from '@shared/enums/domain.enums';

describe('CvService', () => {
  let service: CvService;

  const mockStorageService = {
    store: jest.fn().mockResolvedValue('cv/user1/user1_cv.pdf'),
    getFullPath: jest.fn().mockResolvedValue('/uploads/cv/user1/user1_cv.pdf'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    fileExists: jest.fn().mockResolvedValue(true),
  };

  const mockProfileService = {
    findByUserId: jest.fn(),
    updateCvMetadata: jest.fn(),
    clearCvMetadata: jest.fn(),
  };

  const mockPdfService = {
    extractText: jest.fn().mockResolvedValue('extracted text'),
  };

  const mockAnalysisService = {
    analyze: jest.fn().mockResolvedValue({
      status: CvAnalysisStatus.COMPLETED,
      profile: {
        summary: 'test',
        skills: [],
        technologies: [],
        strengths: [],
        weaknesses: [],
        experience: [],
        projects: [],
      },
    }),
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue('./uploads'),
  };

  const createMockFile = (overrides: Record<string, unknown> = {}): Express.Multer.File =>
    ({
      fieldname: 'file',
      originalname: 'test-cv.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('%PDF-1.4\ntest pdf content'),
      destination: '',
      filename: 'test-cv.pdf',
      path: '',
      stream: null,
      ...overrides,
    }) as unknown as Express.Multer.File;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CvService,
        { provide: StorageService, useValue: mockStorageService },
        { provide: CandidateProfileService, useValue: mockProfileService },
        { provide: PdfExtractionService, useValue: mockPdfService },
        { provide: CvAnalysisService, useValue: mockAnalysisService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<CvService>(CvService);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('upload', () => {
    it('should upload a valid PDF and trigger analysis', async () => {
      const file = createMockFile();
      const result = await service.upload('user1', file);
      expect(result.message).toContain('uploaded and analyzed');
      expect(result.fileName).toBe('test-cv.pdf');
      expect(result.status).toBe(CvAnalysisStatus.COMPLETED);
      expect(mockStorageService.store).toHaveBeenCalled();
      expect(mockProfileService.updateCvMetadata).toHaveBeenCalled();
      expect(mockAnalysisService.analyze).toHaveBeenCalledWith('user1', file.buffer);
    });

    it('should throw for non-PDF file', async () => {
      const file = createMockFile({ mimetype: 'image/png', originalname: 'photo.png' });
      await expect(service.upload('user1', file)).rejects.toThrow();
    });

    it('should throw for empty file', async () => {
      const file = createMockFile({ size: 0 });
      await expect(service.upload('user1', file)).rejects.toThrow();
    });

    it('should throw for oversized file', async () => {
      const file = createMockFile({ size: 20 * 1024 * 1024 });
      await expect(service.upload('user1', file)).rejects.toThrow();
    });

    it('should throw for wrong extension', async () => {
      const file = createMockFile({ originalname: 'doc.txt', mimetype: 'application/pdf' });
      await expect(service.upload('user1', file)).rejects.toThrow();
    });
  });

  describe('replace', () => {
    it('should delete old file and upload new', async () => {
      mockProfileService.findByUserId.mockResolvedValue({
        cvFileUrl: 'cv/user1/user1_cv.pdf',
        cvFileName: 'old.pdf',
      });
      const file = createMockFile();
      const result = await service.replace('user1', file);
      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('cv/user1/user1_cv.pdf');
      expect(result.message).toContain('uploaded and analyzed');
    });

    it('should upload without deleting if no existing CV', async () => {
      mockProfileService.findByUserId.mockResolvedValue(null);
      const file = createMockFile();
      const result = await service.replace('user1', file);
      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
      expect(result.message).toContain('uploaded and analyzed');
    });
  });

  describe('delete', () => {
    it('should delete CV and clear metadata', async () => {
      mockProfileService.findByUserId.mockResolvedValue({
        cvFileUrl: 'cv/user1/user1_cv.pdf',
        cvFileName: 'cv.pdf',
      });
      const result = await service.delete('user1');
      expect(result.message).toContain('deleted successfully');
      expect(mockStorageService.deleteFile).toHaveBeenCalled();
      expect(mockProfileService.clearCvMetadata).toHaveBeenCalled();
    });

    it('should throw if no CV exists', async () => {
      mockProfileService.findByUserId.mockResolvedValue(null);
      await expect(service.delete('user1')).rejects.toThrow();
    });
  });

  describe('getMetadata', () => {
    it('should return CV metadata', async () => {
      mockProfileService.findByUserId.mockResolvedValue({
        cvFileUrl: 'cv/user1/user1_cv.pdf',
        cvFileName: 'my-cv.pdf',
        cvFileSize: 2048,
        cvUploadedAt: new Date('2024-01-01'),
        cvAnalysisStatus: 'PENDING',
      });
      const result = await service.getMetadata('user1');
      expect(result.fileName).toBe('my-cv.pdf');
      expect(result.fileSize).toBe(2048);
    });

    it('should throw if no CV found', async () => {
      mockProfileService.findByUserId.mockResolvedValue(null);
      await expect(service.getMetadata('user1')).rejects.toThrow();
    });
  });

  describe('extractText', () => {
    it('should delegate to PdfExtractionService', async () => {
      const result = await service.extractText(Buffer.from('pdf'));
      expect(result).toBe('extracted text');
      expect(mockPdfService.extractText).toHaveBeenCalled();
    });
  });
});
