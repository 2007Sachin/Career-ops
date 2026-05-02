import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 30 s by default; hooks override per-query
      staleTime: 30_000,
      // Never retry on 401/404 — those are user-visible errors, not transient
      retry: (count, err: unknown) => {
        const status = (err as { status?: number })?.status;
        if (status === 401 || status === 404) return false;
        return count < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Surface mutation errors via console so nothing is silently swallowed
      onError: (err) => console.error("[mutation error]", err),
    },
  },
});
