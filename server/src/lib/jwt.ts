import jwt, { type SignOptions } from 'jsonwebtoken';

import { getEnv } from '../config/env.js';
import type { UserRole } from '../modules/users/user.model.js';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  typ: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  typ: 'refresh';
  jti: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function signAccessToken(userId: string, role: UserRole): string {
  const env = getEnv();
  const payload: AccessTokenPayload = { sub: userId, role, typ: 'access' };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

export function signRefreshToken(userId: string, jti: string): string {
  const env = getEnv();
  const payload: RefreshTokenPayload = { sub: userId, typ: 'refresh', jti };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const env = getEnv();
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (!isRecord(decoded) || decoded.typ !== 'access') {
    throw new Error('Invalid access token');
  }
  const { sub, role } = decoded;
  if (typeof sub !== 'string' || typeof role !== 'string') {
    throw new Error('Invalid access token');
  }
  return { sub, role: role as UserRole, typ: 'access' };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const env = getEnv();
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (!isRecord(decoded) || decoded.typ !== 'refresh') {
    throw new Error('Invalid refresh token');
  }
  const { sub, jti } = decoded;
  if (typeof sub !== 'string' || typeof jti !== 'string') {
    throw new Error('Invalid refresh token');
  }
  return { sub, jti, typ: 'refresh' };
}
