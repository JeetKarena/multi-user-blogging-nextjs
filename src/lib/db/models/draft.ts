// src/lib/db/models/draft.ts
export interface Draft {
  id: string;
  authorId: string;
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  tags?: string[];
  categories?: string[];
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDraftInput {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  tags?: string[];
  categories?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateDraftInput {
  title?: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  tags?: string[];
  categories?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface DraftWithAuthor extends Draft {
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
}