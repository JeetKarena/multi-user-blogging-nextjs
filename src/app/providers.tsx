// src/components/Providers.tsx
"use client";

import { trpc } from "@/utils/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import React from "react";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          // Prevent background refetching in production
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          refetchOnReconnect: false,
          // Cache data for 5 minutes
          staleTime: 5 * 60 * 1000,
          // Keep data in cache for 10 minutes
          gcTime: 10 * 60 * 1000,
          // Retry failed requests 3 times with exponential backoff
          retry: (failureCount, error) => {
            // Don't retry on 4xx errors (client errors)
            if (error instanceof Error && error.message.includes('4')) {
              return false;
            }
            return failureCount < 3;
          },
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
        mutations: {
          // Retry mutations once on failure
          retry: 1,
          retryDelay: 1000,
        },
      },
    })
  );

  const [trpcClient] = React.useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            const token =
              typeof window !== "undefined"
                ? localStorage.getItem("accessToken")
                : null;
            return token ? { authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
