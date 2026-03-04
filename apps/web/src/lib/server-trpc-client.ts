import { type AppRouter } from '@bunkezy/backend';
import { createTRPCClient, httpBatchLink } from '@trpc/client';

const backendUrl =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_ENDPOINT ?? 'http://localhost:4000';

if (process.env.NODE_ENV === 'production' && !process.env.API_INTERNAL_URL) {
  throw new Error('API_INTERNAL_URL must be configured in production for server tRPC calls.');
}

type ServerTrpcClientOptions = {
  token?: string;
  propertyId?: string;
};

export const createServerTrpcClient = (options: ServerTrpcClientOptions = {}) => {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${backendUrl}/trpc`,
        headers() {
          const headers: Record<string, string> = {};
          if (options.token) {
            headers.authorization = `Bearer ${options.token}`;
          }
          if (options.propertyId) {
            headers['x-property-id'] = options.propertyId;
          }
          return headers;
        }
      })
    ]
  });
};
