import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@core/repository/base.repository';
import { QueryService } from '@core/repository/query.service';
import { CandidateProfile, CandidateProfileDocument } from '../schemas/candidate-profile.schema';
import { CvAnalysisStatus } from '@shared/enums/domain.enums';

@Injectable()
export class CandidateProfileRepository extends BaseRepository<CandidateProfileDocument> {
  constructor(
    @InjectModel(CandidateProfile.name)
    private readonly _profileModel: Model<CandidateProfileDocument>,
    queryService: QueryService,
  ) {
    super(_profileModel, queryService);
  }

  async findByUserId(userId: string | Types.ObjectId): Promise<CandidateProfileDocument | null> {
    return this._profileModel.findOne({ userId, deletedAt: null }).exec();
  }

  async upsertByUserId(userId: string | Types.ObjectId): Promise<CandidateProfileDocument> {
    return this._profileModel
      .findOneAndUpdate(
        { userId, deletedAt: null },
        {
          $setOnInsert: {
            userId,
            summary: '',
            skills: [],
            technologies: [],
            experience: [],
            projects: [],
            strengths: [],
            weaknesses: [],
            cvAnalysisStatus: CvAnalysisStatus.NOT_UPLOADED,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }
}
