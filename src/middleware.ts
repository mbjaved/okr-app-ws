import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isPublicPage = [
    '/',
    '/about',
    '/pricing',
    // Add other public routes here
  ].includes(request.nextUrl.pathname);

  // Redirect to dashboard if user is authenticated and tries to access auth pages
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect to login if user is not authenticated and tries to access protected pages
  if (!isAuthenticated && !isPublicPage) {
    const callbackUrl = request.nextUrl.pathname + (request.nextUrl.search || '');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
