import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import {
  LoginSchema,
  OtpVerifySchema,
  PasswordResetConfirmSchema,
  PasswordResetRequestSchema,
  RegisterSchema,
} from '@growth-world/shared';

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
  '/resend-password-reset',
  validateBody(PasswordResetRequestSchema),
  asyncHandler(authHandlers.resendPasswordReset),
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
