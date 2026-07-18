import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { CandidateProfileRepository } from '../repositories/candidate-profile.repository';
import { CandidateProfile } from '../schemas/candidate-profile.schema';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { CANDIDATE_PROFILE_ERRORS } from '../errors/candidate-profile.errors';
import { AppException } from '@core/exceptions/app.exception';
import { CvAnalysisStatus } from '@shared/enums/domain.enums';

export interface ProfileResponse {
  id: string;
  userId: string;
  summary: string;
  skills: string[];
  technologies: string[];
  experience: {
    company: string;
    position: string;
    startDate: Date;
    endDate?: Date;
    description?: string;
  }[];
  projects: { name: string; description?: string; technologies: string[]; url?: string }[];
  strengths: string[];
  weaknesses: string[];
  cvAnalysisStatus: CvAnalysisStatus;
  cvFileUrl: string | null;
  cvFileName: string | null;
  cvFileSize: number | null;
  cvUploadedAt: Date | null;
  completionPercent: number;
}

interface ProfileCompletion {
  hasSummary: boolean;
  hasSkills: boolean;
  hasTechnologies: boolean;
  hasExperience: boolean;
  hasProjects: boolean;
  percent: number;
}

@Injectable()
export class CandidateProfileService {
  private readonly _logger = new Logger(CandidateProfileService.name);

  constructor(private readonly _profileRepo: CandidateProfileRepository) {}

  async findByUserId(userId: string): Promise<ProfileResponse> {
    const profile = await this._profileRepo.findByUserId(userId);
    if (!profile) {
      AppException.throw(CANDIDATE_PROFILE_ERRORS.PROFILE_NOT_FOUND);
    }

    const doc = profile as unknown as {
      _id: Types.ObjectId;
      userId: Types.ObjectId;
      summary: string;
      skills: string[];
      technologies: string[];
      experience: {
        company: string;
        position: string;
        startDate: Date;
        endDate?: Date;
        description?: string;
      }[];
      projects: { name: string; description?: string; technologies: string[]; url?: string }[];
      strengths: string[];
      weaknesses: string[];
      cvAnalysisStatus: CvAnalysisStatus;
      cvFileUrl: string | null;
      cvFileName: string | null;
      cvFileSize: number | null;
      cvUploadedAt: Date | null;
    };

    const completion = this.calculateProfileCompletion(doc);

    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      summary: doc.summary ?? '',
      skills: doc.skills ?? [],
      technologies: doc.technologies ?? [],
      experience: doc.experience ?? [],
      projects: doc.projects ?? [],
      strengths: doc.strengths ?? [],
      weaknesses: doc.weaknesses ?? [],
      cvAnalysisStatus: doc.cvAnalysisStatus,
      cvFileUrl: doc.cvFileUrl ?? null,
      cvFileName: doc.cvFileName ?? null,
      cvFileSize: doc.cvFileSize ?? null,
      cvUploadedAt: doc.cvUploadedAt ?? null,
      completionPercent: completion.percent,
    };
  }

  async findOrCreateByUserId(userId: string): Promise<ProfileResponse> {
    await this._profileRepo.upsertByUserId(userId);
    return this.findByUserId(userId);
  }

  async updateByUserId(userId: string, dto: UpdateProfileDto): Promise<ProfileResponse> {
    const profile = await this._profileRepo.findByUserId(userId);
    if (!profile) {
      const created = await this._profileRepo.create({
        userId: new Types.ObjectId(userId),
        summary: dto.summary ?? '',
        skills: dto.skills ?? [],
        technologies: dto.technologies ?? [],
        experience: (dto.experience ?? []) as CandidateProfile['experience'],
        projects: (dto.projects ?? []) as CandidateProfile['projects'],
        strengths: dto.strengths ?? [],
        weaknesses: dto.weaknesses ?? [],
        cvAnalysisStatus: CvAnalysisStatus.NOT_UPLOADED,
      });
      this._logger.log(`[updateByUserId] Profile created via update for user: ${userId}`);
      return this.findByUserId(userId);
    }

    const doc = profile as unknown as { _id: Types.ObjectId };
    const updateData: Record<string, unknown> = {};

    if (dto.summary !== undefined) updateData.summary = dto.summary;
    if (dto.skills !== undefined) updateData.skills = dto.skills;
    if (dto.technologies !== undefined) updateData.technologies = dto.technologies;
    if (dto.experience !== undefined) updateData.experience = dto.experience;
    if (dto.projects !== undefined) updateData.projects = dto.projects;
    if (dto.strengths !== undefined) updateData.strengths = dto.strengths;
    if (dto.weaknesses !== undefined) updateData.weaknesses = dto.weaknesses;

    await this._profileRepo.updateById(doc._id.toString(), updateData);
    this._logger.log(`[updateByUserId] Profile updated for user: ${userId}`);

    return this.findByUserId(userId);
  }

  async deleteByUserId(userId: string): Promise<{ deleted: true }> {
    const profile = await this._profileRepo.findByUserId(userId);
    if (!profile) {
      AppException.throw(CANDIDATE_PROFILE_ERRORS.PROFILE_NOT_FOUND);
    }

    const doc = profile as unknown as { _id: Types.ObjectId };
    await this._profileRepo.softDeleteById(doc._id.toString());
    this._logger.log(`[deleteByUserId] Profile soft-deleted for user: ${userId}`);

    return { deleted: true };
  }

  async updateCvMetadata(
    userId: string,
    cvData: { cvFileUrl: string; cvFileName: string; cvFileSize: number },
  ): Promise<void> {
    const existing = await this._profileRepo.findByUserId(userId);
    const docId = existing
      ? (existing as unknown as { _id: Types.ObjectId })._id.toString()
      : (
          await this._profileRepo.create({
            userId: new Types.ObjectId(userId),
            summary: '',
            skills: [],
            technologies: [],
            experience: [],
            projects: [],
            strengths: [],
            weaknesses: [],
            cvAnalysisStatus: CvAnalysisStatus.NOT_UPLOADED,
          })
        )._id.toString();

    await this._profileRepo.updateById(docId, {
      cvFileUrl: cvData.cvFileUrl,
      cvFileName: cvData.cvFileName,
      cvFileSize: cvData.cvFileSize,
      cvUploadedAt: new Date(),
      cvAnalysisStatus: CvAnalysisStatus.PENDING,
    });
  }

  async clearCvMetadata(userId: string): Promise<void> {
    const profile = await this._profileRepo.findByUserId(userId);
    if (!profile) return;

    const doc = profile as unknown as { _id: Types.ObjectId };
    await this._profileRepo.updateById(doc._id.toString(), {
      cvFileUrl: null,
      cvFileName: null,
      cvFileSize: null,
      cvUploadedAt: null,
      cvAnalysisStatus: CvAnalysisStatus.NOT_UPLOADED,
    });
  }

  async updateCvAnalysisStatus(userId: string, status: CvAnalysisStatus): Promise<void> {
    const profile = await this._profileRepo.findByUserId(userId);
    if (!profile) return;

    const doc = profile as unknown as { _id: Types.ObjectId };
    await this._profileRepo.updateById(doc._id.toString(), {
      cvAnalysisStatus: status,
    });
  }

  async hasUploadedCv(userId: string): Promise<boolean> {
    const profile = await this._profileRepo.findByUserId(userId);
    if (!profile) return false;

    const doc = profile as unknown as { cvFileUrl: string | null };
    return doc.cvFileUrl !== null && doc.cvFileUrl !== undefined;
  }

  async profileIsComplete(userId: string): Promise<boolean> {
    const profile = await this._profileRepo.findByUserId(userId);
    if (!profile) return false;

    const completion = this.calculateProfileCompletion(
      profile as unknown as Record<string, unknown>,
    );
    return completion.percent === 100;
  }

  calculateProfileCompletion(profile: Record<string, unknown>): ProfileCompletion {
    const hasSummary =
      typeof profile.summary === 'string' && (profile.summary as string).trim().length > 0;
    const hasSkills = Array.isArray(profile.skills) && (profile.skills as unknown[]).length > 0;
    const hasTechnologies =
      Array.isArray(profile.technologies) && (profile.technologies as unknown[]).length > 0;
    const hasExperience =
      Array.isArray(profile.experience) && (profile.experience as unknown[]).length > 0;
    const hasProjects =
      Array.isArray(profile.projects) && (profile.projects as unknown[]).length > 0;

    const fields = [hasSummary, hasSkills, hasTechnologies, hasExperience, hasProjects];
    const filledCount = fields.filter(Boolean).length;
    const percent = Math.round((filledCount / fields.length) * 100);

    return { hasSummary, hasSkills, hasTechnologies, hasExperience, hasProjects, percent };
  }
}
