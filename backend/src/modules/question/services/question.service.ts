import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QuestionRepository } from '../repositories/question.repository';
import { Interview, InterviewDocument } from '@modules/interview/schemas/interview.schema';
import { AppException } from '@core/exceptions/app.exception';
import { INTERVIEW_ERRORS } from '@modules/interview/errors/interview.errors';
import { Types } from 'mongoose';

export interface QuestionResponse {
  id: string;
  interviewId: string;
  order: number;
  text: string;
  type: string;
  difficulty: string;
}

@Injectable()
export class QuestionService {
  private readonly _logger = new Logger(QuestionService.name);

  constructor(
    private readonly _questionRepo: QuestionRepository,
    @InjectModel(Interview.name) private readonly _interviewModel: Model<InterviewDocument>,
  ) {}

  async getQuestionsForSession(
    interviewId: string,
    userId: string,
  ): Promise<QuestionResponse[]> {
    const interview = await this._interviewModel
      .findOne({
        _id: new Types.ObjectId(interviewId),
        userId: new Types.ObjectId(userId),
        deletedAt: null,
      })
      .exec();
    if (!interview) {
      AppException.throw(INTERVIEW_ERRORS.INTERVIEW_NOT_FOUND);
    }

    const questions = await this._questionRepo.findByInterviewId(interviewId);

    return questions.map((doc) => {
      const typed = doc as unknown as {
        _id: Types.ObjectId;
        interviewId: Types.ObjectId;
        order: number;
        text: string;
        type: string;
        difficulty: string;
      };

      return {
        id: typed._id.toString(),
        interviewId: typed.interviewId.toString(),
        order: typed.order,
        text: typed.text,
        type: typed.type,
        difficulty: typed.difficulty,
      };
    });
  }
}
