import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { InterviewRepository } from '../repositories/interview.repository';
import { InterviewMode, InterviewStatus } from '@shared/enums/domain.enums';
import { AppException } from '@core/exceptions/app.exception';
import { INTERVIEW_ERRORS } from '../errors/interview.errors';

export interface InterviewListItem {
  id: string;
  userId: string;
  mode: InterviewMode;
  status: InterviewStatus;
  title: string;
  totalQuestions: number;
  createdAt: Date;
}

export interface InterviewDetailsResponse {
  id: string;
  userId: string;
  mode: InterviewMode;
  status: InterviewStatus;
  title: string;
  estimatedDuration: number;
  actualDurationSeconds: number | null;
  totalQuestions: number;
  currentQuestionIndex: number;
  overallScore: number | null;
  technicalScore: number | null;
  communicationScore: number | null;
  confidenceScore: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

@Injectable()
export class InterviewService {
  private readonly _logger = new Logger(InterviewService.name);

  constructor(private readonly _interviewRepo: InterviewRepository) {}

  async createInterview(
    userId: string,
    mode: InterviewMode,
    questionCount?: number,
  ): Promise<{ id: string; userId: string; mode: InterviewMode; status: InterviewStatus }> {
    const doc = await this._interviewRepo.create({
      userId: new Types.ObjectId(userId),
      mode,
      status: InterviewStatus.CREATED,
      currentQuestionIndex: 0,
      totalQuestions: questionCount ?? 5,
    });

    const created = doc as unknown as { _id: Types.ObjectId };

    this._logger.log(
      `[createInterview] Interview created: ${created._id}, user: ${userId}, mode: ${mode}`,
    );

    return {
      id: created._id.toString(),
      userId,
      mode,
      status: InterviewStatus.CREATED,
    };
  }

  async getInterviewDetails(
    interviewId: string,
    userId: string,
  ): Promise<InterviewDetailsResponse> {
    const interview = await this._interviewRepo.findById(interviewId);
    if (!interview) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_FOUND);
    }

    const doc = interview as unknown as {
      _id: Types.ObjectId;
      userId: Types.ObjectId;
      mode: InterviewMode;
      status: InterviewStatus;
      title: string;
      estimatedDuration: number;
      actualDurationSeconds: number | null;
      totalQuestions: number;
      currentQuestionIndex: number;
      overallScore: number | null;
      technicalScore: number | null;
      communicationScore: number | null;
      confidenceScore: number | null;
      startedAt: Date | null;
      completedAt: Date | null;
    };

    if (doc.userId.toString() !== userId) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_FOUND);
    }

    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      mode: doc.mode,
      status: doc.status,
      title: doc.title ?? '',
      estimatedDuration: doc.estimatedDuration ?? 0,
      actualDurationSeconds: doc.actualDurationSeconds ?? null,
      totalQuestions: doc.totalQuestions ?? 0,
      currentQuestionIndex: doc.currentQuestionIndex ?? 0,
      overallScore: doc.overallScore ?? null,
      technicalScore: doc.technicalScore ?? null,
      communicationScore: doc.communicationScore ?? null,
      confidenceScore: doc.confidenceScore ?? null,
      startedAt: doc.startedAt ?? null,
      completedAt: doc.completedAt ?? null,
    };
  }

  async assertOwnedBy(interviewId: string, userId: string): Promise<void> {
    const interview = await this._interviewRepo.findById(interviewId);
    if (!interview) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_FOUND);
    }

    const doc = interview as unknown as { userId: Types.ObjectId };
    if (doc.userId.toString() !== userId) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_FOUND);
    }
  }

  async getUserInterviews(userId: string): Promise<InterviewListItem[]> {
    const interviews = await this._interviewRepo.findByUserId(userId);

    return interviews.map((doc) => {
      const typed = doc as unknown as {
        _id: Types.ObjectId;
        userId: Types.ObjectId;
        mode: InterviewMode;
        status: InterviewStatus;
        title: string;
        totalQuestions: number;
        createdAt: Date;
      };

      return {
        id: typed._id.toString(),
        userId: typed.userId.toString(),
        mode: typed.mode,
        status: typed.status,
        title: typed.title ?? '',
        totalQuestions: typed.totalQuestions ?? 0,
        createdAt: typed.createdAt,
      };
    });
  }

  async deleteInterview(interviewId: string, userId: string): Promise<{ deleted: true }> {
    const interview = await this._interviewRepo.findById(interviewId);
    if (!interview) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_FOUND);
    }

    const doc = interview as unknown as { userId: Types.ObjectId };
    if (doc.userId.toString() !== userId) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_FOUND);
    }

    await this._interviewRepo.softDeleteById(interviewId);
    this._logger.log(`[deleteInterview] Interview soft-deleted: ${interviewId}`);

    return { deleted: true };
  }

  async advanceQuestion(interviewId: string): Promise<{ interviewId: string; advanced: true }> {
    const interview = await this._interviewRepo.findById(interviewId);
    if (!interview) {
      return { interviewId, advanced: true };
    }

    const doc = interview as unknown as { currentQuestionIndex: number };
    await this._interviewRepo.updateById(interviewId, {
      currentQuestionIndex: (doc.currentQuestionIndex ?? 0) + 1,
    });

    return { interviewId, advanced: true };
  }
}
