import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const IoRedis = require('ioredis') as new (
  url: string,
  options?: Record<string, unknown>,
) => import('ioredis').Redis;

let client: import('ioredis').Redis | null = null;

export function getRedis(): import('ioredis').Redis {
  if (!client) {
    throw new Error('Redis is not initialized');
  }
  return client;
}

export async function connectRedis(
  url: string,
): Promise<import('ioredis').Redis> {
  const redis = new IoRedis(url, {
    maxRetriesPerRequest: 2,
    lazyConnect: true,
  });
  redis.on('error', (err: Error) => {
    console.error('Redis error', err);
  });
  redis.on('connect', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.info('Redis connected');
    }
  });
  await redis.connect();
  await redis.ping();
  client = redis;
  return redis;
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
