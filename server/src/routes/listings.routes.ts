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
  CreateListingBodySchema,
  PatchListingStatusBodySchema,
  UpdateListingBodySchema,
} from '../modules/listings/listings.schemas.js';
import * as handlers from '../modules/listings/listings.handlers.js';

const router = Router();

function requireObjectIdParam(param: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[param];
    if (!id || !isMongoObjectId(id)) {
      next(httpError(404, tRes(res, 'notFound')));
      return;
    }
    next();
  };
}

router.get('/', optionalAuth, handlers.listListings);
router.get('/featured', handlers.listFeatured);
router.get('/nearby', handlers.listNearby);
router.get(
  '/:listingId/analytics',
  authenticate,
  requireObjectIdParam('listingId'),
  handlers.getListingAnalytics,
);
router.post(
  '/',
  authenticate,
  authorize('user', 'gym_owner', 'admin', 'super_admin'),
  validateBody(CreateListingBodySchema),
  handlers.createListing,
);
router.put(
  '/:id',
  authenticate,
  requireObjectIdParam('id'),
  validateBody(UpdateListingBodySchema),
  handlers.updateListing,
);
router.delete(
  '/:id',
  authenticate,
  requireObjectIdParam('id'),
  handlers.removeListing,
);
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin', 'super_admin'),
  requireObjectIdParam('id'),
  validateBody(PatchListingStatusBodySchema),
  handlers.patchListingStatus,
);
router.get('/:slugOrId', optionalAuth, handlers.getListing);

export default router;
