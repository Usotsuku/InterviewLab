import { Injectable } from '@nestjs/common';

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
  async getUserNotifications(userId: string): Promise<NotificationResponse[]> {
    // TODO: implement database fetch
    return [
      { id: 'n1', userId, type: 'CV_ANALYZED', title: 'CV Analyzed', body: 'Your candidate profile is ready.', isRead: false },
    ];
  }

  async markAsRead(userId: string, notificationId: string): Promise<MarkAsReadResponse> {
    // TODO: implement update state save
    return { notificationId, userId, isRead: true };
  }
}
