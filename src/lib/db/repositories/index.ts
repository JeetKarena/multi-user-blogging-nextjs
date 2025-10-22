// src/lib/db/repositories/index.ts
import { UserRepository } from "./user-repo";
import { PostRepository } from "./post-repo";
import { CategoryRepository } from "./category-repo";
import { RelationsRepository } from "./relations-repo";
import { RefreshTokenRepository } from "./refresh-token-repo";
import { PendingRegistrationRepository } from "./pending-registration-repo";

// Create instances
const userRepo = new UserRepository();
const postRepo = new PostRepository();
const categoryRepo = new CategoryRepository();
const relationsRepo = new RelationsRepository();
const refreshTokenRepo = new RefreshTokenRepository();
const pendingRegistrationRepo = new PendingRegistrationRepository();

export {
  UserRepository,
  PostRepository,
  CategoryRepository,
  RelationsRepository,
  RefreshTokenRepository,
  PendingRegistrationRepository,
  userRepo,
  postRepo,
  categoryRepo,
  relationsRepo,
  refreshTokenRepo,
  pendingRegistrationRepo,
};
