import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { Header } from '../Header';
import { configurePublicEnv } from '../../../config/publicEnv';
import i18n from '../../../i18n';
import { useAuthStore } from '../../../store/authStore';

function jsonBody(body: object, ok = true, status = 200) {
  const text = JSON.stringify(body);
  return {
    ok,
    status,
    json: async () => body,
    text: async () => text,
  } as unknown as Response;
}

function renderHeader() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

function mockWideViewport() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query.includes('min-width'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

describe('Header notifications badge', () => {
  beforeEach(async () => {
    configurePublicEnv({ apiUrl: 'http://localhost:4000' });
    mockWideViewport();
    globalThis.fetch = jest.fn();
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

  it('shows unread count badge when user is signed in', async () => {
    useAuthStore.getState().setSession({
      id: '1',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
      role: 'user',
      isEmailVerified: true,
    });
    (globalThis.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (url.includes('/api/notifications/unread-count')) {
        return Promise.resolve(jsonBody({ unreadCount: 3 }));
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });

    renderHeader();

    await waitFor(() => {
      expect(screen.getByTestId('nav-notifications-badge')).toHaveTextContent('3');
    });
  });
});
