import { useEffect, useRef } from 'react';

import { useLanguage } from '../../../hooks/useLanguage';
import { useAuthStore } from '../../../store/authStore';

/**
 * Restores session from cookies via GET /api/auth/me (via auth store) and applies the user’s UI language.
 */
export function AuthBootstrap(): null {
  const { switchLanguage } = useLanguage();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void useAuthStore
      .getState()
      .hydrateFromServer()
      .then(() => {
        const user = useAuthStore.getState().user;
        const lang = user?.preferences?.language;
        if (lang === 'en' || lang === 'ar') {
          switchLanguage(lang);
        }
      });
  }, [switchLanguage]);

  return null;
}
