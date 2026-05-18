import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { configurePublicEnv } from '../../../../../config/publicEnv';
import i18n from '../../../../../i18n';
import { useAuthStore } from '../../../../../store/authStore';
import { PricingPlansPage } from '../PricingPlansPage';

function jsonBody(body: object, ok = true, status = 200) {
  const text = JSON.stringify(body);
  return {
    ok,
    status,
    json: async () => body,
    text: async () => text,
  } as unknown as Response;
}

const plansPayload = {
  plans: [
    { key: 'free' as const, price: 0, currency: 'SAR' },
    { key: 'basic' as const, price: 99, currency: 'SAR' },
    { key: 'pro' as const, price: 199, currency: 'SAR' },
    { key: 'enterprise' as const, price: 499, currency: 'SAR' },
  ],
};

const txPayload = {
  transactions: [
    {
      id: 'tx1',
      planKey: 'basic',
      amount: 99,
      currency: 'SAR',
      status: 'simulated',
      createdAt: '2026-01-10T10:00:00.000Z',
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
};

function renderPricing() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <PricingPlansPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('PricingPlansPage', () => {
  beforeEach(async () => {
    configurePublicEnv({ apiUrl: 'http://localhost:4000' });
    globalThis.fetch = jest.fn();
    useAuthStore.getState().setSession({
      id: '1',
      email: 'owner@b.com',
      firstName: 'O',
      lastName: 'W',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    (globalThis.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : (input as Request).url;
      if (url.includes('/api/payments/plans')) {
        return Promise.resolve(jsonBody(plansPayload));
      }
      if (url.includes('/api/payments/transactions')) {
        return Promise.resolve(jsonBody(txPayload));
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });
    await i18n.changeLanguage('ar');
    document.documentElement.dir = 'rtl';
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
    act(() => {
      useAuthStore.getState().clearSession();
    });
  });

  it('renders pricing title and plan cards in Arabic', async () => {
    renderPricing();
    expect(screen.getByRole('heading', { level: 1, name: 'خطط الأسعار' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('plan-card-free')).toBeInTheDocument();
    });
    expect(screen.getByTestId('plan-cta-pro')).toHaveAttribute('href', '/owner/plans/pro/checkout');
    await waitFor(() => {
      expect(screen.getByTestId('tx-row-tx1')).toBeInTheDocument();
    });
    expect(screen.getByTestId('tx-row-tx1')).toHaveTextContent('الأساسية');
    expect(screen.getByTestId('tx-row-tx1')).toHaveTextContent('محاكاة');
  });

  it('renders pricing title and status in English', async () => {
    await i18n.changeLanguage('en');
    document.documentElement.dir = 'ltr';
    renderPricing();
    expect(screen.getByRole('heading', { level: 1, name: 'Pricing plans' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('tx-row-tx1')).toBeInTheDocument();
    });
    expect(screen.getByTestId('tx-row-tx1')).toHaveTextContent('Basic');
    expect(screen.getByTestId('tx-row-tx1')).toHaveTextContent('Simulated');
  });
});
