import { NextResponse } from 'next/server';

import { getAndroidAppLinkConfig } from '~/lib/app-links';

export const dynamic = 'force-dynamic';

export async function GET() {
  const androidAppLinkConfig = getAndroidAppLinkConfig();

  return NextResponse.json(androidAppLinkConfig ? [androidAppLinkConfig] : [], {
    headers: {
      'cache-control': 'public, max-age=300'
    }
  });
}
