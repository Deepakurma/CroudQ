import { inferAsyncReturnType } from "@trpc/server";
import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { users } from "../db/schema";
import { verifyJwt } from "../utils/jwt";

const AUTH_COOKIE_NAMES = [
    "bunkezy_landlord_token",
    "bunkezy_resident_token",
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
        if (pathname.startsWith("/landlord") || pathname.startsWith("/admin")) {
            return "landlord";
        }
        if (pathname.startsWith("/resident")) {
            return "resident";
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

    const landlordTokenFromParsed = parsedCookies?.bunkezy_landlord_token?.trim() || null;
    const residentTokenFromParsed = parsedCookies?.bunkezy_resident_token?.trim() || null;
    const landlordTokenFromHeader = getNamedCookieFromHeader(req.headers.cookie, "bunkezy_landlord_token");
    const residentTokenFromHeader = getNamedCookieFromHeader(req.headers.cookie, "bunkezy_resident_token");

    const landlordToken = landlordTokenFromParsed || landlordTokenFromHeader;
    const residentToken = residentTokenFromParsed || residentTokenFromHeader;

    let cookieToken: string | null = null;
    if (landlordToken && residentToken) {
        if (landlordToken === residentToken) {
            cookieToken = landlordToken;
        } else {
            const intent = resolveCookieIntentFromReferer(req.headers.referer);
            if (intent === "landlord") {
                cookieToken = landlordToken;
            } else if (intent === "resident") {
                cookieToken = residentToken;
            } else if (roleHint === "RESIDENT") {
                cookieToken = residentToken;
            } else if (roleHint === "LANDLORD" || roleHint === "SUPER_ADMIN") {
                cookieToken = landlordToken;
            } else {
                cookieToken = getFirstValidToken([landlordToken, residentToken]);
            }
        }
    } else if (landlordToken || residentToken) {
        cookieToken = landlordToken || residentToken;
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
