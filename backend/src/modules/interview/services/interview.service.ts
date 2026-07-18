import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { InterviewRepository } from '../repositories/interview.repository';
import { InterviewMode, InterviewStatus } from '@shared/enums/domain.enums';

interface InterviewListItem {
  id: string;
  userId: string;
  mode: InterviewMode;
  status: InterviewStatus;
  title: string;
  totalQuestions: number;
  createdAt: Date;
}

interface InterviewDetailsResponse {
  id: string;
  userId: string;
  mode: InterviewMode;
  status: InterviewStatus;
  title: string;
  estimatedDuration: number;
  totalQuestions: number;
  currentQuestionIndex: number;
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
  ): Promise<{ id: string; userId: string; mode: InterviewMode; status: InterviewStatus }> {
    const doc = await this._interviewRepo.create({
      userId: new Types.ObjectId(userId),
      mode,
      status: InterviewStatus.CREATED,
      currentQuestionIndex: 0,
      totalQuestions: 0,
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
      return null as unknown as InterviewDetailsResponse;
    }

    const doc = interview as unknown as {
      _id: Types.ObjectId;
      userId: Types.ObjectId;
      mode: InterviewMode;
      status: InterviewStatus;
      title: string;
      estimatedDuration: number;
      totalQuestions: number;
      currentQuestionIndex: number;
      startedAt: Date | null;
      completedAt: Date | null;
    };

    if (doc.userId.toString() !== userId) {
      return null as unknown as InterviewDetailsResponse;
    }

    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      mode: doc.mode,
      status: doc.status,
      title: doc.title ?? '',
      estimatedDuration: doc.estimatedDuration ?? 0,
      totalQuestions: doc.totalQuestions ?? 0,
      currentQuestionIndex: doc.currentQuestionIndex ?? 0,
      startedAt: doc.startedAt ?? null,
      completedAt: doc.completedAt ?? null,
    };
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
      return { deleted: true };
    }

    const doc = interview as unknown as { userId: Types.ObjectId };
    if (doc.userId.toString() !== userId) {
      return { deleted: true };
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
