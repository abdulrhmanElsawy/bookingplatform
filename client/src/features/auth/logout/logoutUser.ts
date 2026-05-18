import { postLogout } from '../api/authApi';
import { useAuthStore } from '../../../store/authStore';

/**
 * Calls logout API (clears httpOnly cookies server-side), then clears client auth state.
 * On API failure, still clears local session so the UI cannot stay stuck as "logged in".
 */
export async function logoutUser(): Promise<void> {
  try {
    await postLogout();
  } catch (err) {
    console.error(err);
  } finally {
    useAuthStore.getState().clearSession();
  }
}
