import { Router } from 'express';

import { authenticate } from '../middleware/authenticate.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { validateBody } from '../middleware/validateBody.js';
import { FavoriteListingBodySchema } from '../modules/favorites/favorites.schemas.js';
import * as handlers from '../modules/favorites/favorites.handlers.js';

const router = Router();

router.get('/status', optionalAuth, handlers.getFavoriteStatus);
router.get('/', authenticate, handlers.listFavorites);
router.post(
  '/',
  authenticate,
  validateBody(FavoriteListingBodySchema),
  handlers.addFavorite,
);
router.delete('/', authenticate, handlers.removeFavorite);

export default router;
