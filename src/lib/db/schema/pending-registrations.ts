// src/lib/db/schema/pending-registrations.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Tables
export const pendingRegistrations = pgTable("pending_registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  username: text("username"),
  passwordHash: text("password_hash").notNull(),
  otpCode: text("otp_code").notNull(),
  otpExpiresAt: timestamp("otp_expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Zod Schemas
export const insertPendingRegistrationSchema = createInsertSchema(pendingRegistrations, {
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  passwordHash: z.string().min(1, "Password hash is required"),
  otpCode: z.string().length(6, "OTP must be 6 digits"),
});

export const selectPendingRegistrationSchema = createSelectSchema(pendingRegistrations);