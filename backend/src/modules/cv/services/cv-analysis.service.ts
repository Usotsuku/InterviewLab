import { Injectable, Logger } from '@nestjs/common';
import { AIService } from '@modules/ai/services/ai.service';
import { PromptService } from '@modules/ai/services/prompt.service';
import { CandidateProfileService } from '@modules/candidate-profile/services/candidate-profile.service';
import { NotificationService } from '@modules/notification/services/notification.service';
import { PdfExtractionService } from './pdf-extraction.service';
import { mapAiResponseToProfile, MappedProfile } from './cv-analysis.mapper';
import { CvAnalysisStatus, NotificationType } from '@shared/enums/domain.enums';
import { AppException } from '@core/exceptions/app.exception';
import { CV_ERRORS } from '../errors/cv.errors';

export interface AnalysisResult {
  status: CvAnalysisStatus;
  profile: MappedProfile | null;
}

@Injectable()
export class CvAnalysisService {
  private readonly _logger = new Logger(CvAnalysisService.name);

  constructor(
    private readonly _pdfExtractionService: PdfExtractionService,
    private readonly _aiService: AIService,
    private readonly _promptService: PromptService,
    private readonly _candidateProfileService: CandidateProfileService,
    private readonly _notificationService: NotificationService,
  ) {}

  async analyze(userId: string, fileBuffer: Buffer): Promise<AnalysisResult> {
    this._logger.log(`[analyze] Starting CV analysis for user: ${userId}`);

    await this._candidateProfileService.updateCvAnalysisStatus(userId, CvAnalysisStatus.PROCESSING);

    try {
      const extractedText = await this._pdfExtractionService.extractText(fileBuffer);

      const payload = this._promptService.buildCvPrompt(extractedText);

      const response = await this._aiService.generate({
        prompt: payload.prompt,
        systemInstruction: payload.systemInstruction,
      });

      const mappedProfile = mapAiResponseToProfile(response.text);

      await this._candidateProfileService.updateByUserId(userId, {
        summary: mappedProfile.summary,
        skills: mappedProfile.skills,
        technologies: mappedProfile.technologies,
        strengths: mappedProfile.strengths,
        weaknesses: mappedProfile.weaknesses,
      });

      await this._candidateProfileService.updateCvAnalysisStatus(
        userId,
        CvAnalysisStatus.COMPLETED,
      );

      this._logger.log(`[analyze] CV analysis completed for user: ${userId}`);

      try {
        await this._notificationService.notifyCvAnalysisComplete(userId);
      } catch (notifError) {
        this._logger.warn(`[analyze] Failed to send notification: ${String(notifError)}`);
      }

      return { status: CvAnalysisStatus.COMPLETED, profile: mappedProfile };
    } catch (error) {
      if (error instanceof AppException) {
        this._logger.error(
          `[analyze] Analysis failed for user: ${userId}, error: ${error.message}`,
        );
        await this._candidateProfileService.updateCvAnalysisStatus(userId, CvAnalysisStatus.FAILED);
        return { status: CvAnalysisStatus.FAILED, profile: null };
      }

      this._logger.error(`[analyze] Unexpected error for user: ${userId}: ${String(error)}`);
      await this._candidateProfileService.updateCvAnalysisStatus(userId, CvAnalysisStatus.FAILED);
      return { status: CvAnalysisStatus.FAILED, profile: null };
    }
  }
}
