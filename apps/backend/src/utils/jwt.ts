import jwt from "jsonwebtoken";

const getRequiredSecret = (key: "JWT_SECRET"): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
};

interface SignJwtPayload {
  userId: string;
  sessionId?: string;
}

interface JwtPayload {
  userId: string;
  jti: string;
  exp: number;
  sessionId: string | null;
}

export const signJwt = (payload: SignJwtPayload): string => {
  const tokenTtl = (process.env.ACCESS_TOKEN_TTL ||
    "15m") as jwt.SignOptions["expiresIn"];
  const jti = crypto.randomUUID();
  return jwt.sign(
    {
      userId: payload.userId,
      ...(payload.sessionId ? { sessionId: payload.sessionId } : {}),
    },
    getRequiredSecret("JWT_SECRET"),
    {
      expiresIn: tokenTtl,
      jwtid: jti,
    },
  );
};

export const verifyJwt = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(
      token,
      getRequiredSecret("JWT_SECRET"),
    ) as jwt.JwtPayload;
    if (
      !decoded ||
      typeof decoded.userId !== "string" ||
      typeof decoded.jti !== "string" ||
      typeof decoded.exp !== "number" ||
      ("sessionId" in decoded &&
        decoded.sessionId !== undefined &&
        decoded.sessionId !== null &&
        typeof decoded.sessionId !== "string")
    ) {
      return null;
    }
    return {
      userId: decoded.userId,
      jti: decoded.jti,
      exp: decoded.exp,
      sessionId: typeof decoded.sessionId === "string" ? decoded.sessionId : null,
    };
  } catch {
    return null;
  }
};
