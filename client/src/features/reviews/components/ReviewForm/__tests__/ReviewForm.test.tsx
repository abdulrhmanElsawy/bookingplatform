import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import i18n from '../../../../../i18n';
import { useAuthStore } from '../../../../../store/authStore';
import { ReviewForm } from '../ReviewForm';

function renderForm(authed: boolean) {
  useAuthStore.getState().clearSession();
  if (authed) {
    useAuthStore.getState().setSession({
      id: '1',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
      role: 'user',
      isEmailVerified: true,
    });
  }
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/listings/gym']}>
          <ReviewForm listingSlug="gym" />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('ReviewForm', () => {
  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  it('shows Arabic dimension labels when language is Arabic', async () => {
    await i18n.changeLanguage('ar');
    document.documentElement.dir = 'rtl';
    renderForm(true);
    expect(screen.getByLabelText('تقييمك العام')).toBeInTheDocument();
    expect(screen.getByLabelText('الكادر والموظفون')).toBeInTheDocument();
    expect(screen.getByLabelText('النظافة')).toBeInTheDocument();
  });

  it('shows English dimension labels when language is English', async () => {
    await i18n.changeLanguage('en');
    document.documentElement.dir = 'ltr';
    renderForm(true);
    expect(screen.getByLabelText('Your overall rating')).toBeInTheDocument();
    expect(screen.getByLabelText('Staff')).toBeInTheDocument();
    expect(screen.getByLabelText('Cleanliness')).toBeInTheDocument();
  });

  it('prompts guests to sign in', async () => {
    await i18n.changeLanguage('en');
    renderForm(false);
    expect(screen.getByTestId('review-form-guest')).toBeInTheDocument();
    expect(screen.getByText('Sign in to write a review')).toBeInTheDocument();
  });
});
