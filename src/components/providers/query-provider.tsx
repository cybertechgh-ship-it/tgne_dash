/**
 * src/components/providers/query-provider.tsx
 * TanStack Query provider — wraps the app with a shared QueryClient.
 * Must be a client component.
 */

'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { type ReactNode } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  // useState ensures the same client instance is used across re-renders,
  // preventing hydration mismatches in Next.js 15 / React 19.
  const [queryClient] = useState(() => getQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
