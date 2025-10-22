# API Testing Guide

This guide explains how to test your blogging platform API using Postman or other OpenAPI-compatible tools.

## Files Created

1. **`openapi.yaml`** - OpenAPI 3.0 specification file
2. **`postman_collection.json`** - Postman collection for direct import

## Setup Instructions

### 1. Start Your Development Server

```bash
npm run dev
```

Your API will be available at `http://localhost:3000`

### 2. Set Up Your Database

Make sure your database is running and seeded:

```bash
npm run db:push
npm run db:seed
```

### 3. Import into Postman

#### Option A: Import Postman Collection (Recommended)
1. Open Postman
2. Click "Import" button
3. Select "File"
4. Choose `postman_collection.json`
5. The collection will be imported with pre-configured requests

#### Option B: Import OpenAPI Specification
1. Open Postman
2. Click "Import" button
3. Select "File"
4. Choose `openapi.yaml`
5. Postman will generate a collection from the OpenAPI spec

## Using the Postman Collection

### Environment Variables

The collection includes these variables (automatically managed):

- `{{baseUrl}}` - API base URL (default: `http://localhost:3000`)
- `{{accessToken}}` - JWT access token (auto-set after login)
- `{{refreshToken}}` - JWT refresh token (auto-set after login)
- `{{userId}}` - Current user ID (auto-set after login)

### Testing Flow

1. **Register a new user** or **Login with existing user**
   - Use the "Register User" or "Login User" request
   - Tokens will be automatically saved to collection variables

2. **Test authenticated endpoints**
   - All requests with `{{accessToken}}` in headers will use your login token
   - Try creating, updating, or deleting posts

3. **Test public endpoints**
   - Get all posts, get post by ID/slug work without authentication
   - Categories are also public

4. **Test admin/editor endpoints** (if you have appropriate role)
   - Publish/unpublish posts
   - Create/update/delete categories
   - User management (admin only)

## API Endpoints Overview

### Authentication
- `POST /api/trpc/auth.register` - Register new user
- `POST /api/trpc/auth.login` - Login user
- `POST /api/trpc/auth.refreshToken` - Refresh access token
- `POST /api/trpc/auth.logout` - Logout user
- `GET /api/trpc/auth.getProfile` - Get current user profile
- `PATCH /api/trpc/auth.updateProfile` - Update user profile
- `GET /api/trpc/auth.getAllUsers` - Admin: Get all users
- `PATCH /api/trpc/auth.updateUserRole` - Admin: Update user role

### Posts
- `GET /api/trpc/posts.getAll` - Get all posts (with filtering)
- `GET /api/trpc/posts.getById` - Get post by ID
- `GET /api/trpc/posts.getBySlug` - Get post by slug
- `POST /api/trpc/posts.create` - Create new post
- `PATCH /api/trpc/posts.update` - Update existing post
- `DELETE /api/trpc/posts.delete` - Delete post
- `POST /api/trpc/posts.publish` - Publish post (Editor+)
- `POST /api/trpc/posts.unpublish` - Unpublish post (Editor+)
- `GET /api/trpc/posts.getAllPostsAdmin` - Admin view (Editor+)

### Categories
- `GET /api/trpc/categories.getAll` - Get all categories
- `GET /api/trpc/categories.getById` - Get category by ID
- `GET /api/trpc/categories.getBySlug` - Get category by slug
- `POST /api/trpc/categories.create` - Create category (Editor+)
- `PATCH /api/trpc/categories.update` - Update category (Editor+)
- `DELETE /api/trpc/categories.delete` - Delete category (Editor+)

## Authentication Notes

- **Bearer Token**: Include `Authorization: Bearer {{accessToken}}` header
- **Token Expiry**: Access tokens expire in 15 minutes, refresh tokens in 7 days
- **Role-based Access**:
  - `user`: Can manage own posts
  - `editor`: Can manage all posts and categories
  - `admin`: Can manage users, posts, and categories

## Common Issues

1. **401 Unauthorized**: Check if your token is valid or expired
2. **403 Forbidden**: Check if you have the required role
3. **404 Not Found**: Verify the resource ID/slug exists
4. **400 Bad Request**: Check request body format and required fields

## Sample Data

After running `npm run db:seed`, you should have:

- **Users**: Admin user (admin@example.com / password123)
- **Categories**: Technology, Lifestyle, Travel
- **Posts**: Sample published posts

Try logging in with `admin@example.com` to test admin features!