// src/lib/db/repositories/pending-registration-repo.ts
import { BaseRepository } from "./base-repo";
import { db } from "../index";
import { pendingRegistrations } from "../schema";
import { eq, lt } from "drizzle-orm";
import { PendingRegistration, CreatePendingRegistrationInput } from "../models";

export class PendingRegistrationRepository extends BaseRepository {
  async create(data: CreatePendingRegistrationInput): Promise<PendingRegistration> {
    try {
      const [pendingRegistration] = await db.insert(pendingRegistrations).values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return pendingRegistration as PendingRegistration;
    } catch (error) {
      this.handleError(error, "Create Pending Registration");
    }
  }

  async findByEmail(email: string): Promise<PendingRegistration | undefined> {
    try {
      const result = await db.select().from(pendingRegistrations).where(eq(pendingRegistrations.email, email)).execute();
      return result[0] as PendingRegistration | undefined;
    } catch (error) {
      this.handleError(error, "Find Pending Registration by Email");
    }
  }

  async findById(id: string): Promise<PendingRegistration | undefined> {
    try {
      const result = await db.select().from(pendingRegistrations).where(eq(pendingRegistrations.id, id)).execute();
      return result[0] as PendingRegistration | undefined;
    } catch (error) {
      this.handleError(error, "Find Pending Registration by ID");
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await db.delete(pendingRegistrations).where(eq(pendingRegistrations.id, id));
    } catch (error) {
      this.handleError(error, "Delete Pending Registration");
    }
  }

  async deleteExpired(): Promise<void> {
    try {
      await db.delete(pendingRegistrations).where(lt(pendingRegistrations.otpExpiresAt, new Date()));
    } catch (error) {
      this.handleError(error, "Delete Expired Pending Registrations");
    }
  }
}