const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_TOKEN_REVOCATION_URL = "https://oauth2.googleapis.com/revoke";
const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.force-ssl",
].join(" ");

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

const getRequiredEnv = (
  key: "YOUTUBE_CLIENT_ID" | "YOUTUBE_CLIENT_SECRET" | "YOUTUBE_REDIRECT_URI",
) => {
  const value = process.env[key];
  if (!value) {
    throw new Error("YouTube integration is not configured yet");
  }

  return value;
};

export const buildYoutubeOAuthUrl = (stateToken: string) => {
  const params = new URLSearchParams({
    client_id: getRequiredEnv("YOUTUBE_CLIENT_ID"),
    redirect_uri: getRequiredEnv("YOUTUBE_REDIRECT_URI"),
    response_type: "code",
    scope: YOUTUBE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: stateToken,
  });

  return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
};

export const exchangeCodeForTokens = async (code: string) => {
  const body = new URLSearchParams({
    code,
    client_id: getRequiredEnv("YOUTUBE_CLIENT_ID"),
    client_secret: getRequiredEnv("YOUTUBE_CLIENT_SECRET"),
    redirect_uri: getRequiredEnv("YOUTUBE_REDIRECT_URI"),
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ||
        payload.error ||
        "Failed to exchange OAuth code",
    );
  }

  return payload;
};

export const isYoutubeAuthorizationRevokedError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("invalid_grant") ||
    message.includes("token has been expired or revoked") ||
    message.includes("revoked") ||
    message.includes("invalid_token")
  );
};

export const revokeYoutubeToken = async (token: string) => {
  const body = new URLSearchParams({ token });

  const response = await fetch(GOOGLE_TOKEN_REVOCATION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to revoke YouTube token");
  }
};

export const refreshYoutubeAccessToken = async (refreshToken: string) => {
  const body = new URLSearchParams({
    client_id: getRequiredEnv("YOUTUBE_CLIENT_ID"),
    client_secret: getRequiredEnv("YOUTUBE_CLIENT_SECRET"),
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ||
        payload.error ||
        "Failed to refresh access token",
    );
  }

  return payload;
};
