import type { Request, Response } from 'express';

import { getEnv } from '../config/env.js';
import { ttlToMs } from './ttl.js';

export const ACCESS_TOKEN_COOKIE = 'gw_access_token';
export const REFRESH_TOKEN_COOKIE = 'gw_refresh_token';

function cookieBase() {
  const env = getEnv();
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.NODE_ENV === 'production',
    path: '/',
  };
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  const env = getEnv();
  const base = cookieBase();
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...base,
    maxAge: ttlToMs(env.JWT_ACCESS_EXPIRES_IN),
  });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...base,
    maxAge: ttlToMs(env.JWT_REFRESH_EXPIRES_IN),
  });
}

export function clearAuthCookies(res: Response): void {
  const base = cookieBase();
  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: base.path });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: base.path });
}

export function getAccessTokenFromRequest(req: Request): string | undefined {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const value = auth.slice('Bearer '.length).trim();
    return value.length > 0 ? value : undefined;
  }
  const fromCookie = req.cookies?.[ACCESS_TOKEN_COOKIE];
  return typeof fromCookie === 'string' && fromCookie.length > 0
    ? fromCookie
    : undefined;
}

export function getRefreshTokenFromRequest(req: Request): string | undefined {
  const fromCookie = req.cookies?.[REFRESH_TOKEN_COOKIE];
  return typeof fromCookie === 'string' && fromCookie.length > 0
    ? fromCookie
    : undefined;
}
