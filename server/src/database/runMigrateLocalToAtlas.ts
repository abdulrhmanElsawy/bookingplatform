/**
 * Copy all collections from a source MongoDB database to a target (e.g. Atlas).
 *
 * Usage:
 *   SOURCE_MONGODB_URI=mongodb://localhost:27017/growth-world \
 *   TARGET_MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/growth-world" \
 *   npx tsx src/database/runMigrateLocalToAtlas.ts
 *
 * Or pass target URI as the first CLI argument.
 */
import dns from 'node:dns';
import { MongoClient, type Db, type Document } from 'mongodb';

const DB_NAME = 'growth-world';
const BATCH_SIZE = 500;

// System DNS often fails SRV lookups for mongodb+srv on Windows.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

function ensureDbInUri(uri: string, dbName: string): string {
  const trimmed = uri.trim();
  if (!trimmed) return trimmed;

  const [base, query = ''] = trimmed.split('?');
  const hasDbPath = /\/[^/?]+$/.test(base.replace(/\/$/, ''));
  if (hasDbPath) return trimmed;

  const withDb = base.replace(/\/$/, '') + `/${dbName}`;
  return query ? `${withDb}?${query}` : withDb;
}

async function copyCollection(
  sourceDb: Db,
  targetDb: Db,
  name: string,
): Promise<{ docs: number }> {
  const source = sourceDb.collection(name);
  const target = targetDb.collection(name);

  const indexes = await source.indexes();
  await target.drop().catch(() => undefined);

  for (const index of indexes) {
    if (index.name === '_id_') continue;
    const { key, name: indexName, ...options } = index;
    await target.createIndex(key, { ...options, name: indexName });
  }

  const cursor = source.find({});
  let total = 0;
  let batch: Document[] = [];

  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= BATCH_SIZE) {
      await target.insertMany(batch, { ordered: false });
      total += batch.length;
      batch = [];
    }
  }
  if (batch.length > 0) {
    await target.insertMany(batch, { ordered: false });
    total += batch.length;
  }

  return { docs: total };
}

async function main(): Promise<void> {
  const sourceUri =
    process.env.SOURCE_MONGODB_URI ?? `mongodb://localhost:27017/${DB_NAME}`;
  const targetRaw =
    process.env.TARGET_MONGODB_URI ?? process.argv[2] ?? '';
  if (!targetRaw) {
    console.error(
      'Set TARGET_MONGODB_URI or pass Atlas connection string as first argument.',
    );
    process.exit(1);
  }

  const targetUri = ensureDbInUri(targetRaw, DB_NAME);
  const targetSuffix = targetUri.includes('?')
    ? ''
    : '?retryWrites=true&w=majority';
  const targetUriFinal = targetUri.includes('retryWrites')
    ? targetUri
    : `${targetUri}${targetSuffix}`;

  const sourceClient = new MongoClient(sourceUri);
  const targetClient = new MongoClient(targetUriFinal);

  console.info(`Source: ${sourceUri}`);
  console.info(`Target: ${targetUri.replace(/:[^:@/]+@/, ':****@')}`);

  await sourceClient.connect();
  await targetClient.connect();

  const sourceDb = sourceClient.db(DB_NAME);
  const targetDb = targetClient.db(DB_NAME);

  const collections = await sourceDb.listCollections().toArray();
  const summary: Record<string, number> = {};

  for (const { name } of collections) {
    const { docs } = await copyCollection(sourceDb, targetDb, name);
    summary[name] = docs;
    console.info(`  ${name}: ${docs} documents`);
  }

  await sourceClient.close();
  await targetClient.close();

  console.info('\nMigration complete:', summary);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
