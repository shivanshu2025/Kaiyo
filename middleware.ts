import { NextResponse, type NextRequest } from 'next/server';

/**
 * Edge redirect for admin routes.
 *
 * This is a *UX* convenience only. A cookie can be read but not verified here,
 * because HMAC/database checks need the Node runtime and the database. The
 * authoritative check runs in `app/admin/(dashboard)/layout.tsx` and, for every
 * API route, in `backend/lib/guards.ts`. Therefore:
 *
 *  - a request with no cookie is redirected here for a better experience, and
 *  - a request with a forged cookie passes this layer and is then rejected by the
 *    layout or the route guard with a 401/403.
 *
 * No protected data is ever served on the strength of this check alone.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get('kaiyo-admin-token')?.value);

  if (pathname === '/admin/login') {
    if (hasSessionCookie) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  if (!hasSessionCookie) {
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