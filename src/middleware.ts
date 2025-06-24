import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // EARLY BYPASS for password reset routes
  const pathname = request.nextUrl.pathname.replace(/\/$/, '');
  if (['/forgot-password', '/reset-password'].includes(pathname)) {
    return NextResponse.next();
  }
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;
  const isApiAuth = pathname.startsWith('/api/auth');

  const isAuthPage = ['/login', '/register'].includes(pathname);
  const isPublicPage = [
    '/',
    '/about',
    '/pricing',
    '/login',
    '/register',
    '/forgot-password',
    '/forgot-password/',
    '/reset-password',
    '/reset-password/',
    // Add other public routes here
  ].includes(pathname) || isApiAuth;

  // Redirect to dashboard if user is authenticated and tries to access auth pages
  if (isAuthPage && isAuthenticated) {
    const res = NextResponse.redirect(new URL('/dashboard', request.url));
    res.headers.set('x-debug-pathname', pathname);
    res.headers.set('x-debug-auth', String(isAuthenticated));
    res.headers.set('x-debug-public', String(isPublicPage));
    res.headers.set('x-debug-api', String(isApiAuth));
    return res;
  }

  // Redirect to login if user is not authenticated and tries to access protected pages
  if (!isAuthenticated && !isPublicPage) {
    const callbackUrl = request.nextUrl.pathname + (request.nextUrl.search || '');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', callbackUrl);
    const res = NextResponse.redirect(loginUrl);
    res.headers.set('x-debug-pathname', pathname);
    res.headers.set('x-debug-auth', String(isAuthenticated));
    res.headers.set('x-debug-public', String(isPublicPage));
    res.headers.set('x-debug-api', String(isApiAuth));
    return res;
  }

  const response = NextResponse.next();
  response.headers.set('x-debug-pathname', pathname);
  response.headers.set('x-debug-auth', String(isAuthenticated));
  response.headers.set('x-debug-public', String(isPublicPage));
  response.headers.set('x-debug-api', String(isApiAuth));
  // Show if the normalized path matches the public array directly
  response.headers.set('x-debug-matched', String([
    '/',
    '/about',
    '/pricing',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password'
  ].includes(pathname)));
  return response;
}

export const config = {
  matcher: [
    // Exclude public routes from middleware
    '/((?!api|_next/static|_next/image|favicon.ico|forgot-password|reset-password|register|login|about|pricing|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
