import mongoose from 'mongoose';

import { broadcastNotificationCreated } from '../../realtime/notificationsSocket.js';
import { Notification, type NotificationType } from './notification.model.js';

export type NotificationPublic = {
  id: string;
  type: string;
  title: { ar: string; en: string };
  body: { ar: string; en: string };
  read: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export function notificationToPublic(doc: unknown): NotificationPublic {
  const o = doc as Record<string, unknown>;
  const title = o.title as { ar: string; en: string };
  const body = o.body as { ar: string; en: string };
  const createdAt = o.createdAt instanceof Date ? o.createdAt : new Date();
  const meta = o.metadata;
  return {
    id: String(o._id),
    type: String(o.type),
    title,
    body,
    read: Boolean(o.read),
    metadata:
      meta && typeof meta === 'object' && !Array.isArray(meta)
        ? (meta as Record<string, unknown>)
        : {},
    createdAt: createdAt.toISOString(),
  };
}

export async function listNotifications(
  userId: string,
  page: number,
  limit: number,
): Promise<{
  notifications: NotificationPublic[];
  total: number;
  unreadCount: number;
  page: number;
  totalPages: number;
}> {
  const uid = new mongoose.Types.ObjectId(userId);
  const filter = { userId: uid };
  const skip = (page - 1) * limit;
  const [rows, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, read: false }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    notifications: rows.map((r) => notificationToPublic(r)),
    total,
    unreadCount,
    page,
    totalPages,
  };
}

export async function countUnread(userId: string): Promise<number> {
  return Notification.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    read: false,
  });
}

export async function markAsRead(
  userId: string,
  notificationId: string,
): Promise<NotificationPublic | null> {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return null;
  }
  const doc = await Notification.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(notificationId),
      userId: new mongoose.Types.ObjectId(userId),
    },
    { $set: { read: true } },
    { new: true },
  ).lean();
  if (!doc) return null;
  return notificationToPublic(doc);
}

export async function markAllRead(userId: string): Promise<number> {
  const res = await Notification.updateMany(
    { userId: new mongoose.Types.ObjectId(userId), read: false },
    { $set: { read: true } },
  );
  return typeof res.modifiedCount === 'number' ? res.modifiedCount : 0;
}

export async function deleteNotification(
  userId: string,
  notificationId: string,
): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return false;
  }
  const res = await Notification.deleteOne({
    _id: new mongoose.Types.ObjectId(notificationId),
    userId: new mongoose.Types.ObjectId(userId),
  });
  return res.deletedCount === 1;
}

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: { ar: string; en: string };
  body: { ar: string; en: string };
  metadata?: Record<string, unknown>;
}): Promise<NotificationPublic> {
  const doc = await Notification.create({
    userId: new mongoose.Types.ObjectId(input.userId),
    type: input.type,
    title: input.title,
    body: input.body,
    read: false,
    metadata: input.metadata ?? {},
  });
  const lean = doc.toObject();
  const created = notificationToPublic(lean);
  const unreadCount = await countUnread(input.userId);
  broadcastNotificationCreated(input.userId, created, unreadCount);
  return created;
}

/** Creates the same system announcement for many users (insertMany + per-user socket + unread count). */
export async function bulkCreateSystemAnnouncements(input: {
  userIds: string[];
  title: { ar: string; en: string };
  body: { ar: string; en: string };
}): Promise<number> {
  if (input.userIds.length === 0) return 0;
  const docs = input.userIds.map((userId) => ({
    userId: new mongoose.Types.ObjectId(userId),
    type: 'system_announcement' as const,
    title: input.title,
    body: input.body,
    read: false,
    metadata: {} as Record<string, unknown>,
  }));
  const inserted = await Notification.insertMany(docs);
  for (const doc of inserted) {
    const uid = String(doc.userId);
    const pub = notificationToPublic(doc.toObject());
    const unreadCount = await countUnread(uid);
    broadcastNotificationCreated(uid, pub, unreadCount);
  }
  return inserted.length;
}
