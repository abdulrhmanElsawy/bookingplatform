import { Router } from 'express';

import * as handlers from '../modules/settings/settings.handlers.js';

const router = Router();

router.get('/public', handlers.getPublicSettings);

export default router;
