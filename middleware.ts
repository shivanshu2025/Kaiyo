import { NextResponse, type NextRequest } from 'next/server';

const COOKIE_NAME = 'kaiyo-admin-token';

/**
 * Cheap structural check used at the edge for redirect UX only.
 * The authoritative, HMAC-verified check runs in the protected admin layout
 * (`app/admin/(dashboard)/layout.tsx`) using the same cookie, so a forged or
 * malformed token can never reach an admin page.
 */
function hasStructurallyValidToken(token?: string) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const exp = Number(parts[1]);
  return Number.isFinite(exp) && exp > Date.now();
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (pathname === '/admin/login') {
    if (hasStructurallyValidToken(token)) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  if (!hasStructurallyValidToken(token)) {
    const loginUrl = new URL('/admin/login', request.url);
    if (pathname !== '/admin') {
      loginUrl.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};