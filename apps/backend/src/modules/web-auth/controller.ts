const ACCESS_TOKEN_COOKIE = "auth_token";
const REFRESH_TOKEN_COOKIE = "web_refresh_token";
const DEFAULT_ACCESS_TOKEN_TTL = "15m";
const DEFAULT_REFRESH_TOKEN_TTL = "30d";

const parseDurationToSeconds = (value: string) => {
  const match = value.trim().match(/^(\d+)([mhd])$/i);
  if (!match) {
    throw new Error(`Unsupported duration format: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const unitSeconds = unit === "m" ? 60 : unit === "h" ? 60 * 60 : 24 * 60 * 60;
  return amount * unitSeconds;
};

const getCookieOptions = () => ({
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
});

export const getWebRefreshTokenFromCookies = (req: unknown) =>
  (
    (req as { cookies?: Record<string, string | undefined> }).cookies ?? {}
  )[REFRESH_TOKEN_COOKIE]?.trim() || null;

export const setWebAuthCookies = (
  reply: unknown,
  session: {
    accessToken: string;
    refreshToken: string;
  },
) => {
  const fastifyReply = reply as {
    setCookie?: (name: string, value: string, options: Record<string, unknown>) => void;
  };
  if (!fastifyReply.setCookie) return;

  const accessTokenMaxAge = parseDurationToSeconds(
    process.env.ACCESS_TOKEN_TTL?.trim() || DEFAULT_ACCESS_TOKEN_TTL,
  );
  const refreshTokenMaxAge = parseDurationToSeconds(
    process.env.REFRESH_TOKEN_TTL?.trim() || DEFAULT_REFRESH_TOKEN_TTL,
  );

  fastifyReply.setCookie(ACCESS_TOKEN_COOKIE, session.accessToken, {
    ...getCookieOptions(),
    maxAge: accessTokenMaxAge,
  });
  fastifyReply.setCookie(REFRESH_TOKEN_COOKIE, session.refreshToken, {
    ...getCookieOptions(),
    maxAge: refreshTokenMaxAge,
  });
};

export const clearWebAuthCookies = (reply: unknown) => {
  const fastifyReply = reply as {
    clearCookie?: (name: string, options?: Record<string, unknown>) => void;
  };
  if (!fastifyReply.clearCookie) return;

  fastifyReply.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
  fastifyReply.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/" });
};
