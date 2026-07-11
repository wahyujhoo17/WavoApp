import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // List of public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Skip middleware for static assets, next.js internals, and images
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Retrieve token from cookies
  const token = request.cookies.get('wavo_access_token')?.value;

  if (!token && !isPublicRoute && pathname !== '/') {
    // Redirect to login if user is unauthenticated and trying to access a protected route
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (token && (isPublicRoute || pathname === '/')) {
    // Redirect to dashboard if user is already authenticated and visiting public auth routes
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, etc (handled by includes('.') above, but kept here for clarity)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
