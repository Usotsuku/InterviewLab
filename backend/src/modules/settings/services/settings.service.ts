import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { UserSettingsRepository } from '../repositories/user-settings.repository';
import { UpdateSettingsDto } from '../dto/update-settings.dto';

export interface SettingsResponse {
  userId: string;
  language: string;
  notificationsEnabled: boolean;
  interviewReminders: boolean;
}

@Injectable()
export class SettingsService {
  private readonly _logger = new Logger(SettingsService.name);

  constructor(private readonly _settingsRepo: UserSettingsRepository) {}

  async getSettings(userId: string): Promise<SettingsResponse> {
    let doc = await this._settingsRepo.findByUserId(userId);

    if (!doc) {
      doc = await this._settingsRepo.upsertByUserId(userId);
    }

    const typed = doc as unknown as {
      userId: Types.ObjectId;
      language: string;
      notificationsEnabled: boolean;
      interviewReminders: boolean;
    };

    return {
      userId: typed.userId.toString(),
      language: typed.language,
      notificationsEnabled: typed.notificationsEnabled,
      interviewReminders: typed.interviewReminders,
    };
  }

  async updateSettings(
    userId: string,
    data: UpdateSettingsDto,
  ): Promise<SettingsResponse> {
    let doc = await this._settingsRepo.findByUserId(userId);

    if (!doc) {
      doc = await this._settingsRepo.upsertByUserId(userId);
    }

    const docId = (doc as unknown as { _id: Types.ObjectId })._id.toString();

    const updateData: Record<string, unknown> = {};
    if (data.language !== undefined) updateData.language = data.language;
    if (data.notificationsEnabled !== undefined) updateData.notificationsEnabled = data.notificationsEnabled;
    if (data.interviewReminders !== undefined) updateData.interviewReminders = data.interviewReminders;

    if (Object.keys(updateData).length > 0) {
      await this._settingsRepo.updateById(docId, updateData);
      this._logger.log(`[updateSettings] Settings updated for user: ${userId}`);
    }

    return this.getSettings(userId);
  }
}
