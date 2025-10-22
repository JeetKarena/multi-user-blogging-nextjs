// src/lib/db/schema/categories.ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { postCategories } from "./index";

// Tables
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  color: text("color").default("#6B7280"), // Tailwind gray-500
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  postCategories: many(postCategories),
}));

// Zod Schemas
export const insertCategorySchema = createInsertSchema(categories, {
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Name too long"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug too long"),
  description: z.string().max(500, "Description too long").optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid color format")
    .optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectCategorySchema = createSelectSchema(categories);
export const updateCategorySchema = insertCategorySchema.partial().extend({
  id: z.string().uuid(),
});

// Types
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type UpdateCategory = z.infer<typeof updateCategorySchema>;
