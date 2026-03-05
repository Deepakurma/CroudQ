import type { FastifyReply } from "fastify";

export const LANDLORD_AUTH_COOKIE_NAME = "bunkezy_landlord_token";
export const RESIDENT_AUTH_COOKIE_NAME = "bunkezy_resident_token";
export const ROLE_HINT_COOKIE_NAME = "bunkezy_role_hint";

type RoleHint = "SUPER_ADMIN" | "LANDLORD" | "RESIDENT";
type CookieReply = FastifyReply & {
    setCookie: (name: string, value: string, options: Record<string, unknown>) => void;
    clearCookie: (name: string, options: Record<string, unknown>) => void;
};

const getCookieDomain = () => {
    const value = process.env.AUTH_COOKIE_DOMAIN?.trim();
    return value && value.length > 0 ? value : undefined;
};

const getCookieMaxAgeSeconds = () => {
    const raw = Number(process.env.AUTH_COOKIE_MAX_AGE_SECONDS ?? "2592000");
    if (!Number.isFinite(raw) || raw <= 0) {
        return 60 * 60 * 24 * 30;
    }
    return Math.floor(raw);
};

const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
    path: "/",
    domain: getCookieDomain(),
});

const setAuthCookie = (reply: FastifyReply, name: string, value: string) => {
    (reply as CookieReply).setCookie(name, value, {
        ...getCookieOptions(),
        maxAge: getCookieMaxAgeSeconds(),
    });
};

const clearAuthCookie = (reply: FastifyReply, name: string) => {
    (reply as CookieReply).clearCookie(name, {
        ...getCookieOptions(),
    });
};

export const setLandlordAuthCookies = (
    reply: FastifyReply,
    token: string,
    role: "SUPER_ADMIN" | "LANDLORD",
) => {
    setAuthCookie(reply, LANDLORD_AUTH_COOKIE_NAME, token);
    clearAuthCookie(reply, RESIDENT_AUTH_COOKIE_NAME);
    setAuthCookie(reply, ROLE_HINT_COOKIE_NAME, role);
};

export const setResidentAuthCookies = (reply: FastifyReply, token: string) => {
    setAuthCookie(reply, RESIDENT_AUTH_COOKIE_NAME, token);
    clearAuthCookie(reply, LANDLORD_AUTH_COOKIE_NAME);
    setAuthCookie(reply, ROLE_HINT_COOKIE_NAME, "RESIDENT");
};

export const setRoleHintCookie = (reply: FastifyReply, role: RoleHint) => {
    setAuthCookie(reply, ROLE_HINT_COOKIE_NAME, role);
};

export const clearAllAuthCookies = (reply: FastifyReply) => {
    clearAuthCookie(reply, LANDLORD_AUTH_COOKIE_NAME);
    clearAuthCookie(reply, RESIDENT_AUTH_COOKIE_NAME);
    clearAuthCookie(reply, ROLE_HINT_COOKIE_NAME);
};
