import { Controller, Get, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CheckAuth } from '@core/decorators/check-auth.decorator';
import { CurrentUser, JwtPayload } from '@core/decorators/current-user.decorator';
import { NotificationService } from '../services/notification.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly _notificationService: NotificationService) {}

  @Get()
  @CheckAuth()
  @ApiOperation({ summary: 'Retrieve notifications for active user.' })
  async getNotifications(@CurrentUser() user: JwtPayload) {
    return this._notificationService.getUserNotifications(user.sub);
  }

  @Patch(':id/read')
  @CheckAuth()
  @ApiOperation({ summary: 'Mark a notification as read.' })
  async markAsRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this._notificationService.markAsRead(user.sub, id);
  }
}
