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
    subject: job.subject,
    html: job.html,
  });
}
