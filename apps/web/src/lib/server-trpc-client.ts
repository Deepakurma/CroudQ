import { type AppRouter } from '@bunkezy/backend';
import { createTRPCClient, httpBatchLink } from '@trpc/client';

const backendUrl = process.env.NEXT_PUBLIC_API_ENDPOINT ?? 'http://localhost:4000';

if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_ENDPOINT) {
  throw new Error('Set NEXT_PUBLIC_API_ENDPOINT in production for tRPC calls.');
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
