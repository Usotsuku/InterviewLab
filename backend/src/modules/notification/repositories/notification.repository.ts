import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@core/repository/base.repository';
import { QueryService } from '@core/repository/query.service';
import { Notification, NotificationDocument } from '../schemas/notification.schema';

@Injectable()
export class NotificationRepository extends BaseRepository<NotificationDocument> {
  constructor(
    @InjectModel(Notification.name) private readonly _notifModel: Model<NotificationDocument>,
    queryService: QueryService,
  ) {
    super(_notifModel, queryService);
  }

  async findByUserId(userId: string | Types.ObjectId): Promise<NotificationDocument[]> {
    return this._notifModel
      .find({ userId, deletedAt: null })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findUnreadByUserId(userId: string | Types.ObjectId): Promise<NotificationDocument[]> {
    return this._notifModel
      .find({ userId, isRead: false, deletedAt: null })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await this._notifModel
      .updateOne(
        { _id: notificationId, userId: new Types.ObjectId(userId) },
        { isRead: true },
      )
      .exec();
    return result.modifiedCount > 0;
  }
}
