import { NextResponse } from 'next/server';

// Override the default providers route to only return credentials
export async function GET() {
  // Return a hardcoded object with ONLY credentials provider
  return NextResponse.json({
    credentials: {
      id: "credentials",
      name: "Guest Access",
      type: "credentials",
      signinUrl: "/api/auth/signin/credentials",
      callbackUrl: "/api/auth/callback/credentials"
    }
  });
} 