import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { configurePublicEnv } from '../../../../../config/publicEnv';
import i18n from '../../../../../i18n';
import { useAuthStore } from '../../../../../store/authStore';
import { ProfilePage } from '../ProfilePage';

function jsonBody(body: object, ok = true, status = 200) {
  const text = JSON.stringify(body);
  return {
    ok,
    status,
    json: async () => body,
    text: async () => text,
  } as unknown as Response;
}

const baseMeUser = {
  id: '1',
  email: 'u@example.com',
  firstName: 'Ahmad',
  lastName: 'Ali',
  role: 'user',
  isEmailVerified: true,
  phone: '+966500000000',
  preferences: {
    language: 'ar',
    currency: 'SAR',
    notifications: { email: true, inApp: true },
  },
};

function renderProfile() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/account/profile']}>
          <Routes>
            <Route path="/account/profile" element={<ProfilePage />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('ProfilePage', () => {
  beforeEach(async () => {
    configurePublicEnv({ apiUrl: 'http://localhost:4000' });
    globalThis.fetch = jest.fn();
    useAuthStore.getState().setSession({
      id: '1',
      email: 'u@example.com',
      firstName: 'Ahmad',
      lastName: 'Ali',
      role: 'user',
      isEmailVerified: true,
      phone: '+966500000000',
      preferences: {
        language: 'ar',
        currency: 'SAR',
        notifications: { email: true, inApp: true },
      },
    });
    (globalThis.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (url.includes('/api/auth/me') && (!init?.method || init.method === 'GET')) {
        return Promise.resolve(jsonBody({ user: baseMeUser }, true, 200));
      }
      if (url.includes('/api/users/me/preferences') && init?.method === 'PATCH') {
        const parsed = init.body
          ? (JSON.parse(init.body as string) as Record<string, unknown>)
          : {};
        const mergedPrefs = {
          ...baseMeUser.preferences,
          ...(typeof parsed.language === 'string' ? { language: parsed.language } : {}),
          ...(parsed.notifications && typeof parsed.notifications === 'object'
            ? {
                notifications: {
                  ...baseMeUser.preferences.notifications,
                  ...(parsed.notifications as object),
                },
              }
            : {}),
        };
        return Promise.resolve(
          jsonBody({ user: { ...baseMeUser, preferences: mergedPrefs } }, true, 200),
        );
      }
      return Promise.reject(new Error(`unexpected fetch: ${url} ${init?.method ?? ''}`));
    });
    await i18n.changeLanguage('ar');
    document.documentElement.dir = 'rtl';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    useAuthStore.getState().clearSession();
  });

  it('shows Arabic profile form labels on My information', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByLabelText('الاسم الأول')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('اسم العائلة')).toBeInTheDocument();
    expect(screen.getByLabelText('رقم الجوال')).toBeInTheDocument();
  });

  it('shows English profile form labels when UI language is English', async () => {
    await i18n.changeLanguage('en');
    document.documentElement.dir = 'ltr';
    renderProfile();
    await waitFor(() => {
      expect(screen.getByLabelText('First name')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Last name')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone number')).toBeInTheDocument();
  });

  it('saves language preference and shows confirmation', async () => {
    const user = userEvent.setup();
    renderProfile();
    await waitFor(() => {
      expect(screen.getByLabelText('الاسم الأول')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'لغة التطبيق' }));
    await user.click(screen.getByRole('button', { name: 'الإنجليزية' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/language preference was saved/i);
    });
    expect(globalThis.fetch).toHaveBeenCalled();
    const calls = (globalThis.fetch as jest.Mock).mock.calls;
    const patchCalls = calls.filter(
      (c) =>
        typeof c[0] === 'string' &&
        c[0].includes('/api/users/me/preferences') &&
        (c[1] as RequestInit | undefined)?.method === 'PATCH',
    );
    expect(patchCalls.length).toBeGreaterThanOrEqual(1);
  });
});
