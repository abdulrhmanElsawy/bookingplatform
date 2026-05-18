import { Router } from 'express';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody } from '../middleware/validateBody.js';
import {
  AdminBroadcastBodySchema,
  AdminCreateCategoryBodySchema,
  AdminPatchCategoryBodySchema,
  AdminPatchListingBodySchema,
  AdminPatchReviewStatusBodySchema,
  AdminPatchSiteSettingsBodySchema,
  AdminPatchSubscriptionBodySchema,
  AdminPatchUserBodySchema,
} from '../modules/admin/admin.schemas.js';
import * as handlers from '../modules/admin/admin.handlers.js';

const router = Router();

const adminOnly = [
  authenticate,
  authorize('admin', 'super_admin'),
] as const;

router.get('/overview', ...adminOnly, handlers.getAdminOverview);
router.get('/users', ...adminOnly, handlers.listAdminUsers);
router.post(
  '/broadcast',
  ...adminOnly,
  validateBody(AdminBroadcastBodySchema),
  handlers.postAdminBroadcast,
);
router.patch(
  '/users/:userId',
  ...adminOnly,
  handlers.requireAdminUserObjectId,
  validateBody(AdminPatchUserBodySchema),
  handlers.patchAdminUser,
);

router.get('/listings', ...adminOnly, handlers.listAdminListings);
router.patch(
  '/listings/:id',
  ...adminOnly,
  handlers.requireAdminListingObjectId,
  validateBody(AdminPatchListingBodySchema),
  handlers.patchAdminListing,
);
router.delete(
  '/listings/:id',
  ...adminOnly,
  handlers.requireAdminListingObjectId,
  handlers.deleteAdminListing,
);

router.get('/reviews', ...adminOnly, handlers.listAdminReviews);
router.patch(
  '/reviews/:id/status',
  ...adminOnly,
  handlers.requireAdminReviewObjectId,
  validateBody(AdminPatchReviewStatusBodySchema),
  handlers.patchAdminReviewStatus,
);

router.get('/categories', ...adminOnly, handlers.listAdminCategories);
router.post(
  '/categories',
  ...adminOnly,
  validateBody(AdminCreateCategoryBodySchema),
  handlers.createAdminCategory,
);
router.patch(
  '/categories/:id',
  ...adminOnly,
  handlers.requireAdminCategoryObjectId,
  validateBody(AdminPatchCategoryBodySchema),
  handlers.patchAdminCategory,
);
router.delete(
  '/categories/:id',
  ...adminOnly,
  handlers.requireAdminCategoryObjectId,
  handlers.deleteAdminCategory,
);

router.get('/subscriptions', ...adminOnly, handlers.listAdminSubscriptions);
router.patch(
  '/subscriptions/:id',
  ...adminOnly,
  handlers.requireAdminSubscriptionObjectId,
  validateBody(AdminPatchSubscriptionBodySchema),
  handlers.patchAdminSubscription,
);

router.get('/payments/summary', ...adminOnly, handlers.getAdminPaymentsSummary);
router.get('/payments/transactions', ...adminOnly, handlers.listAdminPaymentTransactions);

router.get('/content/home', ...adminOnly, handlers.getAdminHomeContent);

router.get('/settings', ...adminOnly, handlers.getAdminSettings);
router.patch(
  '/settings',
  ...adminOnly,
  validateBody(AdminPatchSiteSettingsBodySchema),
  handlers.patchAdminSettings,
);

router.get('/audit', ...adminOnly, handlers.listAdminAudit);

export default router;
