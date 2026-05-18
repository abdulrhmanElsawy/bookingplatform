import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';

import { getApiUrl, getSocketUrl } from '../config/publicEnv';
import { useAuthStore } from '../store/authStore';

/**
 * Subscribes to real-time notification events and refreshes React Query caches.
 * Uses `VITE_SOCKET_URL` when set, else API origin when `VITE_API_URL` is set, else same-origin + Vite proxy.
 */
export function useNotificationsSocket(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const explicit = getSocketUrl();
    const api = getApiUrl();
    const target = explicit.length > 0 ? explicit : api.length > 0 ? api : undefined;
    const socket = target
      ? io(target, {
          path: '/socket.io/',
          withCredentials: true,
          transports: ['websocket', 'polling'],
        })
      : io({
          path: '/socket.io/',
          withCredentials: true,
          transports: ['websocket', 'polling'],
        });

    socket.on('notification:new', () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, queryClient]);
}
