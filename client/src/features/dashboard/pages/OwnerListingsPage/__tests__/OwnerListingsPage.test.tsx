import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { configurePublicEnv } from '../../../../../config/publicEnv';
import i18n from '../../../../../i18n';
import { useAuthStore } from '../../../../../store/authStore';
import { OwnerListingsPage } from '../OwnerListingsPage';

function jsonBody(body: object, ok = true, status = 200) {
  const text = JSON.stringify(body);
  return {
    ok,
    status,
    json: async () => body,
    text: async () => text,
  } as unknown as Response;
}

const listingsPayload = {
  listings: [
    {
      _id: 'abc123',
      slug: 'my-gym',
      name: { ar: 'صالتي', en: 'My Gym' },
      status: 'pending' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      category: { slug: 'gyms', name: { ar: 'أندية', en: 'Gyms' } },
    },
  ],
};

function renderPage(initialEntry = '/owner/listings') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/owner/listings" element={<OwnerListingsPage />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('OwnerListingsPage', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    configurePublicEnv({ apiUrl: 'http://localhost:5000' });
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    useAuthStore.setState({
      sessionStatus: 'ready',
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'owner@test.com',
        firstName: 'Gym',
        lastName: 'Owner',
        role: 'gym_owner',
        isEmailVerified: true,
      },
    });
  });

  afterEach(() => {
    cleanup();
    useAuthStore.getState().clearSession();
  });

  it('renders listings with status badge and edit link', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (String(url).includes('/api/dashboard/owner/listings')) {
        return Promise.resolve(jsonBody(listingsPayload));
      }
      return Promise.resolve(jsonBody({}, false, 404));
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('صالتي')).toBeInTheDocument();
    });
    expect(screen.getByTestId('listing-status-pending')).toHaveTextContent(/قيد المراجعة/);
    expect(screen.getByTestId('edit-listing-abc123')).toHaveAttribute(
      'href',
      '/owner/listings/abc123/edit',
    );
    expect(screen.getByTestId('add-venue-link')).toHaveAttribute('href', '/owner/listings/new');
  });

  it('shows welcome banner when location state has welcome', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (String(url).includes('/api/dashboard/owner/listings')) {
        return Promise.resolve(jsonBody({ listings: [] }));
      }
      return Promise.resolve(jsonBody({}, false, 404));
    });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter
            initialEntries={[{ pathname: '/owner/listings', state: { welcome: true } }]}
          >
            <Routes>
              <Route path="/owner/listings" element={<OwnerListingsPage />} />
            </Routes>
          </MemoryRouter>
        </I18nextProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('owner-welcome-banner')).toBeInTheDocument();
    });
  });
});
