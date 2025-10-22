// src/server/context.ts
import { inferAsyncReturnType } from "@trpc/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { authService } from "@/lib/services";

export async function createContext(req: Request) {
  // Extract token from Authorization header
  const authHeader = req.headers.get("authorization");
  let user = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    try {
      const payload = verifyAccessToken(token);
      console.log("Token verified successfully for user:", payload.userId);
      // Get full user data from database
      user = await authService.getProfile(payload.userId);
      console.log("User profile loaded:", user?.email);
    } catch (error) {
      // Token is invalid, user remains null
      console.error("Token verification failed:", error instanceof Error ? error.message : error);
    }
  } else {
    console.log("No authorization header found or invalid format");
  }

  return {
    user,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
