import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { configurePublicEnv } from '../../../config/publicEnv';
import i18n from '../../../i18n';
import { useAuthStore } from '../../../store/authStore';
import { Header } from '../Header';

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

function mockWideViewport(wide = true) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: wide && query.includes('min-width'),
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

function mockNarrowViewport() {
  mockWideViewport(false);
}

describe('Header', () => {
  beforeEach(async () => {
    configurePublicEnv({ apiUrl: 'http://localhost:4000' });
    mockWideViewport();
    await act(async () => {
      await i18n.changeLanguage('ar');
    });
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    document.documentElement.setAttribute('data-lang', 'ar');
    useAuthStore.getState().clearSession();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders search nav label in Arabic on desktop layout', () => {
    renderHeader();
    const links = screen.getAllByRole('link', { name: 'بحث' });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('nav-search')).toHaveTextContent('بحث');
  });

  it('renders search nav label in English after language switch', async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByTestId('lang-en'));
    expect(screen.getByTestId('nav-search')).toHaveTextContent('Search');
  });

  it('updates document dir when switching language with header controls', async () => {
    const user = userEvent.setup();
    renderHeader();
    expect(document.documentElement.dir).toBe('rtl');
    await user.click(screen.getByTestId('lang-en'));
    await act(async () => {});
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
    await user.click(screen.getByTestId('lang-ar'));
    await act(async () => {});
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
  });

  it('exposes aria-pressed on the active language toggle', async () => {
    const user = userEvent.setup();
    renderHeader();
    expect(screen.getByTestId('lang-ar')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('lang-en')).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByTestId('lang-en'));
    expect(screen.getByTestId('lang-ar')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('lang-en')).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows auth skeleton while session is pending', async () => {
    const spy = jest
      .spyOn(useAuthStore.getState(), 'hydrateFromServer')
      .mockImplementation(() => new Promise<void>(() => {}));
    useAuthStore.setState({
      sessionStatus: 'pending',
      isAuthenticated: false,
      user: null,
    });
    renderHeader();
    expect(screen.getByTestId('nav-auth-skeleton')).toBeInTheDocument();
    spy.mockRestore();
    await act(async () => {
      useAuthStore.getState().clearSession();
    });
  });

  it('shows sign-in and register for a ready guest session', () => {
    renderHeader();
    expect(screen.getByTestId('nav-login')).toBeInTheDocument();
    expect(screen.getByTestId('nav-register')).toBeInTheDocument();
    expect(screen.queryByTestId('nav-user-menu-trigger')).not.toBeInTheDocument();
  });

  it('opens mobile drawer when menu toggle is clicked (RTL)', async () => {
    mockNarrowViewport();
    const user = userEvent.setup();
    renderHeader();
    const toggle = screen.getByTestId('header-menu-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    const drawer = screen.getByTestId('header-mobile-drawer');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(drawer.className).toMatch(/drawerOpen/);
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByTestId('header-drawer-backdrop')).toBeInTheDocument();
    mockWideViewport(true);
  });

  it('links list your gym to register when guest', async () => {
    mockWideViewport();
    renderHeader();
    await waitFor(() => {
      expect(screen.getByTestId('nav-list-your-gym')).toHaveAttribute('href', '/register');
    });
  });

  it('links list your gym to new listing when authenticated', async () => {
    mockWideViewport();
    useAuthStore.setState({
      sessionStatus: 'ready',
      isAuthenticated: true,
      user: {
        id: 'u1',
        email: 'owner@test.com',
        firstName: 'O',
        lastName: 'W',
        role: 'gym_owner',
        isEmailVerified: true,
      },
    });
    renderHeader();
    expect(screen.getByTestId('nav-list-your-gym')).toHaveAttribute('href', '/owner/listings/new');
    useAuthStore.getState().clearSession();
  });

  it('shows user menu when authenticated', async () => {
    const prevFetch = globalThis.fetch;
    globalThis.fetch = jest.fn((input: RequestInfo | URL) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (url.includes('/api/notifications/unread-count')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ unreadCount: 0 }),
          text: async () => '{"unreadCount":0}',
        } as unknown as Response);
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });

    useAuthStore.getState().setSession({
      id: '1',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
      role: 'user',
      isEmailVerified: true,
    });

    try {
      renderHeader();

      await waitFor(() => {
        expect(screen.getByTestId('nav-user-menu-trigger')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('nav-login')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-register')).not.toBeInTheDocument();
    } finally {
      globalThis.fetch = prevFetch;
      await act(async () => {
        useAuthStore.getState().clearSession();
      });
    }
  });
});
