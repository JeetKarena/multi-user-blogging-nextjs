// src/lib/db/models/auth.ts
export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  replacedBy?: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
}

export interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    username: string;
    role: string;
  };
  tokens: AuthTokens;
}