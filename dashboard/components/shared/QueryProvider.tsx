"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { hydrateAuthFromCookies } from "@/features/auth/auth.store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    hydrateAuthFromCookies();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

