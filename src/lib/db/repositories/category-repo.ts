// src/lib/db/repositories/category-repo.ts
import { BaseRepository } from "./base-repo";
import { db } from "../index";
import { categories } from "../schema";
import { eq } from "drizzle-orm";
import { Category, CreateCategoryInput, UpdateCategoryInput } from "../models";

export class CategoryRepository extends BaseRepository {
  async create(data: CreateCategoryInput) {
    try {
      const slug = this.generateSlug(data.name);
      const [category] = await db.insert(categories).values({
        ...data,
        slug,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return category as Category;
    } catch (error) {
      this.handleError(error, "Create Category");
    }
  }

  async findById(id: string): Promise<Category | undefined> {
    try {
      const result = await db
        .select()
        .from(categories)
        .where(eq(categories.id, id))
        .execute();
      return result[0] as Category | undefined;
    } catch (error) {
      this.handleError(error, "Find Category by ID");
    }
  }

  async findBySlug(slug: string): Promise<Category | undefined> {
    try {
      const result = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug))
        .execute();
      return result[0] as Category | undefined;
    } catch (error) {
      this.handleError(error, "Find Category by Slug");
    }
  }

  async list(): Promise<Category[]> {
    try {
      const result = await db.select().from(categories).execute();
      return result as Category[];
    } catch (error) {
      this.handleError(error, "List Categories");
    }
  }

  async update(id: string, data: UpdateCategoryInput): Promise<Category | undefined> {
    try {
      const result = await db
        .update(categories)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(categories.id, id))
        .returning();
      return result[0] as Category | undefined;
    } catch (error) {
      this.handleError(error, "Update Category");
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await db.delete(categories).where(eq(categories.id, id));
    } catch (error) {
      this.handleError(error, "Delete Category");
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
