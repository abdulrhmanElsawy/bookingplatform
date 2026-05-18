import type { Request, Response } from 'express';

import { tRes } from '../../lib/i18nHttp.js';
import { httpError } from '../../middleware/errorHandler.js';
import * as notificationsService from './notifications.service.js';

function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>,
): (req: Request, res: Response, next: (err: unknown) => void) => void {
  return (req, res, next) => {
    void fn(req, res).catch(next);
  };
}

function parsePageLimit(req: Request): { page: number; limit: number } {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limitRaw = parseInt(String(req.query.limit ?? '20'), 10) || 20;
  const limit = Math.min(50, Math.max(1, limitRaw));
  return { page, limit };
}

export const getUnreadCount = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const unreadCount = await notificationsService.countUnread(req.user.id);
  res.json({ unreadCount });
});

export const listNotifications = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const { page, limit } = parsePageLimit(req);
  const result = await notificationsService.listNotifications(req.user.id, page, limit);
  res.json(result);
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
  const updated = await notificationsService.markAsRead(req.user.id, id);
  if (!updated) {
    throw httpError(404, tRes(res, 'notFound'));
  }
  res.json({ notification: updated });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const updatedCount = await notificationsService.markAllRead(req.user.id);
  res.json({ updatedCount });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
  const ok = await notificationsService.deleteNotification(req.user.id, id);
  if (!ok) {
    throw httpError(404, tRes(res, 'notFound'));
  }
  res.status(204).send();
});
