import { getApiUrl } from '../../../config/publicEnv';
import i18n from '../../../i18n';

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AdminApiError';
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

export type AdminPendingListingRowDto = {
  _id: string;
  slug: string;
  name: { ar: string; en: string };
  ownerEmail: string;
  status: string;
  createdAt: string;
};

export type AdminOverviewDto = {
  totalUsers: number;
  totalListings: number;
  pendingListings: number;
  totalReviews: number;
  pendingReviews: number;
  newUsersToday: number;
  newListingsToday: number;
  actionRequiredCount: number;
  pendingListingRows: AdminPendingListingRowDto[];
};

export async function fetchAdminOverview(): Promise<AdminOverviewDto> {
  const base = getApiUrl();
  if (!base) {
    throw new AdminApiError('API URL is not configured', 0);
  }
  const res = await fetch(`${base}/api/admin/overview`, {
    method: 'GET',
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const data = (await parseJson(res)) as { overview?: AdminOverviewDto };
  if (!res.ok) {
    throw new AdminApiError(messageFromBody(data) || 'error', res.status);
  }
  if (!data.overview) {
    throw new AdminApiError('Invalid response', res.status);
  }
  return data.overview;
}

export type AdminUserRowDto = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'guest' | 'user' | 'gym_owner' | 'admin' | 'super_admin';
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
};

export type AdminUsersListResponse = {
  users: AdminUserRowDto[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchAdminUsers(
  page = 1,
  limit = 20,
  search?: string,
): Promise<AdminUsersListResponse> {
  const base = getApiUrl();
  if (!base) {
    throw new AdminApiError('API URL is not configured', 0);
  }
  const url = new URL(`${base}/api/admin/users`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  if (search?.trim()) url.searchParams.set('search', search.trim());
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const data = (await parseJson(res)) as AdminUsersListResponse | null;
  if (!res.ok) {
    throw new AdminApiError(messageFromBody(data) || 'error', res.status);
  }
  return {
    users: data?.users ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
  };
}

export type PatchAdminUserPayload = {
  isActive?: boolean;
  role?: AdminUserRowDto['role'];
};

export async function patchAdminUser(
  userId: string,
  body: PatchAdminUserPayload,
): Promise<AdminUserRowDto> {
  const base = getApiUrl();
  if (!base) {
    throw new AdminApiError('API URL is not configured', 0);
  }
  const res = await fetch(`${base}/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = (await parseJson(res)) as { user?: AdminUserRowDto };
  if (!res.ok) {
    throw new AdminApiError(messageFromBody(data) || 'error', res.status);
  }
  if (!data.user) {
    throw new AdminApiError('Invalid response', res.status);
  }
  return data.user;
}

export type AdminBroadcastPayload = {
  scope: 'all' | 'role';
  role?: AdminUserRowDto['role'];
  title: { ar: string; en: string };
  body: { ar: string; en: string };
};

export async function postAdminBroadcast(
  body: AdminBroadcastPayload,
): Promise<{ recipients: number }> {
  const base = getApiUrl();
  if (!base) {
    throw new AdminApiError('API URL is not configured', 0);
  }
  const res = await fetch(`${base}/api/admin/broadcast`, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = (await parseJson(res)) as { recipients?: number };
  if (!res.ok) {
    throw new AdminApiError(messageFromBody(data) || 'error', res.status);
  }
  return { recipients: data?.recipients ?? 0 };
}

async function adminFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ res: Response; data: T | null }> {
  const base = getApiUrl();
  if (!base) {
    throw new AdminApiError('API URL is not configured', 0);
  }
  const res = await fetch(`${base}${path}`, {
    credentials: 'include',
    headers: jsonHeaders(),
    ...init,
  });
  const data = (await parseJson(res)) as T | null;
  if (!res.ok) {
    throw new AdminApiError(messageFromBody(data) || 'error', res.status);
  }
  return { res, data };
}

export type AdminListingRowDto = {
  _id: string;
  slug: string;
  name: { ar: string; en: string };
  status: string;
  ownerEmail: string;
  categorySlug: string;
  isFeatured: boolean;
  isPremium: boolean;
  isVerified: boolean;
  createdAt: string;
};

export async function fetchAdminListings(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  category?: string;
  isFeatured?: boolean;
  isPremium?: boolean;
  isVerified?: boolean;
}): Promise<{
  listings: AdminListingRowDto[];
  total: number;
  page: number;
  limit: number;
}> {
  const url = new URL('/api/admin/listings', getApiUrl() || 'http://local');
  if (params.page != null) url.searchParams.set('page', String(params.page));
  if (params.limit != null) url.searchParams.set('limit', String(params.limit));
  if (params.status) url.searchParams.set('status', params.status);
  if (params.search) url.searchParams.set('search', params.search);
  if (params.category) url.searchParams.set('category', params.category);
  if (params.isFeatured != null) url.searchParams.set('isFeatured', String(params.isFeatured));
  if (params.isPremium != null) url.searchParams.set('isPremium', String(params.isPremium));
  if (params.isVerified != null) url.searchParams.set('isVerified', String(params.isVerified));
  const { data } = await adminFetch<{
    listings: AdminListingRowDto[];
    total: number;
    page: number;
    limit: number;
  }>(url.pathname + url.search);
  return {
    listings: data?.listings ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
  };
}

export type PatchAdminListingPayload = {
  status?: 'draft' | 'pending' | 'active' | 'rejected' | 'suspended';
  rejectionReason?: { ar?: string; en?: string };
  isFeatured?: boolean;
  isPremium?: boolean;
  isVerified?: boolean;
};

export async function patchAdminListing(
  id: string,
  body: PatchAdminListingPayload,
): Promise<void> {
  await adminFetch(`/api/admin/listings/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteAdminListing(id: string): Promise<void> {
  await adminFetch(`/api/admin/listings/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export type AdminReviewRowDto = {
  _id: string;
  listingSlug: string;
  listingName: { ar: string; en: string };
  userEmail: string;
  title: string;
  status: string;
  createdAt: string;
};

export async function fetchAdminReviews(
  page = 1,
  limit = 20,
  status = 'pending',
): Promise<{
  reviews: AdminReviewRowDto[];
  total: number;
  page: number;
  limit: number;
}> {
  const url = new URL('/api/admin/reviews', getApiUrl() || 'http://local');
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  if (status) url.searchParams.set('status', status);
  const { data } = await adminFetch<{
    reviews: AdminReviewRowDto[];
    total: number;
    page: number;
    limit: number;
  }>(url.pathname + url.search);
  return {
    reviews: data?.reviews ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
  };
}

export async function patchAdminReviewStatus(
  id: string,
  body: { status: 'approved' | 'rejected'; moderationNote?: { ar?: string; en?: string } },
): Promise<void> {
  await adminFetch(`/api/admin/reviews/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export type AdminCategoryRowDto = {
  _id: string;
  slug: string;
  name: { ar: string; en: string };
  image?: string;
  order: number;
  isActive: boolean;
  listingCount: number;
};

export async function fetchAdminCategories(): Promise<AdminCategoryRowDto[]> {
  const { data } = await adminFetch<{ categories: AdminCategoryRowDto[] }>('/api/admin/categories');
  return data?.categories ?? [];
}

export async function createAdminCategory(body: {
  name: { ar: string; en: string };
  slug: string;
  image?: string;
  order?: number;
  isActive?: boolean;
}): Promise<AdminCategoryRowDto> {
  const { data } = await adminFetch<{ category: AdminCategoryRowDto }>('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!data?.category) throw new AdminApiError('Invalid response', 500);
  return data.category;
}

export async function patchAdminCategory(
  id: string,
  body: Partial<{
    name: { ar: string; en: string };
    slug: string;
    image: string | null;
    order: number;
    isActive: boolean;
  }>,
): Promise<AdminCategoryRowDto> {
  const { data } = await adminFetch<{ category: AdminCategoryRowDto }>(
    `/api/admin/categories/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
  if (!data?.category) throw new AdminApiError('Invalid response', 500);
  return data.category;
}

export async function deleteAdminCategory(id: string): Promise<void> {
  await adminFetch(`/api/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export type AdminSubscriptionRowDto = {
  _id: string;
  accessCode: string;
  status: string;
  userEmail: string;
  listingSlug: string;
  listingName: { ar: string; en: string };
  validUntil: string;
  createdAt: string;
};

export async function fetchAdminSubscriptions(
  page = 1,
  limit = 20,
  search?: string,
): Promise<{
  subscriptions: AdminSubscriptionRowDto[];
  total: number;
  page: number;
  limit: number;
}> {
  const url = new URL('/api/admin/subscriptions', getApiUrl() || 'http://local');
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  if (search?.trim()) url.searchParams.set('search', search.trim());
  const { data } = await adminFetch<{
    subscriptions: AdminSubscriptionRowDto[];
    total: number;
    page: number;
    limit: number;
  }>(url.pathname + url.search);
  return {
    subscriptions: data?.subscriptions ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
  };
}

export async function patchAdminSubscription(
  id: string,
  body: { status: 'active' | 'cancelled' },
): Promise<void> {
  await adminFetch(`/api/admin/subscriptions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export type AdminPaymentsSummaryDto = {
  totalTransactions: number;
  totalAmount: number;
  byPlan: Record<string, { count: number; amount: number }>;
};

export async function fetchAdminPaymentsSummary(): Promise<AdminPaymentsSummaryDto> {
  const { data } = await adminFetch<{ summary: AdminPaymentsSummaryDto }>(
    '/api/admin/payments/summary',
  );
  if (!data?.summary) throw new AdminApiError('Invalid response', 500);
  return data.summary;
}

export type AdminPaymentRowDto = {
  _id: string;
  userEmail: string;
  planKey: string;
  amount: number;
  currency: string;
  createdAt: string;
};

export async function fetchAdminPaymentTransactions(
  page = 1,
  limit = 20,
): Promise<{
  transactions: AdminPaymentRowDto[];
  total: number;
  page: number;
  limit: number;
}> {
  const url = new URL('/api/admin/payments/transactions', getApiUrl() || 'http://local');
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  const { data } = await adminFetch<{
    transactions: AdminPaymentRowDto[];
    total: number;
    page: number;
    limit: number;
  }>(url.pathname + url.search);
  return {
    transactions: data?.transactions ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
  };
}

export type AdminHomeContentDto = {
  featured: { _id: string; slug: string; name: { ar: string; en: string } }[];
  premium: { _id: string; slug: string; name: { ar: string; en: string } }[];
};

export async function fetchAdminHomeContent(): Promise<AdminHomeContentDto> {
  const { data } = await adminFetch<{ content: AdminHomeContentDto }>('/api/admin/content/home');
  return data?.content ?? { featured: [], premium: [] };
}

export type SiteSettingsDto = {
  maintenanceMode: boolean;
  allowRegistration: boolean;
  reviewsRequireModeration: boolean;
  defaultLanguage: 'ar' | 'en';
  announcementBanner?: { ar?: string; en?: string };
  updatedAt: string;
};

export async function fetchAdminSettings(): Promise<SiteSettingsDto> {
  const { data } = await adminFetch<{ settings: SiteSettingsDto }>('/api/admin/settings');
  if (!data?.settings) throw new AdminApiError('Invalid response', 500);
  return data.settings;
}

export async function patchAdminSettings(
  body: Partial<{
    maintenanceMode: boolean;
    allowRegistration: boolean;
    reviewsRequireModeration: boolean;
    defaultLanguage: 'ar' | 'en';
    announcementBanner: { ar?: string; en?: string } | null;
  }>,
): Promise<SiteSettingsDto> {
  const { data } = await adminFetch<{ settings: SiteSettingsDto }>('/api/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!data?.settings) throw new AdminApiError('Invalid response', 500);
  return data.settings;
}

export type AdminAuditRowDto = {
  _id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export async function fetchAdminAudit(
  page = 1,
  limit = 30,
  action?: string,
): Promise<{
  entries: AdminAuditRowDto[];
  total: number;
  page: number;
  limit: number;
}> {
  const url = new URL('/api/admin/audit', getApiUrl() || 'http://local');
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  if (action?.trim()) url.searchParams.set('action', action.trim());
  const { data } = await adminFetch<{
    entries: AdminAuditRowDto[];
    total: number;
    page: number;
    limit: number;
  }>(url.pathname + url.search);
  return {
    entries: data?.entries ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
  };
}
