import '../config/bootstrap.js';

import { getEnv } from '../config/env.js';
import { connectMongo, disconnectMongo } from './mongodb.js';
import { seedCategories } from './seedCategories.js';

async function main(): Promise<void> {
  const env = getEnv();
  await connectMongo(env.MONGODB_URI);
  await seedCategories();
  await disconnectMongo();
  console.info('Categories seeded.');
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
