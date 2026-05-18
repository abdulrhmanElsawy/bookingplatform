import { render, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import i18n from '../../../../../i18n';
import { useAuthStore } from '../../../../../store/authStore';
import { AuthGuard } from '../AuthGuard';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/account/demo',
    search: '',
    hash: '',
    state: null,
    key: 'k',
  }),
}));

describe('AuthGuard', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('ar');
    useAuthStore.getState().clearSession();
    mockNavigate.mockClear();
  });

  it('redirects to login with translated message when unauthenticated', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AuthGuard>
          <div data-testid="secret">x</div>
        </AuthGuard>
      </I18nextProvider>,
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        replace: true,
        state: {
          from: '/account/demo',
          authGuardMessage: 'انتهت الجلسة، سجّل الدخول مجدداً',
        },
      });
    });
  });
});
