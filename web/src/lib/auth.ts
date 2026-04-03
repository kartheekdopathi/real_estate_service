import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const TOKEN_COOKIE_NAME = "res_token";
const JWT_EXPIRY = "7d";

type AuthTokenPayload = {
  userId: number;
  role: string;
};

type RawAuthTokenPayload = {
  userId?: number | string;
  role?: string;
};

function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET;

  if (!secret) {
    throw new Error("AUTH_JWT_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const verified = await jwtVerify(token, getJwtSecret());
    const payload = verified.payload as RawAuthTokenPayload;
    const normalizedUserId =
      typeof payload.userId === "number"
        ? payload.userId
        : typeof payload.userId === "string"
          ? Number(payload.userId)
          : NaN;

    if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0 || !payload.role) {
      return null;
    }

    return {
      userId: normalizedUserId,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export const authCookie = {
  name: TOKEN_COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: process.env.AUTH_COOKIE_SECURE === "true"
      ? true
      : process.env.AUTH_COOKIE_SECURE === "false"
        ? false
        : process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  },
};
