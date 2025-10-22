// src/server/routers/categories.ts
import { createTRPCRouter, publicProcedure, editorProcedure } from "@/server/trpc";
import { categoryService } from "@/lib/services";
import { z } from "zod";

// Zod schemas for input validation
const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
});

export const categoriesRouter = createTRPCRouter({
  // Public procedures
  getAll: publicProcedure
    .input(z.object({
      includePostCount: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      if (input.includePostCount) {
        return await categoryService.getAllWithPostCounts();
      }
      return await categoryService.getAll();
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await categoryService.getById(input.id);
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return await categoryService.getBySlug(input.slug);
    }),

  // Editor/Admin procedures
  create: editorProcedure
    .input(createCategorySchema)
    .mutation(async ({ ctx, input }) => {
      return await categoryService.create(input, ctx.user.role);
    }),

  update: editorProcedure
    .input(z.object({
      id: z.string(),
      data: updateCategorySchema,
    }))
    .mutation(async ({ ctx, input }) => {
      return await categoryService.update(input.id, input.data, ctx.user.role);
    }),

  delete: editorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await categoryService.delete(input.id, ctx.user.role);
    }),
});