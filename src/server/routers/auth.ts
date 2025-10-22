// src/server/routers/auth.ts
import { createTRPCRouter, publicProcedure, protectedProcedure, adminProcedure } from "@/server/trpc";
import { authService } from "@/lib/services";
import { z } from "zod";

// Zod schemas for input validation
const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
});

const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
});

export const authRouter = createTRPCRouter({
  // Public auth procedures
  register: publicProcedure
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      return await authService.register(input);
    }),

  verifyOtp: publicProcedure
    .input(verifyOtpSchema)
    .mutation(async ({ input }) => {
      return await authService.verifyOtp(input.email, input.otp);
    }),

  forgotPassword: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(async ({ input }) => {
      return await authService.forgotPassword(input.email);
    }),

  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input }) => {
      return await authService.resetPassword(input.email, input.otp, input.newPassword);
    }),

  login: publicProcedure
    .input(loginUserSchema)
    .mutation(async ({ input }) => {
      return await authService.login(input);
    }),

  refreshToken: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input }) => {
      return await authService.refreshToken(input.refreshToken);
    }),

  // Protected auth procedures
  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      return await authService.logout(ctx.user.id);
    }),

  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      return await authService.getProfile(ctx.user.id);
    }),

  updateProfile: protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx, input }) => {
      return await authService.updateProfile(ctx.user.id, input);
    }),

  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z.string().min(6, "New password must be at least 6 characters"),
    }))
    .mutation(async ({ ctx, input }) => {
      return await authService.changePassword(ctx.user.id, input.currentPassword, input.newPassword);
    }),

  deactivateAccount: protectedProcedure
    .mutation(async ({ ctx }) => {
      return await authService.deactivateAccount(ctx.user.id);
    }),

  deleteAccount: protectedProcedure
    .mutation(async ({ ctx }) => {
      return await authService.deleteAccount(ctx.user.id);
    }),

  // Admin-only procedures
  getAllUsers: adminProcedure
    .query(async ({ ctx }) => {
      return await authService.getAllUsers(ctx.user.id);
    }),

  updateUserRole: adminProcedure
    .input(z.object({
      targetUserId: z.string(),
      role: z.enum(["user", "editor", "admin"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return await authService.updateUserRole(ctx.user.id, input.targetUserId, input.role);
    }),

  deleteUser: adminProcedure
    .input(z.object({
      targetUserId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await authService.deleteUserByAdmin(ctx.user.id, input.targetUserId);
    }),
});