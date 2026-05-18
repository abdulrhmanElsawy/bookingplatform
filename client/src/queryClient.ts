import { QueryClient } from '@tanstack/react-query';

/** Shared TanStack Query defaults for fewer redundant refetches and steadier UX. */
export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        retry: 1,
        refetchOnWindowFocus: process.env.NODE_ENV !== 'production',
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
