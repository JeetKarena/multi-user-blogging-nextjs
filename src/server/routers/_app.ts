// src/server/routers/_app.ts
import { createTRPCRouter } from "@/server/trpc";
import { authRouter } from "./auth";
import { postsRouter } from "./posts";
import { categoriesRouter } from "./categories";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  posts: postsRouter,
  categories: categoriesRouter,
});

export type AppRouter = typeof appRouter;
