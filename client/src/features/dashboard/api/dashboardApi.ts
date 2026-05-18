import { getApiUrl } from '../../../config/publicEnv';
import i18n from '../../../i18n';

export class DashboardApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'DashboardApiError';
  }
}

function acceptLanguageHeader(): string {
  const lng = i18n.language?.toLowerCase() ?? 'ar';
  return lng.startsWith('en') ? 'en' : 'ar';
}

function jsonHeaders(): HeadersInit {
  return {
    Accept: 'application/json',
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

export type OwnerOverviewDto = {
  totalViews: number;
  totalContactClicks: number;
  activeListings: number;
  totalListings: number;
  avgRating: number;
  pendingReviews: number;
  viewsThisMonth: number;
  viewsChangePercent: number | null;
};

export type OwnerListingRowDto = {
  _id: string;
  slug: string;
  name: { ar: string; en: string };
  status: 'draft' | 'pending' | 'active' | 'rejected' | 'suspended';
  createdAt: string;
  updatedAt: string;
  rejectionReason?: { ar: string; en: string };
  category: { slug: string; name: { ar: string; en: string } } | null;
  thumbnailUrl?: string;
};

export async function fetchOwnerListings(): Promise<OwnerListingRowDto[]> {
  const url = `${getApiUrl()}/api/dashboard/owner/listings`;
  const res = await fetch(url, {
    method: 'GET',
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const data = (await parseJson(res)) as { listings?: OwnerListingRowDto[] };
  if (!res.ok) {
    throw new DashboardApiError(messageFromBody(data) || 'error', res.status);
  }
  return data.listings ?? [];
}

export async function fetchOwnerOverview(): Promise<OwnerOverviewDto> {
  const url = `${getApiUrl()}/api/dashboard/overview`;
  const res = await fetch(url, {
    method: 'GET',
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const data = (await parseJson(res)) as { overview?: OwnerOverviewDto };
  if (!res.ok) {
    throw new DashboardApiError(messageFromBody(data) || 'error', res.status);
  }
  if (!data.overview) {
    throw new DashboardApiError('Invalid response', res.status);
  }
  return data.overview;
}
