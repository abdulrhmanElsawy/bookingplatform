import '../config/bootstrap.js';

import { getEnv } from '../config/env.js';
import { connectMongo, disconnectMongo } from './mongodb.js';
import { repairListingImages, verifySeedMediaUrls } from './repairListingImages.js';

async function main(): Promise<void> {
  const dryRun =
    process.argv.includes('--dry-run') || process.env.REPAIR_DRY_RUN === '1';

  const env = getEnv();
  await connectMongo(env.MONGODB_URI);

  console.info('Checking seed media URLs…');
  const seedCheck = await verifySeedMediaUrls();
  if (seedCheck.failed.length > 0) {
    console.warn('Some seed URLs failed (listings may still be repaired with working ones):');
    for (const url of seedCheck.failed) console.warn(`  FAIL ${url}`);
  } else {
    console.info(`All ${seedCheck.ok.length} seed URL(s) OK.`);
  }

  console.info(dryRun ? 'Dry run — no writes.' : 'Repairing listing images…');
  const result = await repairListingImages({ dryRun });

  console.info(
    `Scanned ${result.scanned} listing(s): ${result.updated} ${dryRun ? 'would update' : 'updated'}, ${result.skippedValid} already valid.`,
  );
  for (const line of result.details) {
    console.info(`  [${line.action}] ${line.slug} — ${line.reason}`);
  }

  await disconnectMongo();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
