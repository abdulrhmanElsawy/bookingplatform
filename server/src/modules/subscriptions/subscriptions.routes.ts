import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateBody } from '../../middleware/validateBody.js';
import * as handlers from './subscriptions.handlers.js';
import {
  SimulateVenueSubscriptionSchema,
  VerifyAccessCodeSchema,
} from './subscriptions.schemas.js';

const router = Router();

router.post(
  '/simulate',
  authenticate,
  validateBody(SimulateVenueSubscriptionSchema),
  handlers.postSimulateVenueSubscription,
);

router.get('/mine', authenticate, handlers.listMySubscriptions);

router.post(
  '/verify',
  authenticate,
  authorize('gym_owner'),
  validateBody(VerifyAccessCodeSchema),
  handlers.postVerifyAccessCode,
);

export default router;
