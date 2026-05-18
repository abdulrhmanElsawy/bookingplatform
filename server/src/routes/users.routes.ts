import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validateBody.js';
import {
  PatchPreferencesBodySchema,
  PatchProfileBodySchema,
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

router.patch(
  '/me',
  authenticate,
  validateBody(PatchProfileBodySchema),
  asyncHandler(authHandlers.patchMyProfile),
);
router.patch(
  '/me/preferences',
  authenticate,
  validateBody(PatchPreferencesBodySchema),
  asyncHandler(authHandlers.patchMyPreferences),
);

export default router;
