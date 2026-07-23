import { sendMailDirect } from './email.transport.js';
import type { EmailJob } from './email.types.js';

/** Sends email synchronously via SMTP (no queue). */
export async function enqueueEmail(job: EmailJob): Promise<void> {
  await sendMailDirect(job);
}
