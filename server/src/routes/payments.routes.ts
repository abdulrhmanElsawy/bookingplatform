import { Router } from 'express';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody } from '../middleware/validateBody.js';
import { SimulatePlanBodySchema } from '../modules/payments/payments.schemas.js';
import * as handlers from '../modules/payments/payments.handlers.js';

const router = Router();

router.get('/plans', handlers.getPlanCatalog);
router.post(
  '/simulate',
  authenticate,
  authorize('gym_owner'),
  validateBody(SimulatePlanBodySchema),
  handlers.postSimulateCheckout,
);
router.get(
  '/transactions',
  authenticate,
  authorize('gym_owner'),
  handlers.listMyTransactions,
);

export default router;
