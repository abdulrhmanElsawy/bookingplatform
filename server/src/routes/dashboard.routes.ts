import { Router } from 'express';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import * as handlers from '../modules/dashboard/dashboard.handlers.js';

const router = Router();

router.get('/overview', authenticate, authorize('gym_owner'), handlers.getOwnerOverview);
router.get('/owner/listings', authenticate, handlers.getOwnerListings);

export default router;
