import { Router } from 'express';

import * as handlers from '../modules/listings/listings.handlers.js';

const router = Router();

router.get('/', handlers.listCategories);
router.get('/:slug/listings', handlers.listCategoryListings);

export default router;
