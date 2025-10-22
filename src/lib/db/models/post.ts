// src/lib/db/models/post.ts
export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  authorId: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreatePostInput {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  authorId: string;
  publishedAt?: Date;
}

export interface UpdatePostInput {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
}

export interface PostWithAuthor extends Post {
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
}

export interface PostWithCategories extends Post {
  categories: {
    id: string;
    name: string;
    slug: string;
    color?: string;
  }[];
}

export interface PostWithStats extends Post {
  stats: {
    views: number;
    likes: number;
    commentsCount: number;
    shares: number;
  };
}