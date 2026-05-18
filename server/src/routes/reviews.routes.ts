import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { isMongoObjectId } from '../lib/objectId.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { httpError } from '../middleware/errorHandler.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { validateBody } from '../middleware/validateBody.js';
import { tRes } from '../lib/i18nHttp.js';
import {
  CreateReviewBodySchema,
  OwnerReplyBodySchema,
} from '../modules/reviews/reviews.schemas.js';
import * as handlers from '../modules/reviews/reviews.handlers.js';

const router = Router();

function requireReviewObjectId(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const id =
    typeof req.params.reviewId === 'string' ? req.params.reviewId.trim() : '';
  if (!id || !isMongoObjectId(id)) {
    next(httpError(404, tRes(res, 'notFound')));
    return;
  }
  next();
}

router.get(
  '/for-owner',
  authenticate,
  authorize('gym_owner'),
  handlers.listReviewsForOwner,
);
router.patch(
  '/:reviewId/reply',
  authenticate,
  authorize('gym_owner'),
  requireReviewObjectId,
  validateBody(OwnerReplyBodySchema),
  handlers.replyToReviewAsOwner,
);
router.get('/', optionalAuth, handlers.listReviews);
router.post(
  '/',
  authenticate,
  validateBody(CreateReviewBodySchema),
  handlers.createReview,
);

export default router;
