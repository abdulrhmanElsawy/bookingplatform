import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { configurePublicEnv } from '../../../../../config/publicEnv';
import i18n from '../../../../../i18n';
import { useAuthStore } from '../../../../../store/authStore';
import { OwnerReviewsPage } from '../OwnerReviewsPage';

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
  reviews: [
    {
      _id: 'rev1',
      listing: 'lid1',
      user: { _id: 'u1', firstName: 'Sam', lastName: 'Guest' },
      title: 'Great venue',
      content: 'Had a good workout.',
      visitDate: '2026-01-01',
      visitType: 'individual' as const,
      rating: { overall: 4.5, staff: 5, cleanliness: 5, facilities: 4, value: 4 },
      createdAt: '2026-01-10T10:00:00.000Z',
      listingInfo: {
        _id: 'lid1',
        slug: 'test-gym',
        name: { ar: 'صالة تجريبية', en: 'Test Gym' },
      },
    },
  ],
  total: 1,
  page: 1,
  limit: 40,
};

function renderOwnerReviews() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <OwnerReviewsPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('OwnerReviewsPage', () => {
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
    (globalThis.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : (input as Request).url;
      if (url.includes('/api/reviews/for-owner')) {
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

  it('renders dashboard title and listing name in Arabic', async () => {
    renderOwnerReviews();
    expect(
      screen.getByRole('heading', { level: 1, name: 'إدارة التقييمات' }),
    ).toBeInTheDocument();
    expect(screen.getByText('تقييمات الزوار المعتمدة لمنشآتك')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('owner-review-rev1')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'صالة تجريبية' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('اكتب ردك هنا...')).toBeInTheDocument();
  });

  it('renders dashboard title and listing name in English', async () => {
    await i18n.changeLanguage('en');
    document.documentElement.dir = 'ltr';
    renderOwnerReviews();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Reviews management' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Approved guest reviews for your venues')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('owner-review-rev1')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Test Gym' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write your reply here...')).toBeInTheDocument();
  });
});
