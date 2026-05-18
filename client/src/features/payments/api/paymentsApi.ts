import { getApiUrl } from '../../../config/publicEnv';
import i18n from '../../../i18n';

export class PaymentsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'PaymentsApiError';
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

export type PlanCatalogDto = {
  key: 'free' | 'basic' | 'pro' | 'enterprise';
  price: number;
  currency: string;
};

export const PAYMENT_PLAN_KEYS: PlanCatalogDto['key'][] = ['free', 'basic', 'pro', 'enterprise'];

export function isPaymentPlanKey(v: string | undefined): v is PlanCatalogDto['key'] {
  return v !== undefined && (PAYMENT_PLAN_KEYS as string[]).includes(v);
}

export async function fetchPaymentPlans(): Promise<PlanCatalogDto[]> {
  const base = getApiUrl();
  if (!base) {
    throw new PaymentsApiError('API URL is not configured', 0);
  }
  const res = await fetch(`${base}/api/payments/plans`, { headers: jsonHeaders() });
  const data = (await parseJson(res)) as { plans?: PlanCatalogDto[] };
  if (!res.ok) {
    throw new PaymentsApiError(messageFromBody(data) || 'error', res.status);
  }
  return data.plans ?? [];
}

export type SimulatedTransactionDto = {
  id: string;
  planKey: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

export async function postSimulateCheckout(planKey: string): Promise<SimulatedTransactionDto> {
  const base = getApiUrl();
  if (!base) {
    throw new PaymentsApiError('API URL is not configured', 0);
  }
  const res = await fetch(`${base}/api/payments/simulate`, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify({ planKey }),
  });
  const data = (await parseJson(res)) as { transaction?: SimulatedTransactionDto };
  if (!res.ok) {
    throw new PaymentsApiError(messageFromBody(data) || 'error', res.status);
  }
  if (!data.transaction) {
    throw new PaymentsApiError('Invalid response', res.status);
  }
  return data.transaction;
}

export type TransactionsListResponse = {
  transactions: SimulatedTransactionDto[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchMyPaymentTransactions(
  page = 1,
  limit = 20,
): Promise<TransactionsListResponse> {
  const base = getApiUrl();
  if (!base) {
    throw new PaymentsApiError('API URL is not configured', 0);
  }
  const url = new URL(`${base}/api/payments/transactions`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), {
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const data = (await parseJson(res)) as TransactionsListResponse | null;
  if (!res.ok) {
    throw new PaymentsApiError(messageFromBody(data) || 'error', res.status);
  }
  return {
    transactions: data?.transactions ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
  };
}
