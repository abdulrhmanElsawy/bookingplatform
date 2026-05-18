import { patchAccountType } from '../api/authApi';
import { mapApiUserToSession, useAuthStore } from '../../../store/authStore';

/** Promotes a regular user to gym_owner before owner venue flows. */
export async function ensureGymOwner(): Promise<void> {
  const { user, setSession } = useAuthStore.getState();
  if (!user || user.role === 'gym_owner' || user.role === 'admin' || user.role === 'super_admin') {
    return;
  }
  const res = await patchAccountType('gym_owner');
  const session = mapApiUserToSession(res.user);
  if (session) {
    setSession(session);
  }
}
