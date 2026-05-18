import { useNotificationsSocket } from '../hooks/useNotificationsSocket';

/** Mounts the Socket.IO client for in-app notifications when the user is authenticated. */
export function NotificationsSocketRoot(): null {
  useNotificationsSocket();
  return null;
}
