import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@core/repository/base.repository';
import { QueryService } from '@core/repository/query.service';
import { UserSettings, UserSettingsDocument } from '../schemas/user-settings.schema';

@Injectable()
export class UserSettingsRepository extends BaseRepository<UserSettingsDocument> {
  constructor(
    @InjectModel(UserSettings.name) private readonly _settingsModel: Model<UserSettingsDocument>,
    queryService: QueryService,
  ) {
    super(_settingsModel, queryService);
  }

  async findByUserId(userId: string | Types.ObjectId): Promise<UserSettingsDocument | null> {
    return this._settingsModel.findOne({ userId, deletedAt: null }).exec();
  }
}
