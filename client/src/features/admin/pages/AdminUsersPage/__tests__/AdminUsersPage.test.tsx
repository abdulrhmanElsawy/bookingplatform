import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { configurePublicEnv } from '../../../../../config/publicEnv';
import i18n from '../../../../../i18n';
import { useAuthStore } from '../../../../../store/authStore';
import { AdminUsersPage } from '../AdminUsersPage';

function jsonBody(body: object, ok = true, status = 200) {
  const text = JSON.stringify(body);
  return {
    ok,
    status,
    json: async () => body,
    text: async () => text,
  } as unknown as Response;
}

const usersPayload = {
  users: [
    {
      _id: 'u1',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
      role: 'user',
      isActive: true,
      isEmailVerified: true,
      createdAt: '2026-01-10T10:00:00.000Z',
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
};

function renderUsers() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <AdminUsersPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('AdminUsersPage', () => {
  beforeEach(async () => {
    configurePublicEnv({ apiUrl: 'http://localhost:4000' });
    globalThis.fetch = jest.fn();
    useAuthStore.getState().setSession({
      id: 'admin1',
      email: 'admin@b.com',
      firstName: 'A',
      lastName: 'D',
      role: 'admin',
      isEmailVerified: true,
    });
    (globalThis.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : (input as Request).url;
      if (url.includes('/api/admin/users')) {
        return Promise.resolve(jsonBody(usersPayload));
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

  it('renders users table headers in Arabic', async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByTestId('admin-users-table')).toBeInTheDocument();
    });
    const table = screen.getByTestId('admin-users-table');
    const headerRow = within(table).getAllByRole('row')[0];
    expect(within(headerRow).getByText('البريد')).toBeInTheDocument();
    expect(within(headerRow).getByText('الاسم')).toBeInTheDocument();
    expect(within(headerRow).getByText('الدور')).toBeInTheDocument();
    expect(within(headerRow).getByText('الحالة')).toBeInTheDocument();
  });
});
