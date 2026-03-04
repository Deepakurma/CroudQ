import { NextResponse } from 'next/server';

import {
  ROLE_HINT_COOKIE_NAME,
  TENANT_AUTH_COOKIE_NAME,
  VENDOR_AUTH_COOKIE_NAME
} from '~/lib/auth-cookies';

import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isVendorProtectedPath = pathname.startsWith('/vendor') || pathname.startsWith('/admin');
  const isTenantProtectedPath = pathname.startsWith('/tenant/status');

  if (!isVendorProtectedPath && !isTenantProtectedPath) {
    return NextResponse.next();
  }

  const vendorToken = request.cookies.get(VENDOR_AUTH_COOKIE_NAME)?.value;
  const tenantToken = request.cookies.get(TENANT_AUTH_COOKIE_NAME)?.value;
  const roleHint = request.cookies.get(ROLE_HINT_COOKIE_NAME)?.value;

  if (isVendorProtectedPath) {
    if (vendorToken) {
      if (pathname.startsWith('/admin') && roleHint !== 'SUPER_ADMIN') {
        const signInUrl = new URL('/auth', request.url);
        signInUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(signInUrl);
      }
      if (pathname.startsWith('/vendor') && roleHint === 'RESIDENT') {
        const signInUrl = new URL('/auth', request.url);
        signInUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(signInUrl);
      }
      return NextResponse.next();
    }

    const redirectTarget = `${pathname}${request.nextUrl.search}`;
    const signInUrl = new URL('/auth', request.url);
    signInUrl.searchParams.set('redirect', redirectTarget || '/vendor/onboarding');

    return NextResponse.redirect(signInUrl);
  }

  if (tenantToken) {
    if (roleHint && roleHint !== 'RESIDENT') {
      const signInUrl = new URL('/tenant/auth', request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  if (vendorToken) {
    const signInUrl = new URL('/tenant/auth', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  const redirectTarget = `${pathname}${request.nextUrl.search}`;
  const signInUrl = new URL('/tenant/auth', request.url);
  signInUrl.searchParams.set('redirect', redirectTarget || '/tenant/status');

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ['/vendor/:path*', '/admin/:path*', '/tenant/status']
};
