import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@core/repository/base.repository';
import { QueryService } from '@core/repository/query.service';
import { Interview, InterviewDocument } from '../schemas/interview.schema';

@Injectable()
export class InterviewRepository extends BaseRepository<InterviewDocument> {
  constructor(
    @InjectModel(Interview.name) private readonly _interviewModel: Model<InterviewDocument>,
    queryService: QueryService,
  ) {
    super(_interviewModel, queryService);
  }

  async findByUserId(userId: string | Types.ObjectId): Promise<InterviewDocument[]> {
    return this._interviewModel
      .find({ userId, deletedAt: null })
      .sort({ createdAt: -1 })
      .exec();
  }
}
