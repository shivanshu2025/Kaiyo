import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from './app/adminpanel/lib/auth';

const ADMIN_BASE_PATH = '/adminpanel';
const ADMIN_LOGIN_PATH = `${ADMIN_BASE_PATH}/login`;
const ADMIN_DASHBOARD_PATH = `${ADMIN_BASE_PATH}/dashboard`;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authenticated = cookieValue === 'true' || cookieValue === '1';


  if (pathname === ADMIN_BASE_PATH) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ADMIN_LOGIN_PATH;
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === ADMIN_LOGIN_PATH && authenticated) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = ADMIN_DASHBOARD_PATH;
    return NextResponse.redirect(dashboardUrl);
  }

  if (pathname.startsWith(ADMIN_DASHBOARD_PATH) && !authenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ADMIN_LOGIN_PATH;
    return NextResponse.redirect(loginUrl);
  }

  // Protect notification route
  if (pathname.startsWith(`${ADMIN_BASE_PATH}/notification`) && !authenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ADMIN_LOGIN_PATH;
    return NextResponse.redirect(loginUrl);
  }

  // Protect settings route
  if (pathname.startsWith(`${ADMIN_BASE_PATH}/settings`) && !authenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ADMIN_LOGIN_PATH;
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/adminpanel', '/adminpanel/login', '/adminpanel/dashboard/:path*', '/adminpanel/notification/:path*', '/adminpanel/settings/:path*', '/login'],
};
