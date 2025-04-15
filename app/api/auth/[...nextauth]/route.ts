// COMPLETELY MINIMAL NEXTAUTH IMPLEMENTATION
// NO GOOGLE PROVIDER AT ALL

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { v4 as uuidv4 } from "uuid";

// Create a simple credentials-only provider
const handler = NextAuth({
  providers: [
    // ONLY this one provider, nothing else
    CredentialsProvider({
      id: "credentials",
      name: "Guest",
      credentials: {},
      async authorize() {
        // Simple guest user
        return {
          id: uuidv4(),
          name: `Guest-${Math.floor(Math.random() * 10000)}`,
        };
      },
    }),
  ],
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "default-secret-for-development-only",
  debug: false,
  pages: { 
    signIn: "/",
    error: "/",
  },
});

export { handler as GET, handler as POST };

