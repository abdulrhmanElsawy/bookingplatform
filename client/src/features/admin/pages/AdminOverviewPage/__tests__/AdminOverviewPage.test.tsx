import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { configurePublicEnv } from '../../../../../config/publicEnv';
import i18n from '../../../../../i18n';
import { useAuthStore } from '../../../../../store/authStore';
import { AdminOverviewPage } from '../AdminOverviewPage';

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
    totalUsers: 12,
    totalListings: 5,
    pendingListings: 1,
    totalReviews: 20,
    pendingReviews: 2,
    newUsersToday: 1,
    newListingsToday: 0,
    actionRequiredCount: 3,
    pendingListingRows: [
      {
        _id: 'lid1',
        slug: 'gym-one',
        name: { ar: 'صالة واحد', en: 'Gym One' },
        ownerEmail: 'owner@example.com',
        status: 'pending',
        createdAt: '2026-01-10T10:00:00.000Z',
      },
    ],
  },
};

function renderAdminOverview() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <AdminOverviewPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('AdminOverviewPage', () => {
  beforeEach(async () => {
    configurePublicEnv({ apiUrl: 'http://localhost:4000' });
    globalThis.fetch = jest.fn();
    useAuthStore.getState().setSession({
      id: '1',
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
      if (url.includes('/api/admin/overview')) {
        return Promise.resolve(jsonBody(overviewPayload));
      }
      if (url.includes('/api/listings/') && url.includes('/status')) {
        return Promise.resolve(jsonBody({ listing: { _id: 'lid1' } }));
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

  it('renders pending listings table column headers in Arabic', async () => {
    renderAdminOverview();
    await waitFor(() => {
      expect(screen.getByTestId('admin-pending-table')).toBeInTheDocument();
    });
    const table = screen.getByTestId('admin-pending-table');
    const headerRow = within(table).getAllByRole('row')[0];
    expect(within(headerRow).getByText('الإعلان')).toBeInTheDocument();
    expect(within(headerRow).getByText('البريد (المالك)')).toBeInTheDocument();
    expect(within(headerRow).getByText('الحالة')).toBeInTheDocument();
    expect(within(headerRow).getByText('تاريخ الإرسال')).toBeInTheDocument();
    expect(within(headerRow).getByText('إجراءات')).toBeInTheDocument();
  });

  it('renders pending listings table column headers in English', async () => {
    await i18n.changeLanguage('en');
    document.documentElement.dir = 'ltr';
    renderAdminOverview();
    await waitFor(() => {
      expect(screen.getByTestId('admin-pending-table')).toBeInTheDocument();
    });
    const table = screen.getByTestId('admin-pending-table');
    const headerRow = within(table).getAllByRole('row')[0];
    expect(within(headerRow).getByText('Listing')).toBeInTheDocument();
    expect(within(headerRow).getByText('Owner email')).toBeInTheDocument();
    expect(within(headerRow).getByText('Status')).toBeInTheDocument();
    expect(within(headerRow).getByText('Submitted')).toBeInTheDocument();
    expect(within(headerRow).getByText('Actions')).toBeInTheDocument();
  });

  it('renders bilingual rejection reason labels in Arabic', async () => {
    renderAdminOverview();
    await waitFor(() => {
      expect(screen.getByTestId('admin-rejection-demo')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('سبب الرفض بالعربية')).toBeInTheDocument();
    expect(screen.getByLabelText('سبب الرفض بالإنجليزية')).toBeInTheDocument();
  });

  it('renders bilingual rejection reason labels in English', async () => {
    await i18n.changeLanguage('en');
    document.documentElement.dir = 'ltr';
    renderAdminOverview();
    await waitFor(() => {
      expect(screen.getByTestId('admin-rejection-demo')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Rejection reason (Arabic)')).toBeInTheDocument();
    expect(screen.getByLabelText('Rejection reason (English)')).toBeInTheDocument();
  });

  it('sends PATCH to approve a pending listing', async () => {
    const user = userEvent.setup();
    const fetchMock = globalThis.fetch as jest.Mock;
    renderAdminOverview();
    await waitFor(() => {
      expect(screen.getByTestId('admin-approve-lid1')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('admin-approve-lid1'));
    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(
        (c) =>
          typeof c[0] === 'string' &&
          c[0].includes('/api/listings/lid1/status') &&
          (c[1] as RequestInit | undefined)?.method === 'PATCH',
      );
      expect(patchCall).toBeDefined();
      expect((patchCall![1] as RequestInit).body).toBe(JSON.stringify({ status: 'active' }));
    });
  });

  it('sends PATCH to reject with bilingual reasons from modal', async () => {
    const user = userEvent.setup();
    const fetchMock = globalThis.fetch as jest.Mock;
    renderAdminOverview();
    await waitFor(() => {
      expect(screen.getByTestId('admin-reject-lid1')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('admin-reject-lid1'));
    await waitFor(() => {
      expect(screen.getByTestId('admin-reject-modal')).toBeInTheDocument();
    });
    await user.type(screen.getByTestId('admin-modal-rejection-ar'), 'نص عربي');
    await user.type(screen.getByTestId('admin-modal-rejection-en'), 'English text');
    await user.click(screen.getByTestId('admin-reject-submit'));
    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find((c) => {
        if (typeof c[0] !== 'string' || !c[0].includes('/status')) return false;
        const body = (c[1] as RequestInit | undefined)?.body;
        return typeof body === 'string' && body.includes('rejected');
      });
      expect(patchCall).toBeDefined();
      expect(JSON.parse(String((patchCall![1] as RequestInit).body))).toEqual({
        status: 'rejected',
        rejectionReason: { ar: 'نص عربي', en: 'English text' },
      });
    });
  });
});
