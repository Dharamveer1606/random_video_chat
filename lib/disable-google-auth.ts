/**
 * This module disables Google authentication globally for the application
 * to prevent "client_id is required" errors.
 */

// Override any requires for the Google provider
try {
  // Force-disable Google auth by monkey-patching the Google provider
  if (typeof require !== 'undefined') {
    const originalRequire = require;
    (global as any).require = function(id: string) {
      if (id === 'next-auth/providers/google') {
        return {
          default: () => ({
            id: 'google-disabled',
            name: 'Google (Disabled)',
            type: 'credentials',
            credentials: {},
            authorize: () => null
          })
        };
      }
      return originalRequire(id);
    };
  }
} catch (error) {
  console.error('Failed to disable Google auth', error);
}

// Export a function to explicitly disable Google auth
export function disableGoogleAuth() {
  // This is a placeholder - the real disabling happens when this module is imported
  console.log('Google auth disabled');
} 