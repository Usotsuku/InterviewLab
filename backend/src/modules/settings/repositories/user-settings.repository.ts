import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@core/repository/base.repository';
import { UserSettings, UserSettingsDocument } from '../schemas/user-settings.schema';

@Injectable()
export class UserSettingsRepository extends BaseRepository<UserSettingsDocument> {
  constructor(@InjectModel(UserSettings.name) private readonly _settingsModel: Model<UserSettingsDocument>) {
    super(_settingsModel);
  }

  async findByUserId(userId: string | Types.ObjectId): Promise<UserSettingsDocument | null> {
    return this._settingsModel.findOne({ userId, deletedAt: { $exists: false } }).exec();
  }
}
