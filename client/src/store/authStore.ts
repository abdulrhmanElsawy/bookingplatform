import { create } from 'zustand';

import { getMe } from '../features/auth/api/authApi';

export type UserLanguage = 'ar' | 'en';

export type SessionStatus = 'pending' | 'ready';

export interface SessionPreferences {
  language: UserLanguage;
  currency: string;
  notifications: { email: boolean; inApp: boolean };
}

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isEmailVerified: boolean;
  phone?: string;
  preferences?: SessionPreferences;
}

interface AuthState {
  sessionStatus: SessionStatus;
  isAuthenticated: boolean;
  user: SessionUser | null;
  setSession: (user: SessionUser | null) => void;
  clearSession: () => void;
  hydrateFromServer: () => Promise<void>;
}

function parsePreferences(raw: unknown): SessionPreferences | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const lang = o.language === 'en' ? 'en' : o.language === 'ar' ? 'ar' : undefined;
  if (!lang) return undefined;
  const currency = typeof o.currency === 'string' ? o.currency : 'SAR';
  const n = o.notifications;
  const notifications =
    n && typeof n === 'object'
      ? {
          email: Boolean((n as { email?: unknown }).email),
          inApp: Boolean((n as { inApp?: unknown }).inApp),
        }
      : { email: true, inApp: true };
  return { language: lang, currency, notifications };
}

export function mapApiUserToSession(
  raw: Record<string, unknown>,
): SessionUser | null {
  if (
    typeof raw.id !== 'string' ||
    typeof raw.email !== 'string' ||
    typeof raw.firstName !== 'string' ||
    typeof raw.lastName !== 'string' ||
    typeof raw.role !== 'string'
  ) {
    return null;
  }
  return {
    id: raw.id,
    email: raw.email,
    firstName: raw.firstName,
    lastName: raw.lastName,
    role: raw.role,
    isEmailVerified: Boolean(raw.isEmailVerified),
    phone: typeof raw.phone === 'string' ? raw.phone : undefined,
    preferences: parsePreferences(raw.preferences),
  };
}

let hydrateInFlight: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  sessionStatus: 'pending',
  isAuthenticated: false,
  user: null,

  setSession: (user) =>
    set({
      isAuthenticated: user !== null,
      user,
      sessionStatus: 'ready',
    }),

  clearSession: () =>
    set({
      isAuthenticated: false,
      user: null,
      sessionStatus: 'ready',
    }),

  hydrateFromServer: async () => {
    if (get().sessionStatus === 'ready') return Promise.resolve();
    if (hydrateInFlight) return hydrateInFlight;

    hydrateInFlight = (async () => {
      try {
        const raw = await getMe();
        const session = raw ? mapApiUserToSession(raw) : null;
        if (session) {
          set({ isAuthenticated: true, user: session, sessionStatus: 'ready' });
        } else {
          set({ isAuthenticated: false, user: null, sessionStatus: 'ready' });
        }
      } catch {
        set({ isAuthenticated: false, user: null, sessionStatus: 'ready' });
      } finally {
        hydrateInFlight = null;
      }
    })();

    return hydrateInFlight;
  },
}));
