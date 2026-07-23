import type { z } from 'zod';
import {
  LoginSchema,
  PasswordResetConfirmSchema,
  PasswordResetRequestSchema,
  RegisterSchema,
} from '@growth-world/shared';

import { getApiUrl } from '../../../config/publicEnv';
import i18n from '../../../i18n';

export type RegisterBody = z.infer<typeof RegisterSchema>;
export type LoginBody = z.infer<typeof LoginSchema>;
export type PasswordResetRequestBody = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetConfirmBody = z.infer<typeof PasswordResetConfirmSchema>;

export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

function acceptLanguageHeader(): string {
  const lng = i18n.language?.toLowerCase() ?? 'ar';
  return lng.startsWith('en') ? 'en' : 'ar';
}

function jsonHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Accept-Language': acceptLanguageHeader(),
  };
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {};
  }
}

function errorCodeFromBody(data: unknown): string | undefined {
  if (
    data &&
    typeof data === 'object' &&
    'error' in data &&
    data.error &&
    typeof data.error === 'object' &&
    'code' in data.error &&
    typeof (data.error as { code: unknown }).code === 'string'
  ) {
    return (data.error as { code: string }).code;
  }
  return undefined;
}

function messageFromBody(body: unknown): string {
  if (
    body &&
    typeof body === 'object' &&
    'error' in body &&
    body.error &&
    typeof body.error === 'object' &&
    'message' in body.error &&
    typeof (body.error as { message: unknown }).message === 'string'
  ) {
    return (body.error as { message: string }).message;
  }
  return '';
}

export async function postRegister(
  body: RegisterBody,
): Promise<{ message: string; user: Record<string, unknown> }> {
  const url = `${getApiUrl()}/api/auth/register`;
  const res = await fetch(url, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = (await parseJson(res)) as {
    message?: string;
    user?: Record<string, unknown>;
  };
  if (!res.ok) {
    throw new AuthApiError(
      messageFromBody(data) || 'error',
      res.status,
      errorCodeFromBody(data),
    );
  }
  return {
    message: data.message ?? '',
    user: data.user ?? {},
  };
}

export async function postVerifyEmail(body: {
  email: string;
  code: string;
}): Promise<{ message: string; user: Record<string, unknown> }> {
  const url = `${getApiUrl()}/api/auth/verify-email`;
  const res = await fetch(url, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = (await parseJson(res)) as {
    message?: string;
    user?: Record<string, unknown>;
  };
  if (!res.ok) {
    throw new AuthApiError(messageFromBody(data) || 'error', res.status, errorCodeFromBody(data));
  }
  return {
    message: data.message ?? '',
    user: data.user ?? {},
  };
}

export async function postResendVerification(email: string): Promise<void> {
  const url = `${getApiUrl()}/api/auth/resend-verification`;
  const res = await fetch(url, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new AuthApiError(messageFromBody(data) || 'error', res.status);
  }
}

export async function patchAccountType(role: 'user' | 'gym_owner'): Promise<{
  message: string;
  user: Record<string, unknown>;
}> {
  const url = `${getApiUrl()}/api/auth/account-type`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify({ role }),
  });
  const data = (await parseJson(res)) as {
    message?: string;
    user?: Record<string, unknown>;
  };
  if (!res.ok) {
    throw new AuthApiError(messageFromBody(data) || 'error', res.status);
  }
  return {
    message: data.message ?? '',
    user: data.user ?? {},
  };
}

export async function postLogin(
  body: LoginBody,
): Promise<{ message: string; user: Record<string, unknown> }> {
  const url = `${getApiUrl()}/api/auth/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = (await parseJson(res)) as {
    message?: string;
    user?: Record<string, unknown>;
  };
  if (!res.ok) {
    throw new AuthApiError(
      messageFromBody(data) || 'error',
      res.status,
      errorCodeFromBody(data),
    );
  }
  return {
    message: data.message ?? '',
    user: data.user ?? {},
  };
}

export async function postLogout(): Promise<void> {
  const url = `${getApiUrl()}/api/auth/logout`;
  const res = await fetch(url, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new AuthApiError(messageFromBody(data) || 'error', res.status);
  }
}

export async function getMe(): Promise<Record<string, unknown> | null> {
  const url = `${getApiUrl()}/api/auth/me`;
  const res = await fetch(url, {
    method: 'GET',
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const data = (await parseJson(res)) as { user?: Record<string, unknown> };
  if (!res.ok) {
    return null;
  }
  return data.user ?? null;
}

export async function postForgotPassword(
  body: PasswordResetRequestBody,
): Promise<void> {
  const url = `${getApiUrl()}/api/auth/forgot-password`;
  const res = await fetch(url, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new AuthApiError(messageFromBody(data) || 'error', res.status);
  }
}

export async function postResendPasswordReset(
  body: PasswordResetRequestBody,
): Promise<void> {
  const url = `${getApiUrl()}/api/auth/resend-password-reset`;
  const res = await fetch(url, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new AuthApiError(messageFromBody(data) || 'error', res.status, errorCodeFromBody(data));
  }
}

export async function postResetPassword(
  body: PasswordResetConfirmBody,
): Promise<{ message: string }> {
  const url = `${getApiUrl()}/api/auth/reset-password`;
  const res = await fetch(url, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = (await parseJson(res)) as { message?: string };
  if (!res.ok) {
    throw new AuthApiError(messageFromBody(data) || 'error', res.status);
  }
  return { message: data.message ?? '' };
}

export type PatchProfileBody = {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export async function patchUserProfile(
  body: PatchProfileBody,
): Promise<Record<string, unknown>> {
  const url = `${getApiUrl()}/api/users/me`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = (await parseJson(res)) as { user?: Record<string, unknown> };
  if (!res.ok) {
    throw new AuthApiError(messageFromBody(data) || 'error', res.status);
  }
  if (!data.user) {
    throw new AuthApiError('Invalid response', res.status);
  }
  return data.user;
}

export type PatchPreferencesBody = {
  language?: 'ar' | 'en';
  currency?: string;
  notifications?: { email?: boolean; inApp?: boolean };
};

export async function patchUserPreferences(
  body: PatchPreferencesBody,
): Promise<Record<string, unknown>> {
  const url = `${getApiUrl()}/api/users/me/preferences`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = (await parseJson(res)) as { user?: Record<string, unknown> };
  if (!res.ok) {
    throw new AuthApiError(messageFromBody(data) || 'error', res.status);
  }
  if (!data.user) {
    throw new AuthApiError('Invalid response', res.status);
  }
  return data.user;
}

export async function postChangePassword(body: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}): Promise<{ message: string }> {
  const url = `${getApiUrl()}/api/auth/change-password`;
  const res = await fetch(url, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = (await parseJson(res)) as { message?: string };
  if (!res.ok) {
    throw new AuthApiError(messageFromBody(data) || 'error', res.status);
  }
  return { message: data.message ?? '' };
}
