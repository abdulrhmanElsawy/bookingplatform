import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { Router } from 'express';
import multer, { MulterError } from 'multer';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { httpError } from '../middleware/errorHandler.js';
import { tRes } from '../lib/i18nHttp.js';
import { postListingImage } from '../modules/uploads/upload.handlers.js';

const router = Router();

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const parseSingleFile = memoryUpload.single('file') as RequestHandler;

function runMulterSingle(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  parseSingleFile(req, res, (err: unknown) => {
    if (err instanceof MulterError) {
      next(httpError(400, tRes(res, 'validationError')));
      return;
    }
    if (err) {
      next(err);
      return;
    }
    next();
  });
}

router.use(authenticate);
router.use(authorize('gym_owner', 'admin', 'super_admin'));

router.post('/listing-image', runMulterSingle, postListingImage);

export default router;
