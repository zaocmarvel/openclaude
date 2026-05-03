import prisma from '../db';
import { NotificationType } from '@prisma/client';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  broId?: string;
  triggeredBy?: string;
  actionUrl?: string;
}

/**
 * Create a new notification
 */
export async function createNotification(input: CreateNotificationInput) {
  const { userId, type, title, message, broId, triggeredBy, actionUrl } = input;

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      broId,
      triggeredBy,
      actionUrl,
    },
  });

  // Emit to socket if connected (handled by socket handler)
  // This would typically emit to a room for this userId

  return notification;
}

/**
 * Create batch notifications for multiple users
 */
export async function createBatchNotifications(
  userIds: string[],
  input: Omit<CreateNotificationInput, 'userId'>
) {
  const notifications = await Promise.all(
    userIds.map(userId =>
      createNotification({ ...input, userId })
    )
  );

  return notifications.filter(Boolean);
}

/**
 * Mark notifications as read
 */
export async function markAsRead(
  userId: string,
  notificationIds?: string[],
  markAllRead = false
) {
  if (markAllRead) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  if (notificationIds && notificationIds.length > 0) {
    return prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  return null;
}

/**
 * Delete old read notifications (cleanup job)
 */
export async function cleanupOldNotifications(daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.notification.deleteMany({
    where: {
      isRead: true,
      readAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}
