import { QueryClient } from "@tanstack/react-query";

/**
 * Standard TanStack Query client configured with resilient defaults for Chi Hội Manager
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error: any) => {
        // Never retry if rate-limited (HTTP 429) or unauthorized/forbidden/not found
        const status = error?.status || error?.statusCode || error?.code;
        const msg = String(error?.message || '').toLowerCase();
        if (
          status === 429 ||
          status === '429' ||
          msg.includes('429') ||
          msg.includes('rate limit') ||
          msg.includes('too many requests')
        ) {
          return false;
        }
        if (status === 401 || status === 403 || status === 404 || status === 'PGRST116') {
          return false;
        }
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
