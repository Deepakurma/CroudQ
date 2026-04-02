import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { env } from '~/env';

import type { NextRequest } from 'next/server';

const LOGIN_REDIRECT = '/auth/admin/login?redirect=/admin';

const createTrpcRequestBody = () =>
  JSON.stringify({
    0: {
      json: null
    }
  });

const getSafeRedirect = (value: string | null) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/admin';
  }

  return value;
};

const createPublicUrl = (path: string) => new URL(path, env.NEXT_PUBLIC_SITE_URL);

const responseHasTrpcError = async (response: Response) => {
  try {
    const payload = (await response.clone().json()) as
      | Array<{ error?: unknown }>
      | { error?: unknown };

    if (Array.isArray(payload)) {
      return payload.some((entry) => Boolean(entry?.error));
    }

    return Boolean(payload?.error);
  } catch {
    return false;
  }
};

export async function GET(request: NextRequest) {
  const redirectTo = getSafeRedirect(request.nextUrl.searchParams.get('redirect'));
  try {
    const cookieHeader = (await cookies())
      .getAll()
      .map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
      .join('; ');

    const response = await fetch(`${env.NEXT_PUBLIC_API_ENDPOINT}/trpc/adminAuth.refreshSession`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(cookieHeader ? { cookie: cookieHeader } : {})
      },
      body: createTrpcRequestBody(),
      cache: 'no-store'
    });

    if (!response.ok || (await responseHasTrpcError(response))) {
      return NextResponse.redirect(createPublicUrl(LOGIN_REDIRECT));
    }

    const nextResponse = NextResponse.redirect(createPublicUrl(redirectTo));
    const setCookieHeaders =
      typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : response.headers.get('set-cookie')
          ? [response.headers.get('set-cookie')!]
          : [];

    for (const value of setCookieHeaders) {
      nextResponse.headers.append('set-cookie', value);
    }

    return nextResponse;
  } catch {
    return NextResponse.redirect(createPublicUrl(LOGIN_REDIRECT));
  }
}
