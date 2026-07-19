import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@core/repository/base.repository';
import { QueryService } from '@core/repository/query.service';
import { Question, QuestionDocument } from '../schemas/question.schema';

@Injectable()
export class QuestionRepository extends BaseRepository<QuestionDocument> {
  constructor(
    @InjectModel(Question.name) private readonly _questionModel: Model<QuestionDocument>,
    queryService: QueryService,
  ) {
    super(_questionModel, queryService);
  }

  async findByInterviewId(interviewId: string | Types.ObjectId): Promise<QuestionDocument[]> {
    const objectId = this._toObjectId(interviewId);
    return this._questionModel
      .find({ interviewId: objectId, deletedAt: null })
      .sort({ order: 1 })
      .exec();
  }
}
