// src/server/routers/posts.ts
import { createTRPCRouter, publicProcedure, protectedProcedure, editorProcedure } from "@/server/trpc";
import { postService, draftService } from "@/lib/services";
import { z } from "zod";
import { NotFoundError, AuthorizationError } from "@/lib/utils/errors";

// Zod schemas for input validation
const createPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  featuredImage: z.union([z.string(), z.literal(''), z.undefined()]).optional().transform(val => val === '' ? undefined : val),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  publishedAt: z.union([z.string().datetime(), z.undefined()]).optional().transform((val) => val ? new Date(val) : undefined),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  featuredImage: z.union([z.string(), z.literal(''), z.undefined()]).optional().transform(val => val === '' ? undefined : val),
  status: z.enum(["draft", "published", "archived"]).optional(),
  publishedAt: z.union([z.string().datetime(), z.undefined()]).optional().transform((val) => val ? new Date(val) : undefined),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export const postsRouter = createTRPCRouter({
  // Public procedures
  getAll: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      cursor: z.string().optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
      search: z.string().optional(),
      categoryId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return await postService.getAll(input);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await postService.getById(input.id);
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return await postService.getBySlug(input.slug);
    }),

  // Get posts by current user
  getMyPosts: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      cursor: z.string().optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await postService.getAll({
        authorId: ctx.user.id,
        ...input
      });
    }),

  // Protected procedures (require authentication)
  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      const { categories, tags, ...postData } = input;
      return await postService.create({ ...postData, authorId: ctx.user.id }, categories, tags);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updatePostSchema,
      categories: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { categories, tags, ...updateData } = input;
      const dataWithTags = { ...updateData.data, tags };
      return await postService.update(input.id, dataWithTags, ctx.user.id, ctx.user.role, categories);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await postService.delete(input.id, ctx.user.id, ctx.user.role);
    }),

  // Editor/Admin procedures
  publish: editorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await postService.publish(input.id, ctx.user.id, ctx.user.role);
    }),

  unpublish: editorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await postService.unpublish(input.id, ctx.user.id, ctx.user.role);
    }),

  getAllPostsAdmin: editorProcedure
    .query(async () => {
      return await postService.getAllPostsAdmin();
    }),

  // Draft procedures
  getMyDrafts: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      return await draftService.getAllByAuthorId(ctx.user.id, input.limit);
    }),

  getDraftById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const draft = await draftService.getById(input.id);
      if (!draft) {
        throw new NotFoundError("Draft not found");
      }
      if (draft.authorId !== ctx.user.id) {
        throw new AuthorizationError("You don't have permission to view this draft");
      }
      return draft;
    }),

  createDraft: protectedProcedure
    .input(z.object({
      title: z.string().min(1, "Title is required"),
      content: z.string().min(1, "Content is required"),
      excerpt: z.string().optional(),
      featuredImage: z.union([z.string(), z.literal(''), z.undefined()]).optional().transform(val => val === '' ? undefined : val),
      tags: z.array(z.string()).optional(),
      categories: z.array(z.string()).optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await draftService.create(input, ctx.user.id);
    }),

  updateDraft: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      excerpt: z.string().optional(),
      featuredImage: z.union([z.string(), z.literal(''), z.undefined()]).optional().transform(val => val === '' ? undefined : val),
      tags: z.array(z.string()).optional(),
      categories: z.array(z.string()).optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      return await draftService.update(id, updateData, ctx.user.id);
    }),

  deleteDraft: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await draftService.delete(input.id, ctx.user.id);
    }),

  convertDraftToPost: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await draftService.convertToPost(input.id, ctx.user.id);
    }),
});