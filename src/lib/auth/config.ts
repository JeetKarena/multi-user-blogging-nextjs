// src/lib/auth/config.ts
export const JWT_CONFIG = {
  ACCESS_TOKEN_SECRET: process.env.JWT_SECRET || "super-secret-access-token",
  REFRESH_TOKEN_SECRET:
    process.env.JWT_REFRESH_SECRET || "super-secret-refresh-token",
  ACCESS_TOKEN_EXPIRES_IN: "15m", // 15 minutes
  REFRESH_TOKEN_EXPIRES_IN: "7d", // 7 days
};
