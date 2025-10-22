// src/lib/auth/jwt.ts
import * as jwt from "jsonwebtoken";
import { JWT_CONFIG } from "./config";
import { AuthenticationError } from "@/lib/utils/errors";

export interface JwtPayload {
  userId: string;
  role: "user" | "editor" | "admin";
}

// Sign Access Token
export const signAccessToken = (payload: JwtPayload): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (jwt as any).sign(payload, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
    });
  } catch {
    throw new AuthenticationError("Failed to sign access token");
  }
};

// Sign Refresh Token
export const signRefreshToken = (payload: JwtPayload): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (jwt as any).sign(payload, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
      expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
    });
  } catch {
    throw new AuthenticationError("Failed to sign refresh token");
  }
};

// Verify Access Token
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET) as JwtPayload;
  } catch {
    throw new AuthenticationError("Invalid or expired access token");
  }
};

// Verify Refresh Token
export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_CONFIG.REFRESH_TOKEN_SECRET) as JwtPayload;
  } catch {
    throw new AuthenticationError("Invalid or expired refresh token");
  }
};
