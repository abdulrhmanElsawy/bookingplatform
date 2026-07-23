import type { ContactSupportBody } from '@growth-world/shared';

import { getEnv } from '../../config/env.js';
import { enqueueEmail } from '../email/email.queue.js';
import type { EmailLang } from '../email/email.types.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendSupportContactEmail(
  body: ContactSupportBody,
  lang: EmailLang,
): Promise<void> {
  const env = getEnv();
  const submittedAt = new Date().toISOString();
  const html = `
    <h2>Growth World — Help contact</h2>
    <p><strong>Language:</strong> ${escapeHtml(lang)}</p>
    <p><strong>Name:</strong> ${escapeHtml(body.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(body.email)}</p>
    <p><strong>Subject:</strong> ${escapeHtml(body.subject)}</p>
    <p><strong>Message:</strong></p>
    <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(body.message)}</pre>
    <p><strong>Submitted at:</strong> ${escapeHtml(submittedAt)}</p>
  `.trim();

  await enqueueEmail({
    to: env.SUPPORT_EMAIL,
    replyTo: body.email,
    subject: `[Growth World Help] ${body.subject} — ${body.name}`,
    html,
    template: 'support-contact',
    lang,
  });
}
