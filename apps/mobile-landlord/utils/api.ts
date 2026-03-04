import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@bunkezy/backend";
import Constants from "expo-constants";

export const trpc = createTRPCReact<AppRouter>();

/**
 * A wrapper for `fetch` that automatically adds the bearer token to the headers.
 * This is needed because `trpc`'s `httpBatchLink` doesn't support adding headers dynamically.
 */
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

export const createServerTrpcClient = (token?: string) =>
    createTRPCClient<AppRouter>({
        links: [
            httpBatchLink({
                url: `${getBaseUrl()}/trpc`,
                headers() {
                    return token ? { authorization: `Bearer ${token}` } : {};
                },
            }),
        ],
    });
