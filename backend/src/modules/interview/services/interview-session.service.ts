import { Injectable, Logger } from '@nestjs/common';
import { InterviewRepository } from '../repositories/interview.repository';
import { QuestionRepository } from '@modules/question/repositories/question.repository';
import { AiEvaluationRepository } from '@modules/ai/repositories/ai-evaluation.repository';
import { INTERVIEW_ERRORS } from '../errors/interview.errors';
import { AppException } from '@core/exceptions/app.exception';
import { InterviewStatus } from '@shared/enums/domain.enums';
import { Types } from 'mongoose';
import { InterviewScoreAggregator } from './interview-score-aggregator';

export interface QuestionResponse {
  id: string;
  order: number;
  text: string;
  type: string;
  difficulty: string;
}

export interface StartResponse {
  interviewId: string;
  status: InterviewStatus;
  startedAt: Date;
  totalQuestions: number;
}

export interface CurrentQuestionResponse {
  interviewId: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  question: QuestionResponse | null;
}

export interface NextQuestionResponse {
  interviewId: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  question: QuestionResponse | null;
  completed: boolean;
}

export interface FinishResponse {
  interviewId: string;
  status: InterviewStatus;
  completedAt: Date;
  actualDurationSeconds: number;
  totalQuestionsAnswered: number;
  overallScore: number | null;
  technicalScore: number | null;
  communicationScore: number | null;
}

@Injectable()
export class InterviewSessionService {
  private readonly _logger = new Logger(InterviewSessionService.name);

  constructor(
    private readonly _interviewRepo: InterviewRepository,
    private readonly _questionRepo: QuestionRepository,
    private readonly _evaluationRepo: AiEvaluationRepository,
    private readonly _scoreAggregator: InterviewScoreAggregator,
  ) {}

  async startInterview(interviewId: string, userId: string): Promise<StartResponse> {
    this._logger.log(`[startInterview] Starting interview: ${interviewId}`);

    const interview = await this._interviewRepo.findById(interviewId);
    if (!interview) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_FOUND);
    }

    const doc = interview as unknown as {
      userId: Types.ObjectId;
      status: InterviewStatus;
      totalQuestions: number;
    };
    if (doc.userId.toString() !== userId) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_FOUND);
    }

    if (doc.status !== InterviewStatus.READY) {
      AppException.throw(INTERVIEW_ERRORS.INVALID_STATUS_TRANSITION);
    }

    const now = new Date();
    await this._interviewRepo.updateById(interviewId, {
      status: InterviewStatus.IN_PROGRESS,
      startedAt: now,
      currentQuestionIndex: 0,
    });

    this._logger.log(`[startInterview] Interview started: ${interviewId}`);

    return {
      interviewId,
      status: InterviewStatus.IN_PROGRESS,
      startedAt: now,
      totalQuestions: doc.totalQuestions,
    };
  }

  async getCurrentQuestion(interviewId: string, userId: string): Promise<CurrentQuestionResponse> {
    const interview = await this._interviewRepo.findById(interviewId);
    if (!interview) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_FOUND);
    }

    const doc = interview as unknown as {
      userId: Types.ObjectId;
      status: InterviewStatus;
      currentQuestionIndex: number;
      totalQuestions: number;
    };
    if (doc.userId.toString() !== userId) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_FOUND);
    }

    if (doc.status !== InterviewStatus.IN_PROGRESS) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_IN_PROGRESS);
    }

    const questions = await this._questionRepo.findByInterviewId(interviewId);
    const currentIndex = doc.currentQuestionIndex ?? 0;

    this._logger.log(
      `[getCurrentQuestion] interviewId=${interviewId} status=${doc.status} currentIdx=${currentIndex} questionsFound=${questions.length} totalQuestions=${doc.totalQuestions}`,
    );

    if (questions.length === 0) {
      AppException.throw(INTERVIEW_ERRORS.NO_QUESTIONS);
    }

    if (currentIndex >= questions.length) {
      return {
        interviewId,
        currentQuestionIndex: currentIndex,
        totalQuestions: doc.totalQuestions,
        question: null,
      };
    }

    const q = questions[currentIndex];
    const typed = q as unknown as {
      _id: Types.ObjectId;
      order: number;
      text: string;
      type: string;
      difficulty: string;
    };

    return {
      interviewId,
      currentQuestionIndex: currentIndex,
      totalQuestions: doc.totalQuestions,
      question: {
        id: typed._id.toString(),
        order: typed.order,
        text: typed.text,
        type: typed.type,
        difficulty: typed.difficulty,
      },
    };
  }

  async nextQuestion(interviewId: string, userId: string): Promise<NextQuestionResponse> {
    this._logger.log(`[nextQuestion] Advancing question for interview: ${interviewId}`);

    const interview = await this._interviewRepo.findById(interviewId);
    if (!interview) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_FOUND);
    }

    const doc = interview as unknown as {
      userId: Types.ObjectId;
      status: InterviewStatus;
      currentQuestionIndex: number;
      totalQuestions: number;
    };
    if (doc.userId.toString() !== userId) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_FOUND);
    }

    if (doc.status !== InterviewStatus.IN_PROGRESS) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_IN_PROGRESS);
    }

    const questions = await this._questionRepo.findByInterviewId(interviewId);
    const currentIndex = doc.currentQuestionIndex ?? 0;

    if (questions.length === 0) {
      AppException.throw(INTERVIEW_ERRORS.NO_QUESTIONS);
    }

    const nextIndex = currentIndex + 1;
    const completed = nextIndex >= questions.length;

    await this._interviewRepo.updateById(interviewId, {
      currentQuestionIndex: completed ? currentIndex : nextIndex,
    });

    this._logger.log(
      `[nextQuestion] Advanced to index ${completed ? currentIndex : nextIndex} for interview: ${interviewId}`,
    );

    if (completed) {
      return {
        interviewId,
        currentQuestionIndex: currentIndex,
        totalQuestions: doc.totalQuestions,
        question: null,
        completed: true,
      };
    }

    const q = questions[nextIndex];
    const typed = q as unknown as {
      _id: Types.ObjectId;
      order: number;
      text: string;
      type: string;
      difficulty: string;
    };

    return {
      interviewId,
      currentQuestionIndex: nextIndex,
      totalQuestions: doc.totalQuestions,
      question: {
        id: typed._id.toString(),
        order: typed.order,
        text: typed.text,
        type: typed.type,
        difficulty: typed.difficulty,
      },
      completed: false,
    };
  }

  async finishInterview(interviewId: string, userId: string): Promise<FinishResponse> {
    this._logger.log(`[finishInterview] Finishing interview: ${interviewId}`);

    const interview = await this._interviewRepo.findById(interviewId);
    if (!interview) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_FOUND);
    }

    const doc = interview as unknown as {
      userId: Types.ObjectId;
      status: InterviewStatus;
      currentQuestionIndex: number;
      totalQuestions: number;
      startedAt: Date | null;
    };
    if (doc.userId.toString() !== userId) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_FOUND);
    }

    if (doc.status !== InterviewStatus.IN_PROGRESS) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_IN_PROGRESS);
    }

    const now = new Date();
    const actualDurationSeconds =
      doc.startedAt != null ? Math.round((now.getTime() - doc.startedAt.getTime()) / 1000) : 0;

    const evaluations = await this._evaluationRepo.findByInterviewId(interviewId);
    const scores = this._scoreAggregator.aggregate(evaluations);

    await this._interviewRepo.updateById(interviewId, {
      status: InterviewStatus.COMPLETED,
      completedAt: now,
      actualDurationSeconds,
      overallScore: scores.overallScore,
      technicalScore: scores.technicalScore,
      communicationScore: scores.communicationScore,
    });

    this._logger.log(
      `[finishInterview] Interview completed: ${interviewId}, duration: ${actualDurationSeconds}s, overallScore: ${scores.overallScore}`,
    );

    return {
      interviewId,
      status: InterviewStatus.COMPLETED,
      completedAt: now,
      actualDurationSeconds,
      totalQuestionsAnswered: (doc.currentQuestionIndex ?? 0) + 1,
      overallScore: scores.overallScore,
      technicalScore: scores.technicalScore,
      communicationScore: scores.communicationScore,
    };
  }
}
