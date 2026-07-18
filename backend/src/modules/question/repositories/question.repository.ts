import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@core/repository/base.repository';
import { Question, QuestionDocument } from '../schemas/question.schema';

@Injectable()
export class QuestionRepository extends BaseRepository<QuestionDocument> {
  private readonly _logger = new Logger(QuestionRepository.name);

  constructor(
    @InjectModel(Question.name) private readonly _questionModel: Model<QuestionDocument>,
  ) {
    super(_questionModel);
  }

  async findByInterviewId(interviewId: string | Types.ObjectId): Promise<QuestionDocument[]> {
    const filter = { interviewId, deletedAt: null };
    this._logger.debug(`[findByInterviewId] query: ${JSON.stringify({ interviewId: String(interviewId), deletedAt: null })}`);
    const results = await this._questionModel
      .find(filter)
      .sort({ order: 1 })
      .exec();
    this._logger.debug(`[findByInterviewId] results: ${results.length}`);
    return results;
  }
}
