import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import { 
  publicRoutes, 
  authRoutes, 
  apiAuthPrefix, 
  DEFAULT_LOGIN_REDIRECT 
} from "./routes";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  
  // Allow API auth routes to proceed
  if (isApiAuthRoute) {
    return NextResponse.next();
  }
  
  // If user is logged in and trying to access auth routes, redirect to default login redirect
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }
  
  // If user is not logged in and trying to access protected routes (not public routes)
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }
  
  // For logged-in users accessing protected routes, add custom headers if needed
  if (isLoggedIn && !isPublicRoute && !isAuthRoute) {
    const requestHeaders = new Headers(req.headers);
    
    // Extract context from URL for your inventory management system
    const pathSegments = nextUrl.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      const firstSegment = pathSegments[0];
      requestHeaders.set('x-current-section', firstSegment);
      
      // For warehouse/location context
      if (pathSegments.length > 1 && pathSegments[1]) {
        requestHeaders.set('x-current-context', pathSegments[1]);
      }
      
      // Add user info to headers if available
      if (req.auth?.user) {
        requestHeaders.set('x-user-id', req.auth.user.id);
        requestHeaders.set('x-user-role', req.auth.user.role);
        
        // Add user permissions as a header (useful for server components)
        if (req.auth.user.permissions && req.auth.user.permissions.length > 0) {
          const permissions = req.auth.user.permissions.map(p => p.permission).join(',');
          requestHeaders.set('x-user-permissions', permissions);
        }
      }
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // Allow the request to proceed normally
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};