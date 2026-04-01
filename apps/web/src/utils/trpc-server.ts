import { cookies } from 'next/headers';

import { type AppRouter } from '@croudq/backend';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

import { env } from '~/env';

const createCookieHeader = async () => {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
    .join('; ');
};

const createServerTrpcClient = async () => {
  const cookieHeader = await createCookieHeader();

  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${env.NEXT_PUBLIC_API_ENDPOINT}/trpc`,
        transformer: superjson,
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);

          if (cookieHeader) {
            headers.set('cookie', cookieHeader);
          }

          return fetch(input, {
            ...init,
            cache: 'no-store',
            headers
          });
        }
      })
    ]
  });
};

export const getServerAuthUser = async () => {
  const trpcClient = await createServerTrpcClient();
  return trpcClient.auth.me.query();
};

export const getServerAdminUser = async () => {
  const trpcClient = await createServerTrpcClient();
  return trpcClient.adminAuth.me.query();
};
