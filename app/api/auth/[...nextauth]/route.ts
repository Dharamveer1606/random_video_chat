import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { v4 as uuidv4 } from 'uuid';

// Define custom types for TypeScript
declare module 'next-auth' {
  interface User {
    id: string;
    name?: string | null;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
    }
  }
}

// Attempt to monkey-patch NextAuth to prevent Google authentication
try {
  // @ts-ignore - Hack to prevent Google authentication
  global.NextAuthGoogleProvider = null;
} catch (e) {
  console.log("Failed to disable Google provider");
}

/**
 * This is a barebones NextAuth configuration with ONLY CredentialsProvider
 * to avoid "client_id is required" errors.
 */

// HACK: This overrides the next-auth provider list at runtime to filter out Google
// @ts-ignore - Intentionally modifying the internal list
const originalGetProviders = NextAuth.getProviders;
// @ts-ignore - Intentionally modifying the internal list
NextAuth.getProviders = () => {
  // Filter out any google provider
  const providers = originalGetProviders?.() || {};
  const filteredProviders = Object.fromEntries(
    Object.entries(providers).filter(([key]) => key !== "google")
  );
  return filteredProviders;
};

// Create a minimal NextAuth configuration
const handler = NextAuth({
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Guest",
      credentials: {},
      authorize() {
        return {
          id: uuidv4(),
          name: `Guest-${Math.floor(Math.random() * 10000)}`
        };
      }
    })
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
  pages: { signIn: "/" }
});

export { handler as GET, handler as POST };

