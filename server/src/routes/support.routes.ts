import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { ContactSupportBodySchema } from '@growth-world/shared';

import { validateBody } from '../middleware/validateBody.js';
import * as supportHandlers from '../modules/support/support.handlers.js';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    void fn(req, res).catch(next);
  };
}

router.post(
  '/contact',
  validateBody(ContactSupportBodySchema),
  asyncHandler(supportHandlers.postContact),
);

export default router;
