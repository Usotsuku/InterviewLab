import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '@modules/storage/services/storage.service';
import { CandidateProfileService } from '@modules/candidate-profile/services/candidate-profile.service';
import { PdfExtractionService } from './pdf-extraction.service';
import { CvAnalysisService } from './cv-analysis.service';
import { CV_ERRORS, CV_CONSTRAINTS } from '../errors/cv.errors';
import { AppException } from '@core/exceptions/app.exception';
import { CvAnalysisStatus } from '@shared/enums/domain.enums';

export interface CvMetadataResponse {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: Date;
  analysisStatus: string;
}

export interface UploadCvResponse {
  message: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  status: string;
}

export interface UploadedCvFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class CvService {
  private readonly _logger = new Logger(CvService.name);

  constructor(
    private readonly _storageService: StorageService,
    private readonly _candidateProfileService: CandidateProfileService,
    private readonly _pdfExtractionService: PdfExtractionService,
    private readonly _cvAnalysisService: CvAnalysisService,
    private readonly _config: ConfigService,
  ) {}

  async upload(userId: string, file: UploadedCvFile): Promise<UploadCvResponse> {
    this._validateFile(file);

    const ext = CV_CONSTRAINTS.ALLOWED_EXTENSION;
    const storagePath = `cv/${userId}/${userId}_cv${ext}`;
    const fileBuffer = file.buffer;

    await this._storageService.store(fileBuffer, storagePath);

    const fileUrl = await this._storageService.getFullPath(storagePath);

    await this._candidateProfileService.updateCvMetadata(userId, {
      cvFileUrl: storagePath,
      cvFileName: file.originalname,
      cvFileSize: file.size,
    });

    this._logger.log(`[upload] CV uploaded for user: ${userId}, path: ${storagePath}`);

    const analysisResult = await this._cvAnalysisService.analyze(userId, fileBuffer);

    return {
      message: 'CV uploaded and analyzed successfully.',
      fileName: file.originalname,
      fileUrl,
      fileSize: file.size,
      status: analysisResult.status,
    };
  }

  async replace(userId: string, file: UploadedCvFile): Promise<UploadCvResponse> {
    const profile = await this._getCvMetadata(userId);
    if (profile) {
      await this._storageService.deleteFile(profile.fileUrl);
    }

    return this.upload(userId, file);
  }

  async delete(userId: string): Promise<{ message: string }> {
    const profile = await this._getCvMetadata(userId);
    if (!profile) {
      AppException.throw(CV_ERRORS.CV_NOT_FOUND);
    }

    await this._storageService.deleteFile(profile.fileUrl);
    await this._candidateProfileService.clearCvMetadata(userId);

    this._logger.log(`[delete] CV deleted for user: ${userId}`);

    return { message: 'CV deleted successfully.' };
  }

  async getMetadata(userId: string): Promise<CvMetadataResponse> {
    const profile = await this._getCvMetadata(userId);
    if (!profile) {
      AppException.throw(CV_ERRORS.CV_NOT_FOUND);
    }

    return {
      fileName: profile.fileName,
      fileUrl: await this._storageService.getFullPath(profile.fileUrl),
      fileSize: profile.fileSize,
      uploadedAt: profile.uploadedAt,
      analysisStatus: profile.analysisStatus,
    };
  }

  async getAnalysisStatus(userId: string): Promise<{ status: CvAnalysisStatus }> {
    const profile = await this._candidateProfileService.findOrCreateByUserId(userId);
    return { status: profile.cvAnalysisStatus };
  }

  async extractText(fileBuffer: Buffer): Promise<string> {
    return this._pdfExtractionService.extractText(fileBuffer);
  }

  private _validateFile(file: UploadedCvFile | undefined): void {
    if (!file) {
      AppException.throw(CV_ERRORS.EMPTY_FILE);
    }

    if (file.size === 0) {
      AppException.throw(CV_ERRORS.EMPTY_FILE);
    }

    if (file.mimetype !== CV_CONSTRAINTS.ALLOWED_MIMETYPE) {
      AppException.throw(CV_ERRORS.INVALID_FILE_TYPE);
    }

    if (file.size > CV_CONSTRAINTS.MAX_FILE_SIZE_BYTES) {
      AppException.throw(CV_ERRORS.FILE_TOO_LARGE);
    }

    const ext = this._getExtension(file.originalname);
    if (ext.toLowerCase() !== CV_CONSTRAINTS.ALLOWED_EXTENSION) {
      AppException.throw(CV_ERRORS.INVALID_FILE_TYPE);
    }

    if (!file.buffer || file.buffer.subarray(0, 4).toString('latin1') !== '%PDF') {
      AppException.throw(CV_ERRORS.INVALID_FILE_TYPE);
    }
  }

  private _getExtension(filename: string): string {
    const dotIndex = filename.lastIndexOf('.');
    return dotIndex >= 0 ? filename.substring(dotIndex) : '.pdf';
  }

  private async _getCvMetadata(userId: string): Promise<{
    fileUrl: string;
    fileName: string;
    fileSize: number;
    uploadedAt: Date;
    analysisStatus: string;
  } | null> {
    const profile = await this._candidateProfileService.findByUserId(userId).catch(() => null);
    if (!profile) return null;

    if (!profile.cvFileName || !profile.cvFileUrl) return null;

    return {
      fileUrl: profile.cvFileUrl,
      fileName: profile.cvFileName,
      fileSize: profile.cvFileSize ?? 0,
      uploadedAt: profile.cvUploadedAt ?? new Date(),
      analysisStatus: profile.cvAnalysisStatus,
    };
  }
}
