import { Injectable, Logger } from '@nestjs/common';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationType } from '@shared/enums/domain.enums';
import { AppException } from '@core/exceptions/app.exception';
import { CORE_ERRORS } from '@core/exceptions/core.errors';
import { Types } from 'mongoose';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
}

interface NotificationResponse {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
}

interface MarkAsReadResponse {
  notificationId: string;
  userId: string;
  isRead: true;
}

@Injectable()
export class NotificationService {
  private readonly _logger = new Logger(NotificationService.name);

  constructor(private readonly _notificationRepo: NotificationRepository) {}

  async create(input: CreateNotificationInput): Promise<NotificationResponse> {
    const doc = await this._notificationRepo.create({
      userId: new Types.ObjectId(input.userId),
      type: input.type,
      title: input.title,
      body: input.body,
      isRead: false,
    });

    this._logger.log(
      `[create] Notification created for user: ${input.userId}, type: ${input.type}`,
    );

    const typed = doc as unknown as {
      _id: Types.ObjectId;
      userId: Types.ObjectId;
      type: string;
      title: string;
      body: string;
      isRead: boolean;
    };

    return {
      id: typed._id.toString(),
      userId: typed.userId.toString(),
      type: typed.type,
      title: typed.title,
      body: typed.body,
      isRead: typed.isRead,
    };
  }

  async notifyCvAnalysisComplete(userId: string): Promise<NotificationResponse> {
    return this.create({
      userId,
      type: NotificationType.CV_ANALYZED,
      title: 'CV Analysis Complete',
      body: 'Your CV has been analyzed and your candidate profile has been updated.',
    });
  }

  async getUserNotifications(userId: string): Promise<NotificationResponse[]> {
    const docs = await this._notificationRepo.findByUserId(userId);

    return docs.map((doc) => {
      const typed = doc as unknown as {
        _id: Types.ObjectId;
        userId: Types.ObjectId;
        type: string;
        title: string;
        body: string;
        isRead: boolean;
      };
      return {
        id: typed._id.toString(),
        userId: typed.userId.toString(),
        type: typed.type,
        title: typed.title,
        body: typed.body,
        isRead: typed.isRead,
      };
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<MarkAsReadResponse> {
    const updated = await this._notificationRepo.markAsRead(notificationId, userId);
    if (!updated) {
      AppException.throw(CORE_ERRORS.NOT_FOUND);
    }
    return { notificationId, userId, isRead: true };
  }
}
