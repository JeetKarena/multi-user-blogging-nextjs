// src/lib/auth/index.ts
import { AuthService } from "@/lib/services/auth-service";
import { verifyRefreshToken } from "./jwt";
import { AuthenticationError } from "@/lib/utils/errors";

const authService = new AuthService();

// Re-export auth service methods for convenience
export const register = authService.register.bind(authService);
export const login = authService.login.bind(authService);
export const refreshTokens = authService.refreshToken.bind(authService);
export const logout = authService.logout.bind(authService);
export const getProfile = authService.getProfile.bind(authService);
export const updateProfile = authService.updateProfile.bind(authService);
export const deactivateAccount = authService.deactivateAccount.bind(authService);
export const deleteAccount = authService.deleteAccount.bind(authService);
export const getAllUsers = authService.getAllUsers.bind(authService);
export const updateUserRole = authService.updateUserRole.bind(authService);

// Additional utility function for token verification
export const verifyToken = (token: string) => {
  try {
    return verifyRefreshToken(token);
  } catch {
    throw new AuthenticationError("Invalid token");
  }
};
