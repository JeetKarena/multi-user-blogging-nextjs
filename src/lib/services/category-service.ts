import { CategoryRepository, RelationsRepository } from "@/lib/db/repositories";
import { NotFoundError, AuthorizationError } from "@/lib/utils/errors";
import { Category, CreateCategoryInput, UpdateCategoryInput, CategoryWithPostCount } from "@/lib/db/models";

export class CategoryService {
  private categoryRepo = new CategoryRepository();
  private relationsRepo = new RelationsRepository();

  async getAll(): Promise<Category[]> {
    return await this.categoryRepo.list();
  }

  async getById(id: string): Promise<Category> {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new NotFoundError("Category not found");
    }
    return category;
  }

  async getBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepo.findBySlug(slug);
    if (!category) {
      throw new NotFoundError("Category not found");
    }
    return category;
  }

  async getCategoryWithPostCount(id: string): Promise<CategoryWithPostCount> {
    const category = await this.getById(id);
    const postCategories = await this.relationsRepo.findCategoryPosts(id);

    return {
      ...category,
      postCount: postCategories.length,
    };
  }

  async getAllWithPostCounts(): Promise<CategoryWithPostCount[]> {
    const categories = await this.categoryRepo.list();

    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const postCategories = await this.relationsRepo.findCategoryPosts(category.id);
        return {
          ...category,
          postCount: postCategories.length,
        };
      })
    );

    return categoriesWithCounts;
  }

  async create(data: CreateCategoryInput, userRole: string): Promise<Category> {
    // Check permissions - only editors and admins can create categories
    if (userRole !== 'editor' && userRole !== 'admin') {
      throw new AuthorizationError("You don't have permission to create categories");
    }

    // Check if category with same name already exists
    const existingCategories = await this.categoryRepo.list();
    const existingCategory = existingCategories.find(
      cat => cat.name.toLowerCase() === data.name.toLowerCase()
    );

    if (existingCategory) {
      throw new AuthorizationError("Category with this name already exists");
    }

    return await this.categoryRepo.create(data);
  }

  async update(id: string, data: UpdateCategoryInput, userRole: string): Promise<Category> {
    // Check permissions - only editors and admins can update categories
    if (userRole !== 'editor' && userRole !== 'admin') {
      throw new AuthorizationError("You don't have permission to update categories");
    }

    // Check if category exists
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new NotFoundError("Category not found");
    }

    // Check if new name conflicts with existing categories
    if (data.name) {
      const existingCategories = await this.categoryRepo.list();
      const conflictingCategory = existingCategories.find(
        cat => cat.id !== id && cat.name.toLowerCase() === data.name!.toLowerCase()
      );

      if (conflictingCategory) {
        throw new AuthorizationError("Category with this name already exists");
      }
    }

    const updated = await this.categoryRepo.update(id, data);
    if (!updated) {
      throw new NotFoundError("Failed to update category");
    }

    return updated;
  }

  async delete(id: string, userRole: string): Promise<void> {
    // Check permissions - only editors and admins can delete categories
    if (userRole !== 'editor' && userRole !== 'admin') {
      throw new AuthorizationError("You don't have permission to delete categories");
    }

    // Check if category exists
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new NotFoundError("Category not found");
    }

    // Check if category has posts
    const postCategories = await this.relationsRepo.findCategoryPosts(id);
    if (postCategories.length > 0) {
      throw new AuthorizationError("Cannot delete category that has posts");
    }

    await this.categoryRepo.delete(id);
  }

  async getPostsByCategory(categoryId: string): Promise<{ postId: string; categoryId: string; assignedAt: Date | null }[]> {
    // This would require joining with posts table
    // For now, return post category relations
    const postCategories = await this.relationsRepo.findCategoryPosts(categoryId);

    // TODO: Implement proper join with posts table to return full post data
    return postCategories;
  }

  // Admin methods
  async forceDelete(id: string): Promise<void> {
    // TODO: Add admin check
    // Remove all post-category relations first
    await this.relationsRepo.removeAllPostCategories(id);
    await this.categoryRepo.delete(id);
  }
}
