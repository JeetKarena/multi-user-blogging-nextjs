// src/lib/db/models/stats.ts
export interface PostStats {
  postId: string;
  views: number;
  likes: number;
  commentsCount: number;
  shares: number;
  updatedAt: Date;
}

export interface CreatePostStatsInput {
  postId: string;
  views?: number;
  likes?: number;
  commentsCount?: number;
  shares?: number;
}

export interface UpdatePostStatsInput {
  views?: number;
  likes?: number;
  commentsCount?: number;
  shares?: number;
}