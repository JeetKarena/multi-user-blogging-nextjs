// src/lib/db/repositories/refresh-token-repo.ts
import { BaseRepository } from "./base-repo";
import { db } from "../index";
import { refreshTokens } from "../schema";
import { eq, and, isNull } from "drizzle-orm";
import { RefreshToken, CreateRefreshTokenInput } from "../models";

export class RefreshTokenRepository extends BaseRepository {
  async create(data: CreateRefreshTokenInput): Promise<RefreshToken> {
    try {
      const [token] = await db.insert(refreshTokens).values({
        ...data,
        createdAt: new Date(),
      }).returning();
      return token as RefreshToken;
    } catch (error) {
      this.handleError(error, "Create Refresh Token");
    }
  }

  async findById(id: string): Promise<RefreshToken | undefined> {
    try {
      const result = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.id, id))
        .execute();
      return result[0] as RefreshToken | undefined;
    } catch (error) {
      this.handleError(error, "Find Refresh Token by ID");
    }
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | undefined> {
    try {
      const result = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.tokenHash, tokenHash))
        .execute();
      return result[0] as RefreshToken | undefined;
    } catch (error) {
      this.handleError(error, "Find Refresh Token by Hash");
    }
  }

  async findActiveByUserId(userId: string): Promise<RefreshToken[]> {
    try {
      const result = await db
        .select()
        .from(refreshTokens)
        .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)))
        .execute();
      return result as RefreshToken[];
    } catch (error) {
      this.handleError(error, "Find Active Refresh Tokens by User ID");
    }
  }

  async update(id: string, data: Partial<RefreshToken>): Promise<RefreshToken | undefined> {
    try {
      const result = await db
        .update(refreshTokens)
        .set(data)
        .where(eq(refreshTokens.id, id))
        .returning();
      return result[0] as RefreshToken | undefined;
    } catch (error) {
      this.handleError(error, "Update Refresh Token");
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await db.delete(refreshTokens).where(eq(refreshTokens.id, id));
    } catch (error) {
      this.handleError(error, "Delete Refresh Token");
    }
  }

  async revokeByUserId(userId: string): Promise<void> {
    try {
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
    } catch (error) {
      this.handleError(error, "Revoke Refresh Tokens by User ID");
    }
  }

  async revokeToken(tokenHash: string): Promise<void> {
    try {
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.tokenHash, tokenHash));
    } catch (error) {
      this.handleError(error, "Revoke Refresh Token");
    }
  }

  async deleteAllForUser(userId: string): Promise<void> {
    try {
      await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
    } catch (error) {
      this.handleError(error, "Delete All Refresh Tokens for User");
    }
  }
}