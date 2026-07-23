import nodemailer from 'nodemailer';

import { getEnv } from '../../config/env.js';
import type { EmailJob } from './email.types.js';

let transporter: nodemailer.Transporter | null = null;

export function getMailTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;
  const env = getEnv();

  if (env.SMTP_HOST && env.SMTP_FROM) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: (env.SMTP_PORT ?? 587) === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS !== undefined
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    jsonTransport: true,
  });
  return transporter;
}

export async function sendMailDirect(job: EmailJob): Promise<void> {
  const env = getEnv();
  const from = env.SMTP_FROM ?? 'no-reply@growth-world.local';
  await getMailTransporter().sendMail({
    from,
    to: job.to,
    replyTo: job.replyTo,
    subject: job.subject,
    html: job.html,
  });
}

/** Returns true when real SMTP is configured (not jsonTransport fallback). */
export function isSmtpConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.SMTP_HOST && env.SMTP_FROM);
}

/** Verifies SMTP connectivity. No-op when SMTP is not configured (dev jsonTransport). */
export async function verifySmtpConnection(): Promise<void> {
  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        'SMTP not configured — emails will use jsonTransport (not delivered). Set SMTP_HOST and SMTP_FROM.',
      );
    }
    return;
  }
  await getMailTransporter().verify();
  if (process.env.NODE_ENV !== 'test') {
    console.info('SMTP connection verified');
  }
}
