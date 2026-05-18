import { Router } from 'express';

import { authenticate } from '../middleware/authenticate.js';
import * as handlers from '../modules/notifications/notifications.handlers.js';

const router = Router();

router.get('/unread-count', authenticate, handlers.getUnreadCount);
router.get('/', authenticate, handlers.listNotifications);
router.post('/mark-all-read', authenticate, handlers.markAllNotificationsRead);
router.patch('/:id/read', authenticate, handlers.markNotificationRead);
router.delete('/:id', authenticate, handlers.deleteNotification);

export default router;
