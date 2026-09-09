import { QueryClient } from "@tanstack/react-query";

/**
 * Shared QueryClient instance.
 *
 * Kept in its own module so that `lib/auth/auth-context.tsx` can import it
 * (to clear the cache on logout) without creating a circular dependency
 * with `components/providers.tsx`.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
