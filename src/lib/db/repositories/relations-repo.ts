// src/lib/db/repositories/relations-repo.ts
import { BaseRepository } from "./base-repo";
import { db } from "../index";
import { postCategories, postRevisions, postStats } from "../schema";
import { eq, and, sql } from "drizzle-orm";

export class RelationsRepository extends BaseRepository {
  // Post Categories CRUD
  async addPostCategory(postId: string, categoryId: string) {
    try {
      const result = await db
        .insert(postCategories)
        .values({ postId, categoryId, assignedAt: new Date() })
        .returning();
      return result[0];
    } catch (error) {
      this.handleError(error, "Add Post Category");
    }
  }

  async findPostCategories(postId: string) {
    try {
      const result = await db
        .select()
        .from(postCategories)
        .where(eq(postCategories.postId, postId))
        .execute();
      return result;
    } catch (error) {
      this.handleError(error, "Find Post Categories");
    }
  }

  async findCategoryPosts(categoryId: string) {
    try {
      const result = await db
        .select()
        .from(postCategories)
        .where(eq(postCategories.categoryId, categoryId))
        .execute();
      return result;
    } catch (error) {
      this.handleError(error, "Find Category Posts");
    }
  }

  async removePostCategory(postId: string, categoryId: string) {
    try {
      await db
        .delete(postCategories)
        .where(and(eq(postCategories.postId, postId), eq(postCategories.categoryId, categoryId)));
    } catch (error) {
      this.handleError(error, "Remove Post Category");
    }
  }

  async removeAllPostCategories(postId: string) {
    try {
      await db.delete(postCategories).where(eq(postCategories.postId, postId));
    } catch (error) {
      this.handleError(error, "Remove All Post Categories");
    }
  }

  // Post Revisions CRUD
  async createPostRevision(data: typeof postRevisions.$inferInsert) {
    try {
      const result = await db.insert(postRevisions).values({
        ...data,
        createdAt: new Date(),
      }).returning();
      return result[0];
    } catch (error) {
      this.handleError(error, "Create Post Revision");
    }
  }

  async findPostRevisions(postId: string) {
    try {
      const result = await db
        .select()
        .from(postRevisions)
        .where(eq(postRevisions.postId, postId))
        .execute();
      return result;
    } catch (error) {
      this.handleError(error, "Find Post Revisions");
    }
  }

  async findPostRevisionById(id: string) {
    try {
      const result = await db
        .select()
        .from(postRevisions)
        .where(eq(postRevisions.id, id))
        .execute();
      return result[0];
    } catch (error) {
      this.handleError(error, "Find Post Revision by ID");
    }
  }

  async updatePostRevision(id: string, data: Partial<typeof postRevisions.$inferInsert>) {
    try {
      const result = await db
        .update(postRevisions)
        .set(data)
        .where(eq(postRevisions.id, id))
        .returning();
      return result[0];
    } catch (error) {
      this.handleError(error, "Update Post Revision");
    }
  }

  async deletePostRevision(id: string) {
    try {
      await db.delete(postRevisions).where(eq(postRevisions.id, id));
    } catch (error) {
      this.handleError(error, "Delete Post Revision");
    }
  }

  // Post Stats CRUD
  async createPostStats(postId: string) {
    try {
      const result = await db.insert(postStats).values({
        postId,
        views: 0,
        likes: 0,
        commentsCount: 0,
        shares: 0,
        updatedAt: new Date(),
      }).returning();
      return result[0];
    } catch (error) {
      this.handleError(error, "Create Post Stats");
    }
  }

  async findPostStats(postId: string) {
    try {
      const result = await db
        .select()
        .from(postStats)
        .where(eq(postStats.postId, postId))
        .execute();
      return result[0];
    } catch (error) {
      this.handleError(error, "Find Post Stats");
    }
  }

  async updatePostStats(postId: string, data: Partial<typeof postStats.$inferInsert>) {
    try {
      const result = await db
        .update(postStats)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(postStats.postId, postId))
        .returning();
      return result[0];
    } catch (error) {
      this.handleError(error, "Update Post Stats");
    }
  }

  async incrementViews(postId: string) {
    try {
      const result = await db
        .update(postStats)
        .set({
          views: sql`${postStats.views} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(postStats.postId, postId))
        .returning();
      return result[0];
    } catch (error) {
      this.handleError(error, "Increment Post Views");
    }
  }

  async incrementLikes(postId: string) {
    try {
      const result = await db
        .update(postStats)
        .set({
          likes: sql`${postStats.likes} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(postStats.postId, postId))
        .returning();
      return result[0];
    } catch (error) {
      this.handleError(error, "Increment Post Likes");
    }
  }

  async incrementComments(postId: string) {
    try {
      const result = await db
        .update(postStats)
        .set({
          commentsCount: sql`${postStats.commentsCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(postStats.postId, postId))
        .returning();
      return result[0];
    } catch (error) {
      this.handleError(error, "Increment Post Comments");
    }
  }

  async incrementShares(postId: string) {
    try {
      const result = await db
        .update(postStats)
        .set({
          shares: sql`${postStats.shares} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(postStats.postId, postId))
        .returning();
      return result[0];
    } catch (error) {
      this.handleError(error, "Increment Post Shares");
    }
  }

  async deletePostStats(postId: string) {
    try {
      await db.delete(postStats).where(eq(postStats.postId, postId));
    } catch (error) {
      this.handleError(error, "Delete Post Stats");
    }
  }
}
