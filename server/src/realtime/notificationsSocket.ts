import type { Server as HttpServer } from 'node:http';

import { Server, type Socket } from 'socket.io';

import type { Types } from 'mongoose';

import { getEnv } from '../config/env.js';
import { ACCESS_TOKEN_COOKIE } from '../lib/authCookies.js';
import { verifyAccessToken } from '../lib/jwt.js';
import type { NotificationPublic } from '../modules/notifications/notifications.service.js';
import { User } from '../modules/users/user.model.js';

let io: Server | null = null;

function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key !== name) continue;
    const value = part.slice(idx + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return undefined;
}

function extractAccessToken(socket: Socket): string | undefined {
  const auth = socket.handshake.auth as { token?: unknown } | undefined;
  if (auth && typeof auth.token === 'string' && auth.token.length > 0) {
    return auth.token;
  }
  const bearer = socket.handshake.headers.authorization;
  if (typeof bearer === 'string' && bearer.startsWith('Bearer ')) {
    const t = bearer.slice('Bearer '.length).trim();
    if (t.length > 0) return t;
  }
  const rawCookie = socket.request.headers.cookie;
  return readCookie(rawCookie, ACCESS_TOKEN_COOKIE);
}

export function attachNotificationsSocket(httpServer: HttpServer): Server {
  const env = getEnv();
  const origins = env.CLIENT_ORIGIN.split(',').map((o) => o.trim());

  const server = new Server(httpServer, {
    path: '/socket.io/',
    cors: {
      origin: origins,
      credentials: true,
    },
  });

  server.use(async (socket, next) => {
    try {
      const token = extractAccessToken(socket);
      if (!token) {
        next(new Error('Unauthorized'));
        return;
      }
      const payload = verifyAccessToken(token);
      const user = await User.findOne({
        _id: payload.sub,
        isDeleted: false,
        isActive: true,
      })
        .select('_id')
        .lean();
      if (!user) {
        next(new Error('Unauthorized'));
        return;
      }
      socket.data.userId = String((user as { _id: Types.ObjectId })._id);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  server.on('connection', (socket) => {
    const uid = socket.data.userId as string | undefined;
    if (uid) {
      socket.join(`user:${uid}`);
    }
  });

  io = server;
  return server;
}

export function broadcastNotificationCreated(
  userId: string,
  notification: NotificationPublic,
  unreadCount: number,
): void {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification:new', { notification, unreadCount });
}
