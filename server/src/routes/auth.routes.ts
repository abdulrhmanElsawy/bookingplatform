import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  LoginSchema,
  OtpVerifySchema,
  PasswordResetConfirmSchema,
  PasswordResetRequestSchema,
  RegisterSchema,
} from '@growth-world/shared';

import { getEnv } from '../config/env.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validateBody.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { refreshTokenMiddleware } from '../middleware/refreshToken.js';
import {
  AccountTypeBodySchema,
  ChangePasswordBodySchema,
  ResendVerificationSchema,
} from '../modules/auth/auth.schemas.js';
import * as authHandlers from '../modules/auth/auth.handlers.js';

const router = Router();

const skipRateLimit = () => getEnv().NODE_ENV === 'test';

const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  keyGenerator: (req) => {
    const raw = (req.body as { email?: string })?.email;
    return typeof raw === 'string' && raw.length > 0
      ? raw.toLowerCase()
      : (req.ip ?? 'unknown');
  },
});

function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    void fn(req, res).catch(next);
  };
}

router.post(
  '/register',
  validateBody(RegisterSchema),
  asyncHandler(authHandlers.register),
);

router.post(
  '/verify-email',
  validateBody(OtpVerifySchema),
  asyncHandler(authHandlers.verifyEmail),
);

router.post(
  '/resend-verification',
  resendVerificationLimiter as unknown as RequestHandler,
  validateBody(ResendVerificationSchema),
  asyncHandler(authHandlers.resendVerification),
);

router.post(
  '/login',
  validateBody(LoginSchema),
  asyncHandler(authHandlers.login),
);

router.post(
  '/logout',
  optionalAuth,
  asyncHandler(authHandlers.logout),
);

router.post(
  '/refresh',
  refreshTokenMiddleware,
  asyncHandler(authHandlers.refresh),
);

router.post(
  '/forgot-password',
  validateBody(PasswordResetRequestSchema),
  asyncHandler(authHandlers.forgotPassword),
);

router.post(
  '/reset-password',
  validateBody(PasswordResetConfirmSchema),
  asyncHandler(authHandlers.resetPassword),
);

router.get('/me', authenticate, asyncHandler(authHandlers.me));

router.patch(
  '/account-type',
  authenticate,
  validateBody(AccountTypeBodySchema),
  asyncHandler(authHandlers.patchAccountType),
);

router.post(
  '/change-password',
  authenticate,
  validateBody(ChangePasswordBodySchema),
  asyncHandler(authHandlers.changePasswordHandler),
);

export default router;
