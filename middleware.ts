import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// List of public routes that do NOT require authentication
const PUBLIC_PATHS = ['/login', '/register', '/api/auth', '/_next', '/favicon.ico'];

export async function middleware(req: NextRequest) {
  // Allow public files and Next.js internals
  if (PUBLIC_PATHS.some((path) => req.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for a valid session token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    // Not authenticated: redirect to /login with callbackUrl
    // Also handle legacy '/auth/login' redirect
    if (req.nextUrl.pathname === '/auth/login') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated, allow request
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login|register).*)',
    '/', // Explicitly match the root path
  ],
};
