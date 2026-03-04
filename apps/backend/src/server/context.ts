import { inferAsyncReturnType } from "@trpc/server";
import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { users } from "../db/schema";
import { verifyJwt } from "../utils/jwt";

const AUTH_COOKIE_NAMES = [
    "bunkezy_vendor_token",
    "bunkezy_tenant_token",
];

type CookieBag = Record<string, string | undefined>;

const getTokenFromCookieHeader = (cookieHeader?: string) => {
    if (!cookieHeader) return null;

    const cookieParts = cookieHeader.split(";").map((part) => part.trim());
    for (const part of cookieParts) {
        for (const cookieName of AUTH_COOKIE_NAMES) {
            if (!part.startsWith(`${cookieName}=`)) continue;
            const token = part.slice(`${cookieName}=`.length);
            return decodeURIComponent(token);
        }
    }

    return null;
};

const getNamedCookieFromHeader = (cookieHeader: string | undefined, cookieName: string) => {
    if (!cookieHeader) return null;

    const cookieParts = cookieHeader.split(";").map((part) => part.trim());
    for (const part of cookieParts) {
        if (!part.startsWith(`${cookieName}=`)) continue;
        const token = part.slice(`${cookieName}=`.length);
        return decodeURIComponent(token);
    }

    return null;
};

const resolveCookieIntentFromReferer = (referer?: string) => {
    if (!referer) return null;

    try {
        const pathname = new URL(referer).pathname;
        if (pathname.startsWith("/vendor") || pathname.startsWith("/admin")) {
            return "vendor";
        }
        if (pathname.startsWith("/tenant")) {
            return "tenant";
        }
    } catch {
        return null;
    }

    return null;
};

const getFirstValidToken = (candidates: Array<string | null>) => {
    for (const token of candidates) {
        if (!token) continue;
        const payload = verifyJwt(token);
        if (payload?.userId) {
            return token;
        }
    }
    return null;
};

export async function createContext({ req, res }: CreateFastifyContextOptions) {
    const authHeader = req.headers.authorization;
    const parsedCookies = (req as { cookies?: CookieBag }).cookies;
    const roleHint = parsedCookies?.bunkezy_role_hint?.trim();

    const vendorTokenFromParsed = parsedCookies?.bunkezy_vendor_token?.trim() || null;
    const tenantTokenFromParsed = parsedCookies?.bunkezy_tenant_token?.trim() || null;
    const vendorTokenFromHeader = getNamedCookieFromHeader(req.headers.cookie, "bunkezy_vendor_token");
    const tenantTokenFromHeader = getNamedCookieFromHeader(req.headers.cookie, "bunkezy_tenant_token");

    const vendorToken = vendorTokenFromParsed || vendorTokenFromHeader;
    const tenantToken = tenantTokenFromParsed || tenantTokenFromHeader;

    let cookieToken: string | null = null;
    if (vendorToken && tenantToken) {
        if (vendorToken === tenantToken) {
            cookieToken = vendorToken;
        } else {
            const intent = resolveCookieIntentFromReferer(req.headers.referer);
            if (intent === "vendor") {
                cookieToken = vendorToken;
            } else if (intent === "tenant") {
                cookieToken = tenantToken;
            } else if (roleHint === "RESIDENT") {
                cookieToken = tenantToken;
            } else if (roleHint === "VENDOR" || roleHint === "SUPER_ADMIN") {
                cookieToken = vendorToken;
            } else {
                cookieToken = getFirstValidToken([vendorToken, tenantToken]);
            }
        }
    } else if (vendorToken || tenantToken) {
        cookieToken = vendorToken || tenantToken;
    } else {
        cookieToken = getTokenFromCookieHeader(req.headers.cookie);
    }

    const bearerToken =
        authHeader && authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : null;
    const token = bearerToken || cookieToken;
    let user = null;

    if (token) {
        const payload = verifyJwt(token);

        if (payload && payload.userId) {
            const revoked = await db.query.revokedTokens.findFirst({
                where: (r, { and, eq, gt }) =>
                    and(
                        eq(r.jti, payload.jti),
                        gt(r.expiresAt, new Date()),
                    ),
            });
            if (revoked) {
                return { req, res, user: null, token: null };
            }

            const foundUser = await db.query.users.findFirst({
                where: eq(users.id, payload.userId),
            });
            if (foundUser) {
                user = foundUser;
            }
        }
    }

    return { req, res, user, token };
}

export type Context = inferAsyncReturnType<typeof createContext>;
