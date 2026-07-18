import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@core/repository/base.repository';
import { Interview, InterviewDocument } from '../schemas/interview.schema';

@Injectable()
export class InterviewRepository extends BaseRepository<InterviewDocument> {
  constructor(
    @InjectModel(Interview.name) private readonly _interviewModel: Model<InterviewDocument>,
  ) {
    super(_interviewModel);
  }

  async findByUserId(userId: string | Types.ObjectId): Promise<InterviewDocument[]> {
    return this._interviewModel
      .find({ userId, deletedAt: { $exists: false } })
      .sort({ createdAt: -1 })
      .exec();
  }
}
