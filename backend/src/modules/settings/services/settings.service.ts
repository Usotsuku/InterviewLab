import { Injectable } from '@nestjs/common';
import { UpdateSettingsDto } from '../dto/update-settings.dto';

export interface SettingsResponse {
  userId: string;
  language: string;
  notificationsEnabled: boolean;
  interviewReminders: boolean;
}

@Injectable()
export class SettingsService {
  async getSettings(userId: string): Promise<SettingsResponse> {
    // TODO: implement database fetch
    return {
      userId,
      language: 'en',
      notificationsEnabled: true,
      interviewReminders: true,
    };
  }

  async updateSettings(
    userId: string,
    _data: UpdateSettingsDto,
  ): Promise<{ userId: string; updated: true }> {
    // TODO: implement settings save
    return { userId, updated: true };
  }
}
