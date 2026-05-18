import { randomUUID } from 'node:crypto';

import type { z } from 'zod';
import {
  LoginSchema,
  OtpVerifySchema,
  PasswordResetConfirmSchema,
  PasswordResetRequestSchema,
  RegisterSchema,
} from '@growth-world/shared';

import { signAccessToken, signRefreshToken } from '../../lib/jwt.js';
import { translate, type AppLang } from '../../lib/i18n.js';
import { httpError } from '../../middleware/errorHandler.js';
import {
  persistRefreshToken,
  revokeRefreshTokenByRaw,
  rotateRefreshToken,
} from '../../middleware/refreshToken.js';
import {
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from '../email/email.service.js';
import type { EmailUser } from '../email/email.types.js';
import type { UserRole } from '../users/user.model.js';
import { User } from '../users/user.model.js';
import {
  generateSixDigitOtp,
  hashOtp,
  hashPassword,
  verifyOtp,
  verifyPassword,
} from './crypto.js';
import {
  PatchPreferencesBodySchema,
  PatchProfileBodySchema,
} from './auth.schemas.js';
import { toPublicUser, type PublicUser } from './user.dto.js';

const OTP_TTL_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

type RegisterInput = z.infer<typeof RegisterSchema>;
type LoginInput = z.infer<typeof LoginSchema>;
type OtpVerifyInput = z.infer<typeof OtpVerifySchema>;
type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
type PasswordResetConfirmInput = z.infer<typeof PasswordResetConfirmSchema>;

function toEmailUser(user: {
  email: string;
  firstName: string;
  preferences: { language: 'ar' | 'en' };
}): EmailUser {
  return {
    email: user.email,
    firstName: user.firstName,
    preferences: { language: user.preferences.language },
  };
}

export async function registerUser(
  input: RegisterInput,
  lang: AppLang,
): Promise<{ user: PublicUser }> {
  const email = input.email.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    throw httpError(409, translate(lang, 'emailExists'));
  }

  const passwordHash = await hashPassword(input.password);
  const otp = generateSixDigitOtp();
  const otpHash = await hashOtp(otp);

  const user = await User.create({
    email,
    password: passwordHash,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: input.phone?.trim(),
    isEmailVerified: false,
    emailVerificationCode: otpHash,
    emailVerificationExpiry: new Date(Date.now() + OTP_TTL_MS),
    preferences: {
      language: lang,
      currency: 'SAR',
      notifications: { email: true, inApp: true },
    },
  });

  await sendVerificationEmail(toEmailUser(user), otp);

  return { user: toPublicUser(user) };
}

export async function verifyEmailAndSession(
  input: OtpVerifyInput,
  lang: AppLang,
  device: string,
): Promise<{ user: PublicUser; accessToken: string; refreshToken: string }> {
  const email = input.email.toLowerCase();
  const user = await User.findOne({ email, isDeleted: false });
  if (!user) {
    throw httpError(400, translate(lang, 'otpInvalid'));
  }
  if (user.isEmailVerified) {
    throw httpError(400, translate(lang, 'emailAlreadyVerified'));
  }
  if (
    !user.emailVerificationExpiry ||
    user.emailVerificationExpiry.getTime() < Date.now()
  ) {
    throw httpError(400, translate(lang, 'otpExpired'));
  }
  const ok = await verifyOtp(input.code, user.emailVerificationCode);
  if (!ok) {
    throw httpError(400, translate(lang, 'otpInvalid'));
  }

  user.isEmailVerified = true;
  user.emailVerificationCode = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save();

  await sendWelcomeEmail(toEmailUser(user));

  const accessToken = signAccessToken(String(user._id), user.role);
  const refreshToken = signRefreshToken(String(user._id), randomUUID());
  await persistRefreshToken(String(user._id), refreshToken, device);

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken,
  };
}

/** Returns false when user is missing (anti-enumeration). Throws if already verified. */
export async function resendVerificationEmail(
  emailRaw: string,
  lang: AppLang,
): Promise<boolean> {
  const email = emailRaw.toLowerCase();
  const user = await User.findOne({ email, isDeleted: false, isActive: true });
  if (!user) {
    return false;
  }
  if (user.isEmailVerified) {
    throw httpError(400, translate(lang, 'emailAlreadyVerified'));
  }
  const otp = generateSixDigitOtp();
  const otpHash = await hashOtp(otp);
  user.emailVerificationCode = otpHash;
  user.emailVerificationExpiry = new Date(Date.now() + OTP_TTL_MS);
  await user.save();
  await sendVerificationEmail(toEmailUser(user), otp);
  return true;
}

export async function loginUser(
  input: LoginInput,
  lang: AppLang,
  device: string,
): Promise<{ user: PublicUser; accessToken: string; refreshToken: string }> {
  const email = input.email.toLowerCase();
  const user = await User.findOne({ email, isDeleted: false, isActive: true });
  if (!user) {
    throw httpError(401, translate(lang, 'invalidCredentials'));
  }

  if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
    const minutes = Math.max(
      1,
      Math.ceil((user.lockUntil.getTime() - Date.now()) / 60_000),
    );
    throw httpError(
      429,
      translate(lang, 'accountLocked', { minutes }),
      'ACCOUNT_LOCKED',
    );
  }

  const passwordOk = await verifyPassword(input.password, user.password);
  if (!passwordOk) {
    user.loginAttempts = (user.loginAttempts ?? 0) + 1;
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_MS);
      user.loginAttempts = 0;
    }
    await user.save();
    throw httpError(401, translate(lang, 'invalidCredentials'));
  }

  if (!user.isEmailVerified) {
    throw httpError(403, translate(lang, 'emailNotVerified'), 'EMAIL_NOT_VERIFIED');
  }

  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();
  await user.save();

  const accessToken = signAccessToken(String(user._id), user.role);
  const refreshToken = signRefreshToken(String(user._id), randomUUID());
  await persistRefreshToken(String(user._id), refreshToken, device);

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken,
  };
}

export async function logoutUser(
  userId: string,
  rawRefreshToken: string | undefined,
): Promise<void> {
  if (rawRefreshToken) {
    await revokeRefreshTokenByRaw(userId, rawRefreshToken);
  }
}

export async function refreshSession(
  userId: string,
  role: UserRole,
  oldRefreshRaw: string,
  device: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = signAccessToken(userId, role);
  const refreshToken = signRefreshToken(userId, randomUUID());
  await rotateRefreshToken(userId, oldRefreshRaw, refreshToken, device);
  return { accessToken, refreshToken };
}

export async function requestPasswordReset(
  input: PasswordResetRequestInput,
  lang: AppLang,
): Promise<void> {
  const email = input.email.toLowerCase();
  const user = await User.findOne({ email, isDeleted: false, isActive: true });
  if (!user) {
    return;
  }
  const otp = generateSixDigitOtp();
  const otpHash = await hashOtp(otp);
  user.passwordResetCode = otpHash;
  user.passwordResetExpiry = new Date(Date.now() + OTP_TTL_MS);
  user.passwordResetAttempts = 0;
  await user.save();
  await sendPasswordResetEmail(toEmailUser(user), otp);
}

export async function confirmPasswordReset(
  input: PasswordResetConfirmInput,
  lang: AppLang,
): Promise<void> {
  const email = input.email.toLowerCase();
  const user = await User.findOne({ email, isDeleted: false, isActive: true });
  if (!user) {
    throw httpError(400, translate(lang, 'otpInvalid'));
  }
  if (
    !user.passwordResetExpiry ||
    user.passwordResetExpiry.getTime() < Date.now()
  ) {
    throw httpError(400, translate(lang, 'otpExpired'));
  }
  const ok = await verifyOtp(input.code, user.passwordResetCode);
  if (!ok) {
    user.passwordResetAttempts = (user.passwordResetAttempts ?? 0) + 1;
    await user.save();
    throw httpError(400, translate(lang, 'otpInvalid'));
  }

  user.password = await hashPassword(input.newPassword);
  user.passwordResetCode = undefined;
  user.passwordResetExpiry = undefined;
  user.passwordResetAttempts = 0;
  user.refreshTokens = [];
  await user.save();

  const changedAt = new Date().toISOString();
  await sendPasswordChangedEmail(toEmailUser(user), changedAt);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  lang: AppLang,
): Promise<void> {
  const user = await User.findOne({ _id: userId, isDeleted: false, isActive: true });
  if (!user) {
    throw httpError(404, translate(lang, 'userNotFound'));
  }
  const ok = await verifyPassword(currentPassword, user.password);
  if (!ok) {
    throw httpError(400, translate(lang, 'invalidCredentials'));
  }
  user.password = await hashPassword(newPassword);
  user.refreshTokens = [];
  await user.save();

  const changedAt = new Date().toISOString();
  await sendPasswordChangedEmail(toEmailUser(user), changedAt);
}

export async function getUserProfile(
  userId: string,
  lang: AppLang,
): Promise<PublicUser> {
  const user = await User.findOne({ _id: userId, isDeleted: false });
  if (!user) {
    throw httpError(404, translate(lang, 'userNotFound'));
  }
  return toPublicUser(user);
}

export async function updateAccountType(
  userId: string,
  role: 'user' | 'gym_owner',
  lang: AppLang,
): Promise<PublicUser> {
  const user = await User.findOne({ _id: userId, isDeleted: false, isActive: true });
  if (!user) {
    throw httpError(404, translate(lang, 'userNotFound'));
  }
  if (user.role === 'admin' || user.role === 'super_admin') {
    throw httpError(403, translate(lang, 'forbidden'));
  }
  user.role = role;
  await user.save();
  return toPublicUser(user);
}

export async function updateUserProfile(
  userId: string,
  body: z.infer<typeof PatchProfileBodySchema>,
  lang: AppLang,
): Promise<PublicUser> {
  const user = await User.findOne({ _id: userId, isDeleted: false, isActive: true });
  if (!user) {
    throw httpError(404, translate(lang, 'userNotFound'));
  }
  if (body.firstName !== undefined) {
    user.firstName = body.firstName.trim();
  }
  if (body.lastName !== undefined) {
    user.lastName = body.lastName.trim();
  }
  if (body.phone !== undefined) {
    const p = body.phone.trim();
    user.phone = p.length > 0 ? p : undefined;
  }
  await user.save();
  return toPublicUser(user);
}

export async function updateUserPreferences(
  userId: string,
  body: z.infer<typeof PatchPreferencesBodySchema>,
  lang: AppLang,
): Promise<PublicUser> {
  const user = await User.findOne({ _id: userId, isDeleted: false, isActive: true });
  if (!user) {
    throw httpError(404, translate(lang, 'userNotFound'));
  }
  if (body.language !== undefined) {
    user.preferences.language = body.language;
  }
  if (body.currency !== undefined) {
    user.preferences.currency = body.currency.trim();
  }
  if (body.notifications !== undefined) {
    if (body.notifications.email !== undefined) {
      user.preferences.notifications.email = body.notifications.email;
    }
    if (body.notifications.inApp !== undefined) {
      user.preferences.notifications.inApp = body.notifications.inApp;
    }
  }
  await user.save();
  return toPublicUser(user);
}
