import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { configurePublicEnv } from '../../../../../config/publicEnv';
import i18n from '../../../../../i18n';
import { useAuthStore } from '../../../../../store/authStore';
import { NotificationsPage } from '../NotificationsPage';

function jsonBody(body: object, ok = true, status = 200) {
  const text = JSON.stringify(body);
  return {
    ok,
    status,
    json: async () => body,
    text: async () => text,
  } as unknown as Response;
}

const listPayload = {
  notifications: [
    {
      id: 'n1',
      type: 'new_review',
      title: { ar: 'عنوان عربي', en: 'English title' },
      body: { ar: 'نص عربي', en: 'English body text' },
      read: false,
      metadata: {},
      createdAt: '2026-01-15T10:00:00.000Z',
    },
  ],
  total: 1,
  unreadCount: 1,
  page: 1,
  totalPages: 1,
};

function renderNotifications() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('NotificationsPage', () => {
  beforeEach(async () => {
    configurePublicEnv({ apiUrl: 'http://localhost:4000' });
    globalThis.fetch = jest.fn();
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
            : (input as Request).url;
      if (url.includes('/api/notifications/unread-count')) {
        return Promise.resolve(jsonBody({ unreadCount: 1 }));
      }
      if (url.includes('/api/notifications')) {
        return Promise.resolve(jsonBody(listPayload));
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

  it('renders notification title and body in Arabic when UI language is Arabic', async () => {
    renderNotifications();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'عنوان عربي' })).toBeInTheDocument();
    });
    expect(screen.getByText('نص عربي')).toBeInTheDocument();
  });

  it('renders notification title and body in English when UI language is English', async () => {
    await i18n.changeLanguage('en');
    document.documentElement.dir = 'ltr';
    renderNotifications();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'English title' })).toBeInTheDocument();
    });
    expect(screen.getByText('English body text')).toBeInTheDocument();
  });
});
