import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { v4 as uuidv4 } from 'uuid';

// Define custom user type
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

// Ultra-simplified NextAuth configuration with only one provider
export const authOptions: AuthOptions = {
  providers: [
    // Only use credentials provider for guest access
    CredentialsProvider({
      id: 'credentials',
      name: 'Guest Access',
      credentials: {},
      async authorize() {
        // Create guest user with random ID and name
        return {
          id: uuidv4(),
          name: `Guest-${Math.floor(Math.random() * 10000)}`
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Store user ID in JWT token
      if (user) {
        token.sub = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID to session
      if (session.user) {
        session.user.id = token.sub || '';
        session.user.name = token.name || null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  logger: {
    error(code, metadata) {
      console.error(code, metadata);
    },
    warn(code) {
      console.warn(code);
    },
    debug(code, metadata) {
      console.debug(code, metadata);
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

