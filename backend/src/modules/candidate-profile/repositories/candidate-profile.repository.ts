import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@core/repository/base.repository';
import { CandidateProfile, CandidateProfileDocument } from '../schemas/candidate-profile.schema';

@Injectable()
export class CandidateProfileRepository extends BaseRepository<CandidateProfileDocument> {
  constructor(
    @InjectModel(CandidateProfile.name)
    private readonly _profileModel: Model<CandidateProfileDocument>,
  ) {
    super(_profileModel);
  }

  async findByUserId(userId: string | Types.ObjectId): Promise<CandidateProfileDocument | null> {
    return this._profileModel.findOne({ userId, deletedAt: null }).exec();
  }
}
