import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { useAuthStore } from '../../../../../store/authStore';
import { GuestRouteGuard } from '../GuestRouteGuard';

describe('GuestRouteGuard', () => {
  beforeEach(() => {
    useAuthStore.setState({
      sessionStatus: 'ready',
      isAuthenticated: false,
      user: null,
    });
  });

  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  it('renders children when session is ready and user is a guest', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRouteGuard>
                <div data-testid="guest-only">form</div>
              </GuestRouteGuard>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('guest-only')).toBeInTheDocument();
  });

  it('redirects to home when session is ready and user is authenticated', async () => {
    useAuthStore.setState({
      sessionStatus: 'ready',
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'a@b.com',
        firstName: 'A',
        lastName: 'B',
        role: 'user',
        isEmailVerified: true,
      },
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/" element={<div data-testid="home">home</div>} />
          <Route
            path="/login"
            element={
              <GuestRouteGuard>
                <div data-testid="guest-only">form</div>
              </GuestRouteGuard>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('home')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('guest-only')).not.toBeInTheDocument();
  });
});
