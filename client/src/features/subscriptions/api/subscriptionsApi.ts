import { getApiUrl } from '../../../config/publicEnv';
import i18n from '../../../i18n';

export class SubscriptionsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'SubscriptionsApiError';
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

export type VenueSubscriptionDto = {
  id: string;
  accessCode: string;
  status: 'active' | 'expired' | 'cancelled';
  amount: number;
  currency: string;
  validFrom: string;
  validUntil: string;
  packageSnapshot: {
    name: { ar: string; en: string };
    price: number;
    currency: string;
    duration: string;
  };
  listing: {
    id: string;
    slug: string;
    name: { ar: string; en: string };
  };
  createdAt: string;
};

export async function postSimulateVenueSubscription(
  listingSlug: string,
  packageId: string,
): Promise<VenueSubscriptionDto> {
  const base = getApiUrl();
  if (!base) {
    throw new SubscriptionsApiError('API URL is not configured', 0);
  }
  const res = await fetch(`${base}/api/subscriptions/simulate`, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify({ listingSlug, packageId }),
  });
  const data = (await parseJson(res)) as { subscription?: VenueSubscriptionDto };
  if (!res.ok) {
    throw new SubscriptionsApiError(messageFromBody(data) || 'error', res.status);
  }
  if (!data.subscription) {
    throw new SubscriptionsApiError('Invalid response', res.status);
  }
  return data.subscription;
}

export type MySubscriptionsResponse = {
  subscriptions: VenueSubscriptionDto[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchMySubscriptions(
  page = 1,
  limit = 20,
): Promise<MySubscriptionsResponse> {
  const base = getApiUrl();
  if (!base) {
    throw new SubscriptionsApiError('API URL is not configured', 0);
  }
  const url = new URL(`${base}/api/subscriptions/mine`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), {
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const data = (await parseJson(res)) as MySubscriptionsResponse | null;
  if (!res.ok) {
    throw new SubscriptionsApiError(messageFromBody(data) || 'error', res.status);
  }
  return {
    subscriptions: data?.subscriptions ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
  };
}

export type VerifyAccessCodeResult =
  | {
      valid: true;
      subscription: {
        memberName: string;
        packageName: { ar: string; en: string };
        validUntil: string;
        status: string;
        accessCode: string;
      };
    }
  | { valid: false; reason: string };

export async function verifyAccessCode(
  accessCode: string,
  listingId?: string,
): Promise<VerifyAccessCodeResult> {
  const base = getApiUrl();
  if (!base) {
    throw new SubscriptionsApiError('API URL is not configured', 0);
  }
  const res = await fetch(`${base}/api/subscriptions/verify`, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify({ accessCode, listingId }),
  });
  const data = (await parseJson(res)) as VerifyAccessCodeResult;
  if (!res.ok) {
    throw new SubscriptionsApiError(messageFromBody(data) || 'error', res.status);
  }
  return data;
}
