'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

/**
 * Custom providers wrapper with configuration to disable Google authentication
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // This effect will prevent any Google sign-in attempts on the client side
  useEffect(() => {
    // Override the signIn function globally
    const originalOpen = window.open;
    window.open = function(url, ...args) {
      // Block any Google auth URLs
      if (url && typeof url === 'string' && 
          (url.includes('google') || url.includes('accounts.google.com'))) {
        console.warn('Google authentication is disabled');
        return null;
      }
      return originalOpen(url, ...args);
    };
    
    return () => {
      window.open = originalOpen;
    };
  }, []);

  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
} 