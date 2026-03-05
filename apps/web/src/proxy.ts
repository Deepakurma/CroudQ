import { NextResponse } from 'next/server';

import {
  LANDLORD_AUTH_COOKIE_NAME,
  RESIDENT_AUTH_COOKIE_NAME,
  ROLE_HINT_COOKIE_NAME
} from '~/lib/auth-cookies';

import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLandlordProtectedPath = pathname.startsWith('/landlord') || pathname.startsWith('/admin');
  const isResidentProtectedPath = pathname.startsWith('/resident/status');

  if (!isLandlordProtectedPath && !isResidentProtectedPath) {
    return NextResponse.next();
  }

  const landlordToken = request.cookies.get(LANDLORD_AUTH_COOKIE_NAME)?.value;
  const residentToken = request.cookies.get(RESIDENT_AUTH_COOKIE_NAME)?.value;
  const roleHint = request.cookies.get(ROLE_HINT_COOKIE_NAME)?.value;

  if (isLandlordProtectedPath) {
    if (landlordToken) {
      if (pathname.startsWith('/admin') && roleHint !== 'SUPER_ADMIN') {
        const signInUrl = new URL('/auth', request.url);
        signInUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(signInUrl);
      }
      if (pathname.startsWith('/landlord') && roleHint === 'RESIDENT') {
        const signInUrl = new URL('/auth', request.url);
        signInUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(signInUrl);
      }
      return NextResponse.next();
    }

    const redirectTarget = `${pathname}${request.nextUrl.search}`;
    const signInUrl = new URL('/auth', request.url);
    signInUrl.searchParams.set('redirect', redirectTarget || '/landlord/onboarding');

    return NextResponse.redirect(signInUrl);
  }

  if (residentToken) {
    if (roleHint && roleHint !== 'RESIDENT') {
      const signInUrl = new URL('/resident/auth', request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  if (landlordToken) {
    const signInUrl = new URL('/resident/auth', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  const redirectTarget = `${pathname}${request.nextUrl.search}`;
  const signInUrl = new URL('/resident/auth', request.url);
  signInUrl.searchParams.set('redirect', redirectTarget || '/resident/status');

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ['/landlord/:path*', '/admin/:path*', '/resident/status']
};
