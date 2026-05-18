import { createServer } from 'node:http';

import './config/bootstrap.js';
import app from './app.js';
import { getEnv } from './config/env.js';
import { connectMongo } from './database/mongodb.js';
import { connectRedis } from './database/redis.js';
import { registerEmailWorker } from './modules/email/email.queue.js';
import { ensureUploadDirs } from './modules/uploads/localDiskStorage.js';
import { attachNotificationsSocket } from './realtime/notificationsSocket.js';

async function main(): Promise<void> {
  const env = getEnv();
  await connectMongo(env.MONGODB_URI);
  await connectRedis(env.REDIS_URL);
  await ensureUploadDirs();
  registerEmailWorker();

  const httpServer = createServer(app);
  attachNotificationsSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    console.info(`API listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
