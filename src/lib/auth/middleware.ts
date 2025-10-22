// src/lib/auth/middleware.ts
import { TRPCError } from "@trpc/server";
import { verifyAccessToken } from "./jwt";
import type { JwtPayload } from "./jwt";

export const isAuthenticated = (token: string | undefined): JwtPayload => {
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "No token provided" });
  }
  return verifyAccessToken(token);
};

// Optional: Role-based access check
export const hasRole = (payload: JwtPayload, roles: string[]) => {
  if (!roles.includes(payload.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Insufficient permissions",
    });
  }
  return true;
};
