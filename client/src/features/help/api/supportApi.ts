import type { ContactSupportBody } from '@growth-world/shared';

import { getApiUrl } from '../../../config/publicEnv';
import i18n from '../../../i18n';

export class SupportApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'SupportApiError';
  }
}

function acceptLanguageHeader(): string {
  const lng = i18n.language?.toLowerCase() ?? 'ar';
  return lng.startsWith('en') ? 'en' : 'ar';
}

function jsonHeaders(): HeadersInit {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Accept-Language': acceptLanguageHeader(),
  };
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function messageFromBody(body: unknown): string {
  if (
    body &&
    typeof body === 'object' &&
    'error' in body &&
    body.error &&
    typeof body.error === 'object' &&
    'message' in body.error &&
    typeof (body.error as { message: unknown }).message === 'string'
  ) {
    return (body.error as { message: string }).message;
  }
  return '';
}

export async function postSupportContact(
  payload: ContactSupportBody,
): Promise<void> {
  const base = getApiUrl();
  if (!base) {
    throw new SupportApiError('API URL is not configured', 0);
  }
  const res = await fetch(`${base}/api/support/contact`, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const parsed = await parseJson(res);
  if (!res.ok) {
    throw new SupportApiError(
      messageFromBody(parsed) || 'Failed to send message',
      res.status,
    );
  }
}
