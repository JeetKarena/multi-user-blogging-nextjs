import { PostRepository, CategoryRepository, RelationsRepository } from "@/lib/db/repositories";
import { AuthorizationError, NotFoundError } from "@/lib/utils/errors";
import { Post, CreatePostInput, UpdatePostInput, PostWithCategories } from "@/lib/db/models";

export class PostService {
  private postRepo = new PostRepository();
  private categoryRepo = new CategoryRepository();
  private relationsRepo = new RelationsRepository();

  async getAll(options?: {
    authorId?: string;
    status?: 'draft' | 'published' | 'archived';
    limit?: number;
    cursor?: string; // Cursor for pagination (post ID)
    search?: string;
    categoryId?: string;
  }): Promise<{ posts: Post[]; nextCursor: string | null }> {
    const { authorId, status, limit = 10, cursor, search, categoryId } = options || {};

    // Fetch posts with cursor-based pagination
    const posts = await this.postRepo.list();

    // Filter by author, status, and search if provided
    let filteredPosts = posts;
    if (authorId) {
      filteredPosts = filteredPosts.filter(post => post.authorId === authorId);
    }
    if (status) {
      filteredPosts = filteredPosts.filter(post => post.status === status);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPosts = filteredPosts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(searchLower)) ||
        (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }
    if (categoryId) {
      // Filter posts that belong to the specified category
      const categoryPosts = await Promise.all(
        filteredPosts.map(async (post) => {
          const postCategories = await this.relationsRepo.findPostCategories(post.id);
          const hasCategory = postCategories.some(pc => pc.categoryId === categoryId);
          return hasCategory ? post : null;
        })
      );
      filteredPosts = categoryPosts.filter(post => post !== null) as Post[];
    }

    // Sort by created date (newest first)
    filteredPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply cursor pagination
    let startIndex = 0;
    if (cursor) {
      startIndex = filteredPosts.findIndex(post => post.id === cursor) + 1;
      if (startIndex === 0) {
        // Cursor not found, start from beginning
        startIndex = 0;
      }
    }

    // Get page + 1 to check if there's a next page
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + limit + 1);
    
    // Check if there are more items
    const hasMore = paginatedPosts.length > limit;
    const postsToReturn = hasMore ? paginatedPosts.slice(0, limit) : paginatedPosts;
    const nextCursor = hasMore && postsToReturn.length > 0 
      ? postsToReturn[postsToReturn.length - 1].id 
      : null;

    return {
      posts: postsToReturn,
      nextCursor,
    };
  }

  async getById(id: string, userId?: string): Promise<Post> {
    const post = await this.postRepo.findById(id);
    if (!post) {
      throw new NotFoundError("Post not found");
    }

    // Check if user can view this post
    if (post.status === 'draft' && post.authorId !== userId) {
      throw new AuthorizationError("You don't have permission to view this post");
    }

    return post;
  }

  async getBySlug(slug: string, userId?: string): Promise<Post> {
    const post = await this.postRepo.findBySlug(slug);
    if (!post) {
      throw new NotFoundError("Post not found");
    }

    // Check if user can view this post
    if (post.status === 'draft' && post.authorId !== userId) {
      throw new AuthorizationError("You don't have permission to view this post");
    }

    return post;
  }

  async getPostWithCategories(id: string, userId?: string): Promise<PostWithCategories> {
    const post = await this.getById(id, userId);
    const postCategories = await this.relationsRepo.findPostCategories(id);

    // Get category details
    const categories = await Promise.all(
      postCategories.map(async (pc) => {
        const category = await this.categoryRepo.findById(pc.categoryId);
        return category ? {
          id: category.id,
          name: category.name,
          slug: category.slug,
          color: category.color,
        } : null;
      })
    );

    return {
      ...post,
      categories: categories.filter((cat): cat is NonNullable<typeof cat> => cat !== null),
    };
  }

  async create(data: CreatePostInput, categoryIds?: string[], tags?: string[]): Promise<Post> {
    // Validate categories if provided
    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        const category = await this.categoryRepo.findById(categoryId);
        if (!category) {
          throw new NotFoundError(`Category with ID ${categoryId} not found`);
        }
      }
    }

    // Add tags to data if provided (tags are stored in the posts table)
    const postData = {
      ...data,
      tags: tags || data.tags,
    };

    // Create post
    const post = await this.postRepo.create(postData);

    // Create post stats
    await this.relationsRepo.createPostStats(post.id);

    // Add categories if provided
    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await this.relationsRepo.addPostCategory(post.id, categoryId);
      }
    }

    return post;
  }

  async update(id: string, data: UpdatePostInput, userId: string, userRole: string, categoryIds?: string[]): Promise<Post> {
    // Check if post exists
    const post = await this.postRepo.findById(id);
    if (!post) {
      throw new NotFoundError("Post not found");
    }

    // Check permissions based on role
    const canEdit = this.canUserEditPost(post.authorId, userId, userRole);
    if (!canEdit) {
      throw new AuthorizationError("You don't have permission to update this post");
    }

    // Validate categories if provided
    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        const category = await this.categoryRepo.findById(categoryId);
        if (!category) {
          throw new NotFoundError(`Category with ID ${categoryId} not found`);
        }
      }

      // Update categories
      await this.relationsRepo.removeAllPostCategories(id);
      for (const categoryId of categoryIds) {
        await this.relationsRepo.addPostCategory(id, categoryId);
      }
    }

    // Update post (tags are included in data and will be stored as JSON in the posts table)
    const updated = await this.postRepo.update(id, data);
    if (!updated) {
      throw new NotFoundError("Failed to update post");
    }

    return updated;
  }

  async delete(id: string, userId: string, userRole: string): Promise<void> {
    // Check if post exists
    const post = await this.postRepo.findById(id);
    if (!post) {
      throw new NotFoundError("Post not found");
    }

    // Check permissions based on role
    const canDelete = this.canUserDeletePost(post.authorId, userId, userRole);
    if (!canDelete) {
      throw new AuthorizationError("You don't have permission to delete this post");
    }

    // Delete post (cascade will handle relations)
    await this.postRepo.delete(id);
  }

  async publish(id: string, userId: string, userRole: string): Promise<Post> {
    // Check if post exists
    const post = await this.postRepo.findById(id);
    if (!post) {
      throw new NotFoundError("Post not found");
    }

    // Check permissions based on role
    const canPublish = this.canUserEditPost(post.authorId, userId, userRole);
    if (!canPublish) {
      throw new AuthorizationError("You don't have permission to publish this post");
    }

    return this.update(id, {
      status: 'published',
      publishedAt: new Date(),
    }, userId, userRole);
  }

  async unpublish(id: string, userId: string, userRole: string): Promise<Post> {
    // Check if post exists
    const post = await this.postRepo.findById(id);
    if (!post) {
      throw new NotFoundError("Post not found");
    }

    // Check permissions based on role
    const canUnpublish = this.canUserEditPost(post.authorId, userId, userRole);
    if (!canUnpublish) {
      throw new AuthorizationError("You don't have permission to unpublish this post");
    }

    return this.update(id, {
      status: 'draft',
    }, userId, userRole);
  }

  async getAllPostsAdmin(): Promise<Post[]> {
    // Only return basic post info for admin view
    return await this.postRepo.list();
  }

  // Helper methods for permission checks
  private canUserEditPost(postAuthorId: string, userId: string, userRole: string): boolean {
    // Users can edit their own posts
    if (postAuthorId === userId) return true;

    // Editors and admins can edit any post
    if (userRole === 'editor' || userRole === 'admin') return true;

    return false;
  }

  private canUserDeletePost(postAuthorId: string, userId: string, userRole: string): boolean {
    // Users can delete their own posts
    if (postAuthorId === userId) return true;

    // Only admins can delete any post
    if (userRole === 'admin') return true;

    return false;
  }
}
