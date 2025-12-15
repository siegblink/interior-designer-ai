import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  // Check if user is authenticated - req.auth contains the session
  const isLoggedIn = !!req.auth?.user;

  // Public routes that don't require authentication
  const isOnLoginPage = pathname.startsWith("/login");
  const isOnPublicApiRoute = pathname.startsWith("/api/auth");

  // Allow public API routes (NextAuth endpoints)
  if (isOnPublicApiRoute) {
    return NextResponse.next();
  }

  // Handle login page
  if (isOnLoginPage) {
    // Redirect authenticated users away from login page
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // Allow unauthenticated users to access login page
    return NextResponse.next();
  }

  // Protect all other routes - require authentication
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow authenticated users to access protected routes
  return NextResponse.next();
});

export const config = {
  // Match all routes except static files and Next.js internals
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
