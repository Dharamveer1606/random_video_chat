'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * Custom providers wrapper with configuration to disable Google authentication
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
} 