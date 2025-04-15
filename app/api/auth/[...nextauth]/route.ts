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

// Create a minimal NextAuth handler that only uses credentials
const handler = NextAuth({
  // ONLY include the credentials provider
  providers: [
    CredentialsProvider({
      id: "credentials", // Keep ID as "credentials" for compatibility
      name: "Guest Access",
      credentials: {},
      async authorize() {
        const guestId = uuidv4();
        const guestName = `Guest-${Math.floor(Math.random() * 10000)}`;
        
        // Return a minimal user object
        return {
          id: guestId,
          name: guestName
        };
      },
    }),
  ],
  
  // Security settings
  secret: process.env.NEXTAUTH_SECRET,
  
  // JWT settings
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Callbacks for token and session handling
  callbacks: {
    async jwt({ token, user }) {
      // Store user info in token when signing in
      if (user) {
        token.userId = user.id;
        token.userName = user.name;
      }
      return token;
    },
    
    async session({ session, token }) {
      // Add token data to session
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.name = token.userName as string | null;
      }
      return session;
    },
  },
  
  // Custom pages
  pages: {
    signIn: '/',
    error: '/'
  },
  
  // Debug mode off for production
  debug: process.env.NODE_ENV === 'development',
  
  // Disable non-credentials auth types
  useSecureCookies: process.env.NODE_ENV === 'production',
  
  // Prevent error page redirects
  theme: {
    colorScheme: 'dark',
    brandColor: '#3182ce',
    logo: '',
  }
});

export { handler as GET, handler as POST };

