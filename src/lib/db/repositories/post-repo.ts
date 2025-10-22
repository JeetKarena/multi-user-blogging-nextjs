// src/lib/db/repositories/post-repo.ts
import { BaseRepository } from "./base-repo";
import { db } from "../index";
import { posts } from "../schema";
import { eq } from "drizzle-orm";
import { Post, CreatePostInput, UpdatePostInput } from "../models";

export class PostRepository extends BaseRepository {
  async create(data: CreatePostInput) {
    try {
      const [post] = await db.insert(posts).values({
        ...data,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        slug: this.generateSlug(data.title),
        status: data.status || 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      // Parse tags back to array for the return value
      const result = { 
        ...post, 
        tags: post.tags && post.tags !== 'null' ? JSON.parse(post.tags) : undefined 
      };
      return result as Post;
    } catch (error) {
      this.handleError(error, "Create Post");
    }
  }

  async findById(id: string): Promise<Post | undefined> {
    try {
      const result = await db
        .select()
        .from(posts)
        .where(eq(posts.id, id))
        .limit(1);
      
      if (result[0]) {
        const post = result[0];
        let parsedTags = undefined;
        try {
          if (post.tags && post.tags !== 'null' && post.tags !== '') {
            parsedTags = JSON.parse(post.tags);
          }
        } catch (parseError) {
          console.error(`Failed to parse tags for post ${post.id}:`, post.tags, parseError);
          parsedTags = undefined;
        }
        return { 
          ...post, 
          tags: parsedTags 
        } as Post;
      }
      return undefined;
    } catch (error) {
      this.handleError(error, "Find Post By ID");
    }
  }

  async findBySlug(slug: string): Promise<Post | undefined> {
    try {
      const result = await db.select().from(posts).where(eq(posts.slug, slug)).execute();
      if (result[0]) {
        const post = result[0];
        let parsedTags = undefined;
        try {
          if (post.tags && post.tags !== 'null' && post.tags !== '') {
            parsedTags = JSON.parse(post.tags);
          }
        } catch (parseError) {
          console.error(`Failed to parse tags for post ${post.id}:`, post.tags, parseError);
          parsedTags = undefined;
        }
        return { 
          ...post, 
          tags: parsedTags 
        } as Post;
      }
      return undefined;
    } catch (error) {
      this.handleError(error, "Find Post by Slug");
    }
  }

  async list(): Promise<Post[]> {
    try {
      const result = await db.select().from(posts).execute();
      return result.map(post => {
        let parsedTags = undefined;
        try {
          if (post.tags && post.tags !== 'null' && post.tags !== '') {
            parsedTags = JSON.parse(post.tags);
          }
        } catch (parseError) {
          console.error(`Failed to parse tags for post ${post.id}:`, post.tags, parseError);
          parsedTags = undefined;
        }
        return { 
          ...post, 
          tags: parsedTags 
        };
      }) as Post[];
    } catch (error) {
      this.handleError(error, "List Posts");
    }
  }

  async update(id: string, data: UpdatePostInput): Promise<Post | undefined> {
    try {
      const updateData = {
        ...data,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        updatedAt: new Date(),
      };
      
      const result = await db
        .update(posts)
        .set(updateData)
        .where(eq(posts.id, id))
        .returning();
      
      if (result[0]) {
        const post = result[0];
        let parsedTags = undefined;
        try {
          if (post.tags && post.tags !== 'null' && post.tags !== '') {
            parsedTags = JSON.parse(post.tags);
          }
        } catch (parseError) {
          console.error(`Failed to parse tags for post ${post.id}:`, post.tags, parseError);
          parsedTags = undefined;
        }
        return { 
          ...post, 
          tags: parsedTags 
        } as Post;
      }
      return undefined;
    } catch (error) {
      this.handleError(error, "Update Post");
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await db.delete(posts).where(eq(posts.id, id));
    } catch (error) {
      this.handleError(error, "Delete Post");
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
