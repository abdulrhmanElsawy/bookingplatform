import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { configurePublicEnv } from '../../../../../config/publicEnv';
import i18n from '../../../../../i18n';
import { useAuthStore } from '../../../../../store/authStore';
import { PaymentCheckoutPage } from '../PaymentCheckoutPage';

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

function renderCheckout(path = '/owner/plans/basic/checkout') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/owner/plans/:planKey/checkout" element={<PaymentCheckoutPage />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('PaymentCheckoutPage', () => {
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
    (globalThis.fetch as jest.Mock).mockImplementation(
      (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : (input as Request).url;
        if (url.includes('/api/payments/plans')) {
          return Promise.resolve(jsonBody(plansPayload));
        }
        if (url.includes('/api/payments/simulate') && init?.method === 'POST') {
          return Promise.resolve(
            jsonBody({
              transaction: {
                id: 'new1',
                planKey: 'basic',
                amount: 99,
                currency: 'SAR',
                status: 'simulated',
                createdAt: '2026-01-11T12:00:00.000Z',
              },
            }),
          );
        }
        return Promise.reject(new Error(`unexpected fetch: ${url}`));
      },
    );
    await i18n.changeLanguage('en');
    document.documentElement.dir = 'ltr';
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
    act(() => {
      useAuthStore.getState().clearSession();
    });
  });

  it('submits simulated checkout and shows success', async () => {
    const user = userEvent.setup();
    renderCheckout();
    await waitFor(() => {
      expect(screen.getByTestId('checkout-card')).toBeInTheDocument();
    });
    await user.type(screen.getByTestId('checkout-card'), '4242424242424242');
    await user.type(screen.getByTestId('checkout-expiry'), '12/30');
    await user.type(screen.getByTestId('checkout-cvv'), '123');
    await user.click(screen.getByTestId('checkout-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('checkout-success')).toBeInTheDocument();
    });
    expect(screen.getByText('Payment successful!')).toBeInTheDocument();
  });
});
