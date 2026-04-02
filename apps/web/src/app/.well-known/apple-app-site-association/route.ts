import { NextResponse } from 'next/server';

import { getIosAppLinkConfig } from '~/lib/app-links';

export const dynamic = 'force-dynamic';

export async function GET() {
  const iosAppLinkConfig = getIosAppLinkConfig();

  return new NextResponse(
    JSON.stringify({
      applinks: {
        apps: [],
        details: iosAppLinkConfig ? [iosAppLinkConfig] : []
      }
    }),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=300'
      }
    }
  );
}
