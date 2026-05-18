import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { configurePublicEnv } from '../../../../../config/publicEnv';
import i18n from '../../../../../i18n';
import { useAuthStore } from '../../../../../store/authStore';
import { OwnerDashboardPage } from '../OwnerDashboardPage';

function jsonBody(body: object, ok = true, status = 200) {
  const text = JSON.stringify(body);
  return {
    ok,
    status,
    json: async () => body,
    text: async () => text,
  } as unknown as Response;
}

const overviewPayload = {
  overview: {
    totalViews: 120,
    totalContactClicks: 12,
    activeListings: 1,
    totalListings: 2,
    avgRating: 4,
    pendingReviews: 0,
    viewsThisMonth: 120,
    viewsChangePercent: null as number | null,
  },
};

function renderDashboard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/owner']}>
          <Routes>
            <Route path="/owner" element={<OwnerDashboardPage />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('OwnerDashboardPage', () => {
  beforeEach(async () => {
    configurePublicEnv({ apiUrl: 'http://localhost:4000' });
    globalThis.fetch = jest.fn();
    useAuthStore.getState().setSession({
      id: '1',
      email: 'g@example.com',
      firstName: 'G',
      lastName: 'O',
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
      if (url.includes('/api/dashboard/overview')) {
        return Promise.resolve(jsonBody(overviewPayload));
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

  it('shows total views in Arabic-Indic numerals when UI language is Arabic', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId('dash-total-views')).toHaveTextContent(/١٢٠/);
    });
    expect(screen.getByTestId('owner-plans-link')).toHaveAttribute('href', '/owner/plans');
    expect(screen.getByTestId('owner-plans-link')).toHaveTextContent('خطط الأسعار');
  });
});
