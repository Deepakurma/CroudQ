import { type AppRouter } from '@bunkezy/backend';
import { QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';

import { env } from '../env';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false
    },
    mutations: {
      retry: false
    }
  }
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${env.NEXT_PUBLIC_API_ENDPOINT}/trpc`,
      fetch: (input, init) => {
        return fetch(input, { ...init, credentials: 'include' });
      }
    })
  ]
});

export const createPropertyScopedTrpcClient = (propertyId: string) =>
  createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${env.NEXT_PUBLIC_API_ENDPOINT}/trpc`,
        headers() {
          return { 'x-property-id': propertyId };
        },
        fetch: (input, init) => {
          return fetch(input, { ...init, credentials: 'include' });
        }
      })
    ]
  });

export const trpcHttp = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient
});
