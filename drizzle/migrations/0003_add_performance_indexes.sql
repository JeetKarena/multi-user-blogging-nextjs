-- Add indexes for frequently queried fields

-- Users table indexes
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users" ("username");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role");
CREATE INDEX IF NOT EXISTS "users_is_active_idx" ON "users" ("is_active");

-- Posts table indexes
CREATE INDEX IF NOT EXISTS "posts_slug_idx" ON "posts" ("slug");
CREATE INDEX IF NOT EXISTS "posts_status_idx" ON "posts" ("status");
CREATE INDEX IF NOT EXISTS "posts_author_id_idx" ON "posts" ("author_id");
CREATE INDEX IF NOT EXISTS "posts_published_at_idx" ON "posts" ("published_at");
CREATE INDEX IF NOT EXISTS "posts_is_featured_idx" ON "posts" ("is_featured");
CREATE INDEX IF NOT EXISTS "posts_created_at_idx" ON "posts" ("created_at");
CREATE INDEX IF NOT EXISTS "posts_status_published_at_idx" ON "posts" ("status", "published_at");

-- Categories table indexes
CREATE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories" ("slug");
CREATE INDEX IF NOT EXISTS "categories_name_idx" ON "categories" ("name");

-- Post categories indexes
CREATE INDEX IF NOT EXISTS "post_categories_post_id_idx" ON "post_categories" ("post_id");
CREATE INDEX IF NOT EXISTS "post_categories_category_id_idx" ON "post_categories" ("category_id");
