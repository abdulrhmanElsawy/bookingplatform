import mongoose from 'mongoose';

import '../modules/users/user.model.js';
import '../modules/categories/category.model.js';
import '../modules/listings/listing.model.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function connectMongo(uri: string, maxAttempts = 5): Promise<void> {
  mongoose.connection.on('connected', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.info('MongoDB connected');
    }
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error', err);
  });

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await mongoose.connect(uri);
      return;
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts) break;
      const delayMs = 1000 * attempt;
      console.warn(`MongoDB connect attempt ${attempt} failed, retry in ${delayMs}ms`);
      await sleep(delayMs);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Failed to connect to MongoDB');
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}
