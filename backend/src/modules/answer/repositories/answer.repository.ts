import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@core/repository/base.repository';
import { Answer, AnswerDocument } from '../schemas/answer.schema';

@Injectable()
export class AnswerRepository extends BaseRepository<AnswerDocument> {
  constructor(@InjectModel(Answer.name) private readonly _answerModel: Model<AnswerDocument>) {
    super(_answerModel);
  }

  async findByInterviewId(interviewId: string | Types.ObjectId): Promise<AnswerDocument[]> {
    return this._answerModel
      .find({ interviewId, deletedAt: { $exists: false } })
      .exec();
  }

  async findByQuestionId(questionId: string | Types.ObjectId): Promise<AnswerDocument | null> {
    return this._answerModel.findOne({ questionId, deletedAt: { $exists: false } }).exec();
  }
}
