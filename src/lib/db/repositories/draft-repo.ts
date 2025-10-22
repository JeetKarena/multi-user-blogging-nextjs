// src/lib/db/repositories/draft-repo.ts
import { BaseRepository } from "./base-repo";
import { db } from "../index";
import { postDrafts } from "../schema";
import { eq, desc } from "drizzle-orm";
import { Draft, CreateDraftInput, UpdateDraftInput } from "../models/draft";

export class DraftRepository extends BaseRepository {
  async create(data: CreateDraftInput & { authorId: string }) {
    try {
      const [draft] = await db.insert(postDrafts).values({
        ...data,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        categories: data.categories ? JSON.stringify(data.categories) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Parse tags and categories back to arrays for the return value
      const result = {
        ...draft,
        tags: draft.tags && draft.tags !== 'null' ? JSON.parse(draft.tags) : undefined,
        categories: draft.categories && draft.categories !== 'null' ? JSON.parse(draft.categories) : undefined,
      };
      return result as Draft;
    } catch (error) {
      this.handleError(error, "Create Draft");
    }
  }

  async findById(id: string) {
    try {
      const [draft] = await db.select().from(postDrafts).where(eq(postDrafts.id, id));
      if (!draft) return null;

      return {
        ...draft,
        tags: draft.tags && draft.tags !== 'null' ? JSON.parse(draft.tags) : undefined,
        categories: draft.categories && draft.categories !== 'null' ? JSON.parse(draft.categories) : undefined,
      } as Draft;
    } catch (error) {
      this.handleError(error, "Find Draft by ID");
    }
  }

  async findByAuthorId(authorId: string, limit = 10) {
    try {
      const drafts = await db
        .select()
        .from(postDrafts)
        .where(eq(postDrafts.authorId, authorId))
        .orderBy(desc(postDrafts.updatedAt))
        .limit(limit);

      return drafts.map(draft => ({
        ...draft,
        tags: draft.tags && draft.tags !== 'null' ? JSON.parse(draft.tags) : undefined,
        categories: draft.categories && draft.categories !== 'null' ? JSON.parse(draft.categories) : undefined,
      })) as Draft[];
    } catch (error) {
      this.handleError(error, "Find Drafts by Author ID");
    }
  }

  async update(id: string, data: UpdateDraftInput) {
    try {
      const updateData: Partial<Omit<typeof postDrafts.$inferInsert, 'tags' | 'categories'>> & { tags?: string | null; categories?: string | null } = {
        updatedAt: new Date(),
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
      if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
      if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
      if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;

      if (data.tags !== undefined) {
        updateData.tags = data.tags ? JSON.stringify(data.tags) : null;
      }

      if (data.categories !== undefined) {
        updateData.categories = data.categories ? JSON.stringify(data.categories) : null;
      }

      const [draft] = await db
        .update(postDrafts)
        .set(updateData)
        .where(eq(postDrafts.id, id))
        .returning();

      if (!draft) return null;

      return {
        ...draft,
        tags: draft.tags && draft.tags !== 'null' ? JSON.parse(draft.tags) : undefined,
        categories: draft.categories && draft.categories !== 'null' ? JSON.parse(draft.categories) : undefined,
      } as Draft;
    } catch (error) {
      this.handleError(error, "Update Draft");
    }
  }

  async delete(id: string) {
    try {
      await db.delete(postDrafts).where(eq(postDrafts.id, id));
      return true;
    } catch (error) {
      this.handleError(error, "Delete Draft");
    }
  }

  async countByAuthorId(authorId: string) {
    try {
      const result = await db
        .select({ count: postDrafts.id })
        .from(postDrafts)
        .where(eq(postDrafts.authorId, authorId));

      return result.length;
    } catch (error) {
      this.handleError(error, "Count Drafts by Author ID");
    }
  }
}