import NextAuth, { AuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { v4 as uuidv4 } from 'uuid';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

// Simple NextAuth handler with only Guest access
const handler = NextAuth({
  providers: [
    // Use only credentials provider for anonymous/guest access
    CredentialsProvider({
      name: 'Guest Access',
      credentials: {},
      async authorize() {
        // Create anonymous user
        const user = {
          id: uuidv4(),
          name: `Guest-${Math.floor(Math.random() * 10000)}`,
        };
        return user;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || '';
        session.user.name = token.name as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
}) satisfies AuthOptions;

export { handler as GET, handler as POST };

