import type { NextFunction, Request, Response } from 'express';
import type { Types } from 'mongoose';

import { getEnv } from '../config/env.js';
import { getRefreshTokenFromRequest } from '../lib/authCookies.js';
import type { HttpError } from './errorHandler.js';
import { hashToken } from '../lib/tokenHash.js';
import { ttlToMs } from '../lib/ttl.js';
import { verifyRefreshToken } from '../lib/jwt.js';
import type { UserRole } from '../modules/users/user.model.js';
import { User } from '../modules/users/user.model.js';

type LeanAuthUser = {
  _id: Types.ObjectId;
  email: string;
  role: UserRole;
} | null;

export async function persistRefreshToken(
  userId: string,
  rawToken: string,
  device: string,
): Promise<void> {
  const env = getEnv();
  const expiresAt = new Date(Date.now() + ttlToMs(env.JWT_REFRESH_EXPIRES_IN));
  await User.updateOne(
    { _id: userId },
    {
      $push: {
        refreshTokens: {
          tokenHash: hashToken(rawToken),
          device,
          createdAt: new Date(),
          expiresAt,
        },
      },
    },
  );
}

export async function revokeRefreshTokenByRaw(
  userId: string,
  rawToken: string,
): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await User.updateOne(
    { _id: userId },
    { $pull: { refreshTokens: { tokenHash } } },
  );
}

/** Removes the old refresh (if present) and stores the new hash — rotation helper for auth routes. */
export async function rotateRefreshToken(
  userId: string,
  oldRawToken: string | undefined,
  newRawToken: string,
  device: string,
): Promise<void> {
  if (oldRawToken) {
    await revokeRefreshTokenByRaw(userId, oldRawToken);
  }
  await persistRefreshToken(userId, newRawToken, device);
}

/**
 * Validates refresh JWT + persisted hash, then attaches `req.user`.
 * Intended for `/api/auth/refresh` (TASK-008).
 */
export async function refreshTokenMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const raw = getRefreshTokenFromRequest(req);
    if (!raw) {
      next(Object.assign(new Error('Unauthorized'), { status: 401 }) as HttpError);
      return;
    }
    const payload = verifyRefreshToken(raw);
    const tokenHash = hashToken(raw);
    const user = (await User.findOne({
      _id: payload.sub,
      isDeleted: false,
      isActive: true,
      refreshTokens: { $elemMatch: { tokenHash, expiresAt: { $gt: new Date() } } },
    })
      .select('_id email role')
      .lean()) as LeanAuthUser;

    if (!user) {
      next(Object.assign(new Error('Unauthorized'), { status: 401 }) as HttpError);
      return;
    }

    req.user = {
      id: String(user._id),
      email: user.email,
      role: user.role,
    };
    next();
  } catch {
    next(Object.assign(new Error('Unauthorized'), { status: 401 }) as HttpError);
  }
}
