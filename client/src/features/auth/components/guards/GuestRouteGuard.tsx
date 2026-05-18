import { type ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuthStore } from '../../../../store/authStore';

interface GuestRouteGuardProps {
  children: ReactNode;
}

/**
 * For /login and /register: wait for session hydration, then redirect authed users to home.
 * While pending, children are not rendered (avoids flashing the guest auth form).
 */
export function GuestRouteGuard({ children }: GuestRouteGuardProps) {
  const sessionStatus = useAuthStore((s) => s.sessionStatus);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrateFromServer = useAuthStore((s) => s.hydrateFromServer);

  useEffect(() => {
    if (sessionStatus === 'pending') {
      void hydrateFromServer();
    }
  }, [sessionStatus, hydrateFromServer]);

  if (sessionStatus === 'pending') {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
