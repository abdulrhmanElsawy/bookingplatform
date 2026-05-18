import { useAuthStore } from '../store/authStore';

export const LIST_YOUR_GYM_REGISTER_PATH = '/register';
export const LIST_YOUR_GYM_NEW_PATH = '/owner/listings/new';

export function getListYourGymPath(isAuthenticated: boolean): string {
  return isAuthenticated ? LIST_YOUR_GYM_NEW_PATH : LIST_YOUR_GYM_REGISTER_PATH;
}

/** Guest → register; signed-in → new listing editor. */
export function useListYourGymPath(): string {
  const sessionStatus = useAuthStore((s) => s.sessionStatus);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (sessionStatus !== 'ready') {
    return LIST_YOUR_GYM_REGISTER_PATH;
  }

  return getListYourGymPath(isAuthenticated);
}
