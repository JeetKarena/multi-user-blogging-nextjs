// src/lib/db/repositories/user-repo.ts
import { BaseRepository } from "./base-repo";
import { db } from "../index";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import { User, CreateUserInput, UpdateUserInput } from "../models";

export class UserRepository extends BaseRepository {
  async create(data: CreateUserInput) {
    try {
      const [user] = await db
        .insert(users)
        .values({
          email: data.email,
          username: data.username,
          passwordHash: data.password,
          name: data.name,
          bio: data.bio,
          avatarUrl: data.avatarUrl,
          role: data.role ?? "user",
          isActive: data.isActive ?? true,
          emailVerified: data.emailVerified ?? false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return user as User;
    } catch (error) {
      this.handleError(error, "Create User");
    }
  }

  async findById(id: string): Promise<User | undefined> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .execute();
      return result[0] as User | undefined;
    } catch (error) {
      this.handleError(error, "Find User by ID");
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .execute();
      return result[0] as User | undefined;
    } catch (error) {
      this.handleError(error, "Find User by Email");
    }
  }

  async list(): Promise<User[]> {
    try {
      const result = await db.select().from(users).execute();
      return result as User[];
    } catch (error) {
      this.handleError(error, "List Users");
    }
  }

  async update(
    id: string,
    data: UpdateUserInput
  ): Promise<User | undefined> {
    try {
      const updateData: Partial<typeof users.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (data.username !== undefined) updateData.username = data.username;
      if (data.password !== undefined) updateData.passwordHash = data.password;
      if (data.passwordHash !== undefined) updateData.passwordHash = data.passwordHash;
      if (data.name !== undefined) updateData.name = data.name;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified;
      if (data.email !== undefined) updateData.email = data.email;

      const result = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();
      return result[0] as User | undefined;
    } catch (error) {
      this.handleError(error, "Update User");
    }
  }

  async updatePassword(email: string, newPasswordHash: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.email, email));
    } catch (error) {
      this.handleError(error, "Update User Password");
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await db.delete(users).where(eq(users.id, id));
    } catch (error) {
      this.handleError(error, "Delete User");
    }
  }
}
