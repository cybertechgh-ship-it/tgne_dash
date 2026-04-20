/**
 * src/lib/query-client.ts
 * TanStack Query client configuration — singleton pattern for Next.js.
 * Handles caching, refetch behavior, and error retry logic.
 */

'use client';

import { QueryClient } from '@tanstack/react-query';

let queryClientInstance: QueryClient | undefined;

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 2 minutes — avoids redundant refetches
        staleTime: 2 * 60 * 1000,
        // Keep unused cache for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry once on failure with exponential backoff
        retry: 1,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
        // Refetch on window focus only when data is stale
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        // Surface mutation errors to the console in development
        onError: (error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('[TanStack Mutation Error]', error);
          }
        },
      },
    },
  });
}

/**
 * Returns the singleton QueryClient.
 * Creates it on first call (server-side creates a new one every time
 * to avoid cross-request state pollution).
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always create a new client (no singleton)
    return makeQueryClient();
  }

  // Browser: create once, reuse
  if (!queryClientInstance) {
    queryClientInstance = makeQueryClient();
  }
  return queryClientInstance;
}

/** Query key factory — centralises all cache keys to avoid typos */
export const queryKeys = {
  allData:     ['allData']           as const,
  clients:     ['clients']           as const,
  websites:    ['websites']          as const,
  credentials: ['credentials']       as const,
  tasks:       ['tasks']             as const,
  reminders:   ['reminders']         as const,
  payments:    ['payments']          as const,
  client:      (id: string) => ['client', id] as const,
} as const;
