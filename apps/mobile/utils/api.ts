import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@croudq/backend";
import Constants from "expo-constants";
import SuperJSON from "superjson";

export const getBaseUrl = () => {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  // In dev, we want to use the local IP address so that we can test on a real device
  const localhost = "http://localhost:4000";
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const [ip] = debuggerHost.split(":");
    return `http://${ip}:4000`;
  }

  return localhost;
};

type AuthTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

type RefreshHandler = (
  refreshToken: string,
) => Promise<AuthTokens | null>;

let authTokens: AuthTokens = {
  accessToken: null,
  refreshToken: null,
};
let refreshHandler: RefreshHandler | null = null;
let refreshPromise: Promise<boolean> | null = null;

export const setAuthTokens = (tokens: AuthTokens) => {
  authTokens = tokens;
};

export const registerAuthRefreshHandler = (handler: RefreshHandler | null) => {
  refreshHandler = handler;
};

const shouldSkipRefreshRetry = (input: RequestInfo | URL) => {
  const value = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  return value.includes("auth.refreshSession");
};

const refreshAccessToken = async () => {
  if (!authTokens.refreshToken || !refreshHandler) {
    return false;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const nextTokens = await refreshHandler?.(authTokens.refreshToken!);
      return Boolean(nextTokens?.accessToken && nextTokens.refreshToken);
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

const payloadHasUnauthorizedError = (payload: unknown): boolean => {
  if (Array.isArray(payload)) {
    return payload.some(payloadHasUnauthorizedError);
  }

  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as {
    error?: {
      data?: {
        code?: unknown;
      };
    };
  };

  return candidate.error?.data?.code === "UNAUTHORIZED";
};

const responseHasUnauthorizedError = async (response: Response) => {
  try {
    const payload = (await response.clone().json()) as unknown;
    return payloadHasUnauthorizedError(payload);
  } catch {
    return false;
  }
};

const createHttpBatchLink = () =>
  httpBatchLink({
    url: `${getBaseUrl()}/trpc`,
    headers() {
      const headers: Record<string, string> = {};
      if (authTokens.accessToken) {
        headers.authorization = `Bearer ${authTokens.accessToken}`;
      }
      return headers;
    },
    fetch: async (input, init) => {
      const response = await fetch(input, init);
      if (shouldSkipRefreshRetry(input)) {
        return response;
      }

      const shouldRefresh =
        response.status === 401 || (await responseHasUnauthorizedError(response));
      if (!shouldRefresh) {
        return response;
      }

      const refreshed = await refreshAccessToken();
      if (!refreshed || !authTokens.accessToken) {
        return response;
      }

      const nextHeaders = new Headers(init?.headers);
      nextHeaders.set("authorization", `Bearer ${authTokens.accessToken}`);

      return fetch(input, {
        ...init,
        headers: nextHeaders,
      });
    },
    transformer: SuperJSON,
  });

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [createHttpBatchLink()],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
