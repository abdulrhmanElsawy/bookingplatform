import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import type { RequestHandler } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { buildOpenApiSpec } from './config/swagger.js';
import { getEnv } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { languageMiddleware } from './middleware/languageMiddleware.js';
import { notFoundHandler } from './middleware/notFound.js';
import adminRoutes from './routes/admin.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import authRoutes from './routes/auth.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import favoritesRoutes from './routes/favorites.routes.js';
import healthRoutes from './routes/health.routes.js';
import listingsRoutes from './routes/listings.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import subscriptionsRoutes from './routes/subscriptions.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';
import { resolveUploadRoot } from './modules/uploads/localDiskStorage.js';
import uploadsRoutes from './routes/uploads.routes.js';
import usersRoutes from './routes/users.routes.js';

const env = getEnv();

const app = express();

app.use(
  helmet({
    // Public listing images are loaded from the API origin in dev (5173 → 4000).
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((o) => o.trim());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);

app.use(compression() as unknown as RequestHandler);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
// express-mongo-sanitize mutates req.query; Express 5 makes query read-only — stay on Express 4 until upstream supports v5.
app.use(mongoSanitize() as unknown as RequestHandler);

app.use(cookieParser() as unknown as RequestHandler);

const uploadStaticOptions = {
  maxAge: env.NODE_ENV === 'production' ? ('7d' as const) : 0,
  immutable: env.NODE_ENV === 'production',
};

app.use('/uploads', (req, res, next) => {
  express.static(resolveUploadRoot(), uploadStaticOptions)(req, res, next);
});

app.use(languageMiddleware);

const skipRateLimit = () => env.NODE_ENV === 'test';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});

const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});

const api = express.Router();

api.use('/auth', authLimiter as unknown as RequestHandler, authRoutes);
api.use(generalApiLimiter as unknown as RequestHandler);

const openApi = buildOpenApiSpec();
api.use(
  '/docs',
  ...(swaggerUi.serve as unknown as RequestHandler[]),
  swaggerUi.setup(openApi) as unknown as RequestHandler,
);
api.use(healthRoutes);
api.use('/listings', listingsRoutes);
api.use('/notifications', notificationsRoutes);
api.use('/payments', paymentsRoutes);
api.use('/subscriptions', subscriptionsRoutes);
api.use('/reviews', reviewsRoutes);
api.use('/favorites', favoritesRoutes);
api.use('/users', usersRoutes);
api.use('/categories', categoriesRoutes);
api.use('/dashboard', dashboardRoutes);
api.use('/admin', adminRoutes);
api.use('/settings', settingsRoutes);
api.use('/uploads', uploadsRoutes);

if (env.NODE_ENV === 'test') {
  api.get('/test-boom', (_req, _res, next) => {
    next(Object.assign(new Error('intentional'), { status: 500 }));
  });
}

app.use('/api', api);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
