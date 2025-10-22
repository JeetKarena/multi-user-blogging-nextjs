// src/lib/db/schema/index.ts
// Export all tables
export * from "./users";
export * from "./posts";
export * from "./categories";
export * from "./relations";
export * from "./auth";
export * from "./pending-registrations";

// Export model types instead of inferred types
export type {
  User,
  CreateUserInput,
  UpdateUserInput,
  LoginUserInput,
  RegisterUserInput,
} from "../models/user";

export type {
  Post,
  CreatePostInput,
  UpdatePostInput,
  PostWithAuthor,
  PostWithCategories,
  PostWithStats,
} from "../models/post";

export type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryWithPostCount,
} from "../models/category";

export type {
  RefreshToken,
  CreateRefreshTokenInput,
  AuthTokens,
  LoginResponse,
} from "../models/auth";

export type {
  PostStats,
  CreatePostStatsInput,
  UpdatePostStatsInput,
} from "../models/stats";

export type {
  Draft,
  CreateDraftInput,
  UpdateDraftInput,
  DraftWithAuthor,
} from "../models/draft";
