import '../config/bootstrap.js';

import { getEnv } from '../config/env.js';
import { connectMongo, disconnectMongo } from './mongodb.js';
import { seedCategories } from './seedCategories.js';
import { SEED_DEV_PASSWORD, seedDevListings, seedDevUsers } from './seedDevData.js';
import { seedDevReviews } from './seedDevReviews.js';
import { repairListingImages } from './repairListingImages.js';

async function main(): Promise<void> {
  const env = getEnv();
  await connectMongo(env.MONGODB_URI);
  await seedCategories();
  const { ownerId, reviewerIds } = await seedDevUsers();
  await seedDevListings(ownerId);
  await seedDevReviews(reviewerIds);
  const repair = await repairListingImages();
  console.info(
    `Listing images: ${repair.updated} updated, ${repair.skippedValid} already had valid photos.`,
  );
  await disconnectMongo();
  console.info('Dev seed complete (categories + users + listings + reviews).');
  console.info(`Demo password for *@growth-world.local users: ${SEED_DEV_PASSWORD}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
