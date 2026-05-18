import { getApiUrl } from '../../../config/publicEnv';
import i18n from '../../../i18n';

export class NotificationsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'NotificationsApiError';
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

export type NotificationDto = {
  id: string;
  type: string;
  title: { ar: string; en: string };
  body: { ar: string; en: string };
  read: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type NotificationsListResponse = {
  notifications: NotificationDto[];
  total: number;
  unreadCount: number;
  page: number;
  totalPages: number;
};

export async function getUnreadNotificationCount(): Promise<number> {
  const url = `${getApiUrl()}/api/notifications/unread-count`;
  const res = await fetch(url, {
    method: 'GET',
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const data = (await parseJson(res)) as { unreadCount?: unknown };
  if (!res.ok) {
    return 0;
  }
  return typeof data?.unreadCount === 'number' ? data.unreadCount : 0;
}

export async function fetchNotifications(page = 1, limit = 20): Promise<NotificationsListResponse> {
  const url = `${getApiUrl()}/api/notifications?page=${page}&limit=${limit}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const data = (await parseJson(res)) as NotificationsListResponse & { error?: unknown };
  if (!res.ok) {
    throw new NotificationsApiError(messageFromBody(data) || 'error', res.status);
  }
  if (!Array.isArray(data.notifications)) {
    throw new NotificationsApiError('Invalid response', res.status);
  }
  return {
    notifications: data.notifications,
    total: typeof data.total === 'number' ? data.total : 0,
    unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : 0,
    page: typeof data.page === 'number' ? data.page : page,
    totalPages: typeof data.totalPages === 'number' ? data.totalPages : 1,
  };
}

export async function markNotificationReadApi(id: string): Promise<NotificationDto> {
  const url = `${getApiUrl()}/api/notifications/${encodeURIComponent(id)}/read`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const data = (await parseJson(res)) as { notification?: NotificationDto };
  if (!res.ok) {
    throw new NotificationsApiError(messageFromBody(data) || 'error', res.status);
  }
  if (!data.notification) {
    throw new NotificationsApiError('Invalid response', res.status);
  }
  return data.notification;
}

export async function markAllNotificationsReadApi(): Promise<void> {
  const url = `${getApiUrl()}/api/notifications/mark-all-read`;
  const res = await fetch(url, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new NotificationsApiError(messageFromBody(data) || 'error', res.status);
  }
}

export async function deleteNotificationApi(id: string): Promise<void> {
  const url = `${getApiUrl()}/api/notifications/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new NotificationsApiError(messageFromBody(data) || 'error', res.status);
  }
}
