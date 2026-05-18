import { type ReactNode, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../../../store/authStore';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { t } = useTranslation('auth');
  const sessionStatus = useAuthStore((s) => s.sessionStatus);
  const authed = useAuthStore((s) => s.isAuthenticated);
  const hydrateFromServer = useAuthStore((s) => s.hydrateFromServer);
  const navigate = useNavigate();
  const location = useLocation();
  const redirected = useRef(false);

  useEffect(() => {
    if (sessionStatus === 'pending') {
      void hydrateFromServer();
    }
  }, [sessionStatus, hydrateFromServer]);

  useEffect(() => {
    if (sessionStatus !== 'ready') return;
    if (authed) {
      redirected.current = false;
      return;
    }
    if (redirected.current) return;
    redirected.current = true;
    navigate('/login', {
      replace: true,
      state: {
        from: `${location.pathname}${location.search}`,
        authGuardMessage: t('sessionExpired'),
      },
    });
  }, [sessionStatus, authed, location.pathname, navigate, t]);

  if (sessionStatus === 'pending') {
    return null;
  }

  if (!authed) {
    return null;
  }
  return children;
}
