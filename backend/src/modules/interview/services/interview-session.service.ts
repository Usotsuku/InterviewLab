import { Injectable, Logger } from '@nestjs/common';
import { InterviewRepository } from '../repositories/interview.repository';
import { QuestionRepository } from '@modules/question/repositories/question.repository';
import { INTERVIEW_ERRORS } from '../errors/interview.errors';
import { AppException } from '@core/exceptions/app.exception';
import { InterviewStatus } from '@shared/enums/domain.enums';
import { Types } from 'mongoose';

interface QuestionResponse {
  id: string;
  order: number;
  text: string;
  type: string;
  difficulty: string;
}

interface StartResponse {
  interviewId: string;
  status: InterviewStatus;
  startedAt: Date;
  totalQuestions: number;
}

interface CurrentQuestionResponse {
  interviewId: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  question: QuestionResponse | null;
}

interface NextQuestionResponse {
  interviewId: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  question: QuestionResponse | null;
  completed: boolean;
}

interface FinishResponse {
  interviewId: string;
  status: InterviewStatus;
  completedAt: Date;
  totalQuestionsAnswered: number;
}

@Injectable()
export class InterviewSessionService {
  private readonly _logger = new Logger(InterviewSessionService.name);

  constructor(
    private readonly _interviewRepo: InterviewRepository,
    private readonly _questionRepo: QuestionRepository,
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
    };
    if (doc.userId.toString() !== userId) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_FOUND);
    }

    if (doc.status !== InterviewStatus.IN_PROGRESS) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_IN_PROGRESS);
    }

    const now = new Date();
    await this._interviewRepo.updateById(interviewId, {
      status: InterviewStatus.COMPLETED,
      completedAt: now,
    });

    this._logger.log(`[finishInterview] Interview completed: ${interviewId}`);

    return {
      interviewId,
      status: InterviewStatus.COMPLETED,
      completedAt: now,
      totalQuestionsAnswered: (doc.currentQuestionIndex ?? 0) + 1,
    };
  }
}
