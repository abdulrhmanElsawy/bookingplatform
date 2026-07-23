import type { Request, Response } from 'express';
import type { z } from 'zod';
import {
  LoginSchema,
  OtpVerifySchema,
  PasswordResetConfirmSchema,
  PasswordResetRequestSchema,
  RegisterSchema,
} from '@growth-world/shared';

import {
  clearAuthCookies,
  getRefreshTokenFromRequest,
  setAuthCookies,
} from '../../lib/authCookies.js';
import { signAccessToken } from '../../lib/jwt.js';
import { tRes } from '../../lib/i18nHttp.js';
import {
  changePassword,
  confirmPasswordReset,
  getUserProfile,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
  requestPasswordReset,
  resendVerificationEmail,
  updateAccountType,
  updateUserPreferences,
  updateUserProfile,
  verifyEmailAndSession,
} from './auth.service.js';
import {
  AccountTypeBodySchema,
  ChangePasswordBodySchema,
  PatchPreferencesBodySchema,
  PatchProfileBodySchema,
} from './auth.schemas.js';

function deviceFromReq(req: Request): string {
  const ua = req.get('user-agent');
  return ua && ua.length > 0 ? ua.slice(0, 200) : 'unknown';
}

export async function register(req: Request, res: Response): Promise<void> {
  const input = req.body as z.infer<typeof RegisterSchema>;
  const { user } = await registerUser(input, req.lang);
  res.status(201).json({
    message: tRes(res, 'authRegisterSuccess'),
    user,
  });
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const input = req.body as z.infer<typeof OtpVerifySchema>;
  const { user, accessToken, refreshToken } = await verifyEmailAndSession(
    input,
    req.lang,
    deviceFromReq(req),
  );
  setAuthCookies(res, accessToken, refreshToken);
  res.json({
    message: tRes(res, 'authVerifySuccess'),
    user,
  });
}

export async function resendVerification(
  req: Request,
  res: Response,
): Promise<void> {
  const email = (req.body as { email: string }).email;
  await resendVerificationEmail(email, req.lang);
  res.json({ message: tRes(res, 'authResendSuccess') });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = req.body as z.infer<typeof LoginSchema>;
  const { user, accessToken, refreshToken } = await loginUser(
    input,
    req.lang,
    deviceFromReq(req),
  );
  setAuthCookies(res, accessToken, refreshToken);
  res.json({
    message: tRes(res, 'authLoginSuccess'),
    user,
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.user) {
    const raw = getRefreshTokenFromRequest(req);
    await logoutUser(req.user.id, raw);
  }
  clearAuthCookies(res);
  res.json({ message: tRes(res, 'authLogoutSuccess') });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: { message: tRes(res, 'unauthorized') } });
    return;
  }
  const oldRaw = getRefreshTokenFromRequest(req);
  if (!oldRaw) {
    res.status(401).json({ error: { message: tRes(res, 'unauthorized') } });
    return;
  }
  const { accessToken, refreshToken } = await refreshSession(
    req.user.id,
    req.user.role,
    oldRaw,
    deviceFromReq(req),
  );
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ message: tRes(res, 'authSessionRefreshed') });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const input = req.body as z.infer<typeof PasswordResetRequestSchema>;
  await requestPasswordReset(input, req.lang);
  res.json({ message: tRes(res, 'authPasswordResetSent') });
}

export async function resendPasswordReset(
  req: Request,
  res: Response,
): Promise<void> {
  const input = req.body as z.infer<typeof PasswordResetRequestSchema>;
  await requestPasswordReset(input, req.lang);
  res.json({ message: tRes(res, 'authPasswordResetSent') });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const input = req.body as z.infer<typeof PasswordResetConfirmSchema>;
  await confirmPasswordReset(input, req.lang);
  clearAuthCookies(res);
  res.json({ message: tRes(res, 'authPasswordResetSuccess') });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: { message: tRes(res, 'unauthorized') } });
    return;
  }
  const user = await getUserProfile(req.user.id, req.lang);
  res.json({ user });
}

export async function changePasswordHandler(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: { message: tRes(res, 'unauthorized') } });
    return;
  }
  const input = req.body as z.infer<typeof ChangePasswordBodySchema>;
  await changePassword(
    req.user.id,
    input.currentPassword,
    input.newPassword,
    req.lang,
  );
  clearAuthCookies(res);
  res.json({ message: tRes(res, 'authChangePasswordSuccess') });
}

export async function patchAccountType(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: { message: tRes(res, 'unauthorized') } });
    return;
  }
  const input = req.body as z.infer<typeof AccountTypeBodySchema>;
  const user = await updateAccountType(req.user.id, input.role, req.lang);
  const accessToken = signAccessToken(req.user.id, input.role);
  const refresh = getRefreshTokenFromRequest(req);
  if (refresh) {
    setAuthCookies(res, accessToken, refresh);
  }
  res.json({
    message: tRes(res, 'authAccountTypeUpdated'),
    user,
  });
}

export async function patchMyProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: { message: tRes(res, 'unauthorized') } });
    return;
  }
  const body = req.body as z.infer<typeof PatchProfileBodySchema>;
  const user = await updateUserProfile(req.user.id, body, req.lang);
  res.json({ user });
}

export async function patchMyPreferences(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: { message: tRes(res, 'unauthorized') } });
    return;
  }
  const body = req.body as z.infer<typeof PatchPreferencesBodySchema>;
  const user = await updateUserPreferences(req.user.id, body, req.lang);
  res.json({ user });
}
