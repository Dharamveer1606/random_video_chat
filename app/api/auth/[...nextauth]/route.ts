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

/**
 * Very minimal NextAuth configuration with only Guest access
 * No Google provider to avoid "client_id is required" errors
 */
const handler = NextAuth({
  providers: [
    // ONLY Credentials provider with Guest access
    CredentialsProvider({
      name: "Guest",
      credentials: {},
      async authorize() {
        return {
          id: uuidv4(),
          name: `Guest-${Math.floor(Math.random() * 10000)}`,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  // Don't debug in production
  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };

