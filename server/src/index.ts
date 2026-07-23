import { createServer } from 'node:http';

import './config/bootstrap.js';
import app from './app.js';
import { getEnv } from './config/env.js';
import { connectMongo } from './database/mongodb.js';
import { verifySmtpConnection } from './modules/email/email.transport.js';
import { ensureUploadDirs } from './modules/uploads/localDiskStorage.js';
import { attachNotificationsSocket } from './realtime/notificationsSocket.js';

async function main(): Promise<void> {
  const env = getEnv();
  await connectMongo(env.MONGODB_URI);
  await verifySmtpConnection();
  await ensureUploadDirs();

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
