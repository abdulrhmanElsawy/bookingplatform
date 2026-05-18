import Queue from 'bull';

import { getEnv } from '../../config/env.js';
import { sendMailDirect } from './email.transport.js';
import type { EmailJob } from './email.types.js';

const JOB_NAME = 'send-email';

export const emailQueueDefaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: 500,
  removeOnFail: 200,
};

type EmailQueue = InstanceType<typeof Queue>;

let queue: EmailQueue | null = null;

export function getEmailQueue(): EmailQueue {
  if (queue) return queue;
  const env = getEnv();
  queue = new Queue('growth-world-email', env.REDIS_URL, {
    defaultJobOptions: emailQueueDefaultJobOptions,
  });
  queue.on('failed', (job, err) => {
    console.error('Email job failed', job?.id, err);
  });
  return queue;
}

/** In tests, send synchronously (no Redis queue). In other envs, enqueue with Bull (3 attempts). */
export async function enqueueEmail(job: EmailJob): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    await sendMailDirect(job);
    return;
  }
  await getEmailQueue().add(JOB_NAME, job);
}

export function registerEmailWorker(): void {
  if (process.env.NODE_ENV === 'test') return;
  void getEmailQueue().process(JOB_NAME, async (job) => {
    await sendMailDirect(job.data as EmailJob);
  });
}

export async function closeEmailQueue(): Promise<void> {
  if (!queue) return;
  await queue.close();
  queue = null;
}
