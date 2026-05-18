import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import { configurePublicEnv } from '../../../../../config/publicEnv';
import i18n from '../../../../../i18n';
import { useAuthStore } from '../../../../../store/authStore';
import { FavoriteButton } from '../FavoriteButton';

function jsonBody(body: object, ok = true, status = 200) {
  const text = JSON.stringify(body);
  return {
    ok,
    status,
    json: async () => body,
    text: async () => text,
  } as unknown as Response;
}

function renderFavoriteButton() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <FavoriteButton listingSlug="gym-x" />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('FavoriteButton', () => {
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
    (globalThis.fetch as jest.Mock).mockImplementation((input: RequestInfo) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/favorites/status')) {
        return Promise.resolve(jsonBody({ favorited: false }));
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });
    await i18n.changeLanguage('ar');
    document.documentElement.dir = 'rtl';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    useAuthStore.getState().clearSession();
  });

  it('uses Arabic tooltip title when not favorited', async () => {
    renderFavoriteButton();
    await waitFor(() => {
      expect(screen.getByTestId('favorite-button')).toHaveAttribute(
        'title',
        'تمت الإضافة إلى المفضلة',
      );
    });
  });

  it('uses English tooltip title when not favorited', async () => {
    await i18n.changeLanguage('en');
    document.documentElement.dir = 'ltr';
    (globalThis.fetch as jest.Mock).mockImplementation((input: RequestInfo) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/favorites/status')) {
        return Promise.resolve(jsonBody({ favorited: false }));
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });
    renderFavoriteButton();
    await waitFor(() => {
      expect(screen.getByTestId('favorite-button')).toHaveAttribute(
        'title',
        'Added to favorites',
      );
    });
  });
});
