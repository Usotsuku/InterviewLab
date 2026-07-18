import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@core/repository/base.repository';
import { InterviewMetrics, InterviewMetricsDocument } from '../schemas/interview-metrics.schema';

@Injectable()
export class InterviewMetricsRepository extends BaseRepository<InterviewMetricsDocument> {
  constructor(
    @InjectModel(InterviewMetrics.name)
    private readonly _metricsModel: Model<InterviewMetricsDocument>,
  ) {
    super(_metricsModel);
  }

  async findByAnswerId(
    answerId: string | Types.ObjectId,
  ): Promise<InterviewMetricsDocument | null> {
    return this._metricsModel.findOne({ answerId, deletedAt: { $exists: false } }).exec();
  }

  async findByInterviewId(
    interviewId: string | Types.ObjectId,
  ): Promise<InterviewMetricsDocument[]> {
    return this._metricsModel.find({ interviewId, deletedAt: { $exists: false } }).exec();
  }
}
