import jwt from "jsonwebtoken";

const getRequiredSecret = (key: "JWT_SECRET" | "JOIN_TOKEN_SECRET"): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
};

interface SignJwtPayload {
  userId: string;
}

interface JwtPayload {
  userId: string;
  jti: string;
  exp: number;
}

interface JoinSubmitTokenPayload {
  userId: string;
  phoneNumber: string;
  inviteCode: string;
  purpose: "JOIN_SUBMIT";
}

export const signJwt = (payload: SignJwtPayload): string => {
  const tokenTtl = (process.env.ACCESS_TOKEN_TTL ||
    "12h") as jwt.SignOptions["expiresIn"];
  const jti = crypto.randomUUID();
  return jwt.sign({ userId: payload.userId }, getRequiredSecret("JWT_SECRET"), {
    expiresIn: tokenTtl,
    jwtid: jti,
  });
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
      typeof decoded.exp !== "number"
    ) {
      return null;
    }
    return {
      userId: decoded.userId,
      jti: decoded.jti,
      exp: decoded.exp,
    };
  } catch {
    return null;
  }
};

export const signJoinSubmitToken = (
  payload: Omit<JoinSubmitTokenPayload, "purpose">,
): string => {
  return jwt.sign(
    {
      ...payload,
      purpose: "JOIN_SUBMIT",
    },
    getRequiredSecret("JOIN_TOKEN_SECRET"),
    { expiresIn: "10m" },
  );
};

export const verifyJoinSubmitToken = (
  token: string,
): JoinSubmitTokenPayload | null => {
  try {
    const payload = jwt.verify(
      token,
      getRequiredSecret("JOIN_TOKEN_SECRET"),
    ) as JoinSubmitTokenPayload;
    if (payload.purpose !== "JOIN_SUBMIT") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};
