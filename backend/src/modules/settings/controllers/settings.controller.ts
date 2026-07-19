import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CheckAuth } from '@core/decorators/check-auth.decorator';
import { CurrentUser, JwtPayload } from '@core/decorators/current-user.decorator';
import { SettingsService } from '../services/settings.service';
import { UpdateSettingsDto } from '../dto/update-settings.dto';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly _settingsService: SettingsService) {}

  @Get()
  @CheckAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve active user settings.' })
  async getSettings(@CurrentUser() user: JwtPayload) {
    return this._settingsService.getSettings(user.sub);
  }

  @Patch()
  @CheckAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user settings.' })
  async updateSettings(@CurrentUser() user: JwtPayload, @Body() body: UpdateSettingsDto) {
    return this._settingsService.updateSettings(user.sub, body);
  }
}
