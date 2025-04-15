import { NextResponse } from 'next/server';

export function GET() {
  // Return only the credentials provider
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