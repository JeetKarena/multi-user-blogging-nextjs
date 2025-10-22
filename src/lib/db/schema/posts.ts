// src/lib/db/schema/posts.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users, postCategories, postRevisions, postStats } from "./index";

// Enums
export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "published",
  "archived",
]);

// Tables
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id").references(() => users.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),
  tags: text("tags"), // JSON array of tag strings
  status: postStatusEnum("status").default("draft").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  isFeatured: boolean("is_featured").default(false),
  readTimeMinutes: integer("read_time_minutes"),
  language: text("language").default("en"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Relations
export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  postCategories: many(postCategories),
  postRevisions: many(postRevisions),
  postStats: many(postStats),
}));

// Zod Schemas
export const insertPostSchema = createInsertSchema(posts, {
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  slug: z.string().min(1, "Slug is required").max(255, "Slug too long"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().max(500, "Excerpt too long").optional(),
  featuredImage: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
  readTimeMinutes: z.number().int().positive().optional(),
  metaTitle: z.string().max(255, "Meta title too long").optional(),
  metaDescription: z.string().max(500, "Meta description too long").optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const selectPostSchema = createSelectSchema(posts);
export const updatePostSchema = insertPostSchema.partial().extend({
  id: z.string().uuid(),
});

export const createPostSchema = insertPostSchema.extend({
  categoryIds: z.array(z.string().uuid()).optional(),
});

export const updatePostSchemaWithCategories = updatePostSchema.extend({
  categoryIds: z.array(z.string().uuid()).optional(),
});

// Types
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type UpdatePost = z.infer<typeof updatePostSchema>;
export type CreatePost = z.infer<typeof createPostSchema>;
export type UpdatePostWithCategories = z.infer<
  typeof updatePostSchemaWithCategories
>;
