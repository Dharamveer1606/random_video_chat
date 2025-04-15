import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Middleware to intercept any Google authentication attempts
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const url = pathname + search;
  
  // Block any Google-related auth paths
  if (url.includes("google") || 
      url.includes("accounts.google.com") || 
      pathname.includes("/api/auth/signin") && pathname !== "/api/auth/signin/credentials") {
    // Redirect to home page
    return NextResponse.redirect(new URL("/", request.url));
  }
  
  // Special handling for providers endpoint
  if (pathname === "/api/auth/providers") {
    // Return only credentials provider in the response
    return NextResponse.json({
      credentials: {
        id: "credentials",
        name: "Guest Access",
        type: "credentials",
        signinUrl: "/api/auth/signin/credentials",
        callbackUrl: "/api/auth/callback/credentials",
      }
    });
  }
  
  // Continue with the request
  return NextResponse.next();
}

// Apply this middleware to all auth-related paths
export const config = {
  matcher: [
    "/api/auth/:path*",
    "/api/auth/providers",
  ],
}; 