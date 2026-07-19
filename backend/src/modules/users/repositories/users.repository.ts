import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '@core/repository/base.repository';
import { QueryService } from '@core/repository/query.service';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersRepository extends BaseRepository<UserDocument> {
  constructor(
    @InjectModel(User.name) private readonly _userModel: Model<UserDocument>,
    queryService: QueryService,
  ) {
    super(_userModel, queryService);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    const normalized = email.trim().toLowerCase();
    return this._userModel
      .findOne({ email: normalized, deletedAt: null })
      .exec();
  }
}
