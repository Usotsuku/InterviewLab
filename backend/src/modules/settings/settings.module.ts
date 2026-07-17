import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSettings, UserSettingsSchema } from './schemas/user-settings.schema';
import { UserSettingsRepository } from './repositories/user-settings.repository';
import { SettingsController } from './controllers/settings.controller';
import { SettingsService } from './services/settings.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserSettings.name, schema: UserSettingsSchema }]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService, UserSettingsRepository],
  exports: [SettingsService, UserSettingsRepository],
})
export class SettingsModule {}
