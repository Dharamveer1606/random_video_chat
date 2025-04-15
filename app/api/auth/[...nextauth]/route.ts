import NextAuth, { AuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { v4 as uuidv4 } from 'uuid';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
  
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

interface AuthUser {
  id: string;
  name: string | null;
  email?: string | null;
  image?: string | null;
}

interface SessionUser {
  id: string;
  name: string | null;
  email?: string | null;
  image?: string | null;
}

interface Session {
  user: SessionUser;
}

// Configure NextAuth with authentication providers
const handler = NextAuth({
  providers: [
    // Only include Google provider if environment variables are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    // Add credentials provider for anonymous/guest access
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
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || '';
        session.user.name = token.name as string | null;
        session.user.image = token.picture as string | null;
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

