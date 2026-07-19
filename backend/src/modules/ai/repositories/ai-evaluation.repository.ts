import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@core/repository/base.repository';
import { AiEvaluation, AiEvaluationDocument } from '../schemas/ai-evaluation.schema';

@Injectable()
export class AiEvaluationRepository extends BaseRepository<AiEvaluationDocument> {
  constructor(
    @InjectModel(AiEvaluation.name) private readonly _evalModel: Model<AiEvaluationDocument>,
  ) {
    super(_evalModel);
  }

  async findByAnswerId(answerId: string | Types.ObjectId): Promise<AiEvaluationDocument | null> {
    return this._evalModel
      .findOne({ answerId: this._toObjectId(answerId), deletedAt: null })
      .exec();
  }

  async findByInterviewId(interviewId: string | Types.ObjectId): Promise<AiEvaluationDocument[]> {
    return this._evalModel
      .find({ interviewId: this._toObjectId(interviewId), deletedAt: null })
      .exec();
  }
}
