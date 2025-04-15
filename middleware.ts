import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Enhanced middleware to block ALL Google authentication attempts
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const url = pathname + search;
  
  // Block ANY path that could be related to Google auth
  if (
    url.includes("google") || 
    url.includes("accounts.google") || 
    pathname.includes("/api/auth/signin") && pathname !== "/api/auth/signin/credentials" ||
    pathname.includes("/api/auth/callback") && pathname !== "/api/auth/callback/credentials" ||
    pathname.includes("/api/auth/oauth")
  ) {
    console.log("Blocked Google auth request:", pathname);
    // Redirect to home page
    return NextResponse.redirect(new URL("/", request.url));
  }
  
  // Completely replace the providers endpoint response
  if (pathname === "/api/auth/providers") {
    console.log("Intercepted providers request");
    // Return ONLY the credentials provider
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

// Apply this middleware to ALL auth-related paths
export const config = {
  matcher: [
    "/api/auth/:path*",
  ],
}; 