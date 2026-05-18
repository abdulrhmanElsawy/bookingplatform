import { act, cleanup, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import i18n from '../../../i18n';
import { useAuthStore } from '../../../store/authStore';
import { Footer } from '../Footer';

function renderFooter() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('Footer', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
  });

  afterEach(() => {
    cleanup();
    useAuthStore.getState().clearSession();
  });

  it('renders column headings and copyright in Arabic', async () => {
    await act(async () => {
      await i18n.changeLanguage('ar');
    });
    document.documentElement.dir = 'rtl';
    renderFooter();
    expect(screen.getByTestId('site-footer')).toBeInTheDocument();
    expect(screen.getByTestId('brand-logo')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'استكشف' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'مدن شائعة' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'لأصحاب المنشآت' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'قانوني وتواصل' })).toBeInTheDocument();
    expect(screen.getByText(/© \d{4} Growth World\. جميع الحقوق محفوظة/)).toBeInTheDocument();
    expect(screen.queryByText('P1')).not.toBeInTheDocument();
  });

  it('renders column headings and social labels in English', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    document.documentElement.dir = 'ltr';
    renderFooter();
    expect(screen.getByRole('heading', { name: 'Explore' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Popular cities' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'For venue owners' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Legal & social' })).toBeInTheDocument();
    expect(screen.getByTestId('footer-social-x')).toBeInTheDocument();
    expect(screen.getByTestId('footer-social-instagram')).toBeInTheDocument();
    expect(screen.getByTestId('footer-social-x')).toHaveAccessibleName('X');
    expect(screen.getByTestId('footer-social-instagram')).toHaveAccessibleName('Instagram');
    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
    expect(screen.queryByText('P1')).not.toBeInTheDocument();
    expect(screen.getByTestId('footer-list-your-gym-cta')).toHaveAttribute('href', '/register');
    expect(screen.getByTestId('footer-list-your-gym-link')).toHaveAttribute('href', '/register');
  });

  it('links list your gym to new listing when authenticated', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
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
    renderFooter();
    expect(screen.getByTestId('footer-list-your-gym-cta')).toHaveAttribute(
      'href',
      '/owner/listings/new',
    );
    expect(screen.getByTestId('footer-list-your-gym-link')).toHaveAttribute(
      'href',
      '/owner/listings/new',
    );
  });
});
