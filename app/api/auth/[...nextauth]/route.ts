import NextAuth from 'next-auth';
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

// Extremely simplified NextAuth configuration
const handler = NextAuth({
  providers: [
    // ONLY Credentials provider
    CredentialsProvider({
      id: "guest-credentials",
      name: "Guest Access",
      credentials: {},
      async authorize() {
        // Create a guest user with random name
        return {
          id: uuidv4(),
          name: `Guest-${Math.floor(Math.random() * 10000)}`
        };
      },
    }),
  ],
  // Required secret for JWT encryption
  secret: process.env.NEXTAUTH_SECRET,
  // JWT session configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Simple callbacks
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Fix the type issue by using type assertion
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  // Pages configuration
  pages: {
    signIn: '/',
    error: '/'
  },
});

export { handler as GET, handler as POST };

