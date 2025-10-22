// src/lib/services/index.ts
export { AuthService } from './auth-service';
export { PostService } from './post-service';
export { CategoryService } from './category-service';
export { EmailService } from './email-service';
export { DraftService } from './draft-service';

// Create service instances
import { AuthService } from './auth-service';
import { PostService } from './post-service';
import { CategoryService } from './category-service';
import { EmailService } from './email-service';
import { DraftService } from './draft-service';

export const authService = new AuthService();
export const postService = new PostService();
export const categoryService = new CategoryService();
export const emailService = new EmailService();
export const draftService = new DraftService();