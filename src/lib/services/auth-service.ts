import bcrypt from "bcryptjs";
import { UserRepository, RefreshTokenRepository, PendingRegistrationRepository } from "@/lib/db/repositories";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/auth/jwt";
import { AuthenticationError, AuthorizationError, NotFoundError } from "@/lib/utils/errors";
import { User, CreateUserInput, LoginUserInput, AuthTokens, LoginResponse } from "@/lib/db/models";
import { emailService } from "@/lib/services";

export class AuthService {
  private userRepo = new UserRepository();
  private refreshTokenRepo = new RefreshTokenRepository();
  private pendingRegistrationRepo = new PendingRegistrationRepository();

  async register(data: CreateUserInput): Promise<{ message: string; email: string }> {
    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) {
      throw new AuthenticationError("User with this email already exists");
    }

    // Check if there's already a pending registration for this email
    const existingPending = await this.pendingRegistrationRepo.findByEmail(data.email);
    if (existingPending) {
      // Delete expired pending registration
      if (new Date() > existingPending.otpExpiresAt) {
        await this.pendingRegistrationRepo.delete(existingPending.id);
      } else {
        throw new AuthenticationError("Registration already in progress. Please check your email for OTP.");
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store pending registration
    await this.pendingRegistrationRepo.create({
      email: data.email,
      name: data.name,
      username: data.username,
      passwordHash: hashedPassword,
      otpCode,
      otpExpiresAt,
    });

    // Send OTP email
    try {
      await emailService.sendOTPEmail(data.email, otpCode, data.name);
    } catch {
      // If email fails, clean up pending registration
      const pending = await this.pendingRegistrationRepo.findByEmail(data.email);
      if (pending) {
        await this.pendingRegistrationRepo.delete(pending.id);
      }
      throw new AuthenticationError("Failed to send verification email. Please try again.");
    }

    return {
      message: "OTP sent to your email. Please verify to complete registration.",
      email: data.email,
    };
  }

  async verifyOtp(email: string, otp: string): Promise<LoginResponse> {
    // Find pending registration
    const pending = await this.pendingRegistrationRepo.findByEmail(email);
    if (!pending) {
      throw new AuthenticationError("No pending registration found. Please register first.");
    }

    // Check if OTP is expired
    if (new Date() > pending.otpExpiresAt) {
      await this.pendingRegistrationRepo.delete(pending.id);
      throw new AuthenticationError("OTP has expired. Please register again.");
    }

    // Verify OTP
    if (pending.otpCode !== otp) {
      throw new AuthenticationError("Invalid OTP. Please try again.");
    }

    // Create the user
    const user = await this.userRepo.create({
      email: pending.email,
      name: pending.name,
      username: pending.username,
      password: pending.passwordHash, // This is already hashed
      role: 'user', // Default role
      emailVerified: true, // Email is verified via OTP
    });

    // Delete pending registration
    await this.pendingRegistrationRepo.delete(pending.id);

    // Generate tokens
    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
    });

    const refreshToken = signRefreshToken({
      userId: user.id,
      role: user.role,
    });

    // Store refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username || user.email.split('@')[0], // Fallback to email prefix
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    // Check if user exists
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return { message: "If an account with this email exists, a password reset OTP has been sent." };
    }

    // Check if there's already a pending password reset for this email
    const existingPending = await this.pendingRegistrationRepo.findByEmail(email);
    if (existingPending) {
      // Delete expired pending registration
      if (new Date() > existingPending.otpExpiresAt) {
        await this.pendingRegistrationRepo.delete(existingPending.id);
      } else {
        // Don't send another OTP if one is still valid
        return { message: "If an account with this email exists, a password reset OTP has been sent." };
      }
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store pending password reset (reuse pending_registrations table)
    await this.pendingRegistrationRepo.create({
      email: user.email,
      name: user.name,
      username: user.username,
      passwordHash: user.passwordHash, // Keep existing password hash
      otpCode,
      otpExpiresAt,
    });

    // Send password reset OTP email
    try {
      await emailService.sendPasswordResetOTPEmail(user.email, otpCode, user.name);
    } catch {
      // If email fails, clean up pending registration
      const pending = await this.pendingRegistrationRepo.findByEmail(user.email);
      if (pending) {
        await this.pendingRegistrationRepo.delete(pending.id);
      }
      throw new AuthenticationError("Failed to send password reset email. Please try again.");
    }

    return { message: "If an account with this email exists, a password reset OTP has been sent." };
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
    // Find pending password reset
    const pending = await this.pendingRegistrationRepo.findByEmail(email);
    if (!pending) {
      throw new AuthenticationError("No password reset request found. Please request a new password reset.");
    }

    // Check if OTP is expired
    if (new Date() > pending.otpExpiresAt) {
      await this.pendingRegistrationRepo.delete(pending.id);
      throw new AuthenticationError("Password reset OTP has expired. Please request a new password reset.");
    }

    // Verify OTP
    if (pending.otpCode !== otp) {
      throw new AuthenticationError("Invalid OTP. Please try again.");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user's password
    await this.userRepo.updatePassword(email, hashedPassword);

    // Delete pending password reset
    await this.pendingRegistrationRepo.delete(pending.id);

    return { message: "Password has been reset successfully. You can now log in with your new password." };
  }

  async login(data: LoginUserInput): Promise<LoginResponse> {
    // Find user
    const user = await this.userRepo.findByEmail(data.email);
    if (!user) {
      throw new AuthenticationError("Invalid email or password");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError("Invalid email or password");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError("Account is deactivated");
    }

    // Update last login
    await this.userRepo.update(user.id, {
      lastLoginAt: new Date(),
    });

    // Generate tokens
    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
    });

    const refreshToken = signRefreshToken({
      userId: user.id,
      role: user.role,
    });

    // Store refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username || user.email.split('@')[0], // Fallback to email prefix
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Find token in database
      const tokens = await this.refreshTokenRepo.findActiveByUserId(decoded.userId);
      let foundToken = null;

      for (const token of tokens) {
        try {
          const isMatch = await bcrypt.compare(refreshToken, token.tokenHash);
          if (isMatch) {
            foundToken = token;
            break;
          }
        } catch {
          continue;
        }
      }

      if (!foundToken) {
        throw new AuthenticationError("Invalid refresh token");
      }

      // Check if token is expired
      if (new Date() > foundToken.expiresAt) {
        throw new AuthenticationError("Refresh token expired");
      }

      // Find user
      const user = await this.userRepo.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new AuthenticationError("User not found or inactive");
      }

      // Generate new tokens
      const newAccessToken = signAccessToken({
        userId: user.id,
        role: user.role,
      });

      const newRefreshToken = signRefreshToken({
        userId: user.id,
        role: user.role,
      });

      // Store new refresh token
      const refreshTokenHash = await bcrypt.hash(newRefreshToken, 12);
      await this.refreshTokenRepo.create({
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      // Revoke old refresh token
      await this.refreshTokenRepo.update(foundToken.id, {
        revokedAt: new Date(),
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new AuthenticationError("Invalid refresh token");
    }
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokenRepo.revokeByUserId(userId);
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Map avatar to avatarUrl if provided
    const updateData: Partial<User> = { ...data };
    if ('avatar' in updateData) {
      updateData.avatarUrl = (updateData as { avatar?: string }).avatar;
      delete (updateData as { avatar?: string }).avatar;
    }

    const updated = await this.userRepo.update(userId, updateData);
    if (!updated) {
      throw new NotFoundError("Failed to update user");
    }

    return updated;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.userRepo.update(userId, { passwordHash: hashedPassword });

    // Revoke all existing refresh tokens for security
    await this.refreshTokenRepo.revokeByUserId(userId);

    return { message: "Password changed successfully. Please log in again." };
  }

  async deactivateAccount(userId: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    await this.userRepo.update(userId, { isActive: false });
    await this.refreshTokenRepo.revokeByUserId(userId);
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Revoke all tokens
    await this.refreshTokenRepo.revokeByUserId(userId);

    // Delete user (cascade will handle related data)
    await this.userRepo.delete(userId);
  }

  // Admin methods
  async getAllUsers(adminUserId: string): Promise<User[]> {
    const admin = await this.userRepo.findById(adminUserId);
    if (!admin || admin.role !== 'admin') {
      throw new AuthorizationError("Admin access required");
    }

    return await this.userRepo.list();
  }

  async updateUserRole(adminUserId: string, targetUserId: string, role: 'user' | 'editor' | 'admin'): Promise<User> {
    const admin = await this.userRepo.findById(adminUserId);
    if (!admin || admin.role !== 'admin') {
      throw new AuthorizationError("Admin access required");
    }

    const updated = await this.userRepo.update(targetUserId, { role });
    if (!updated) {
      throw new NotFoundError("User not found");
    }

    return updated;
  }

  async deleteUserByAdmin(adminUserId: string, targetUserId: string): Promise<{ message: string }> {
    // Check if requesting user is admin
    const admin = await this.userRepo.findById(adminUserId);
    if (!admin || admin.role !== 'admin') {
      throw new AuthorizationError("Admin access required");
    }

    // Prevent admin from deleting themselves
    if (adminUserId === targetUserId) {
      throw new AuthorizationError("Cannot delete your own account as admin");
    }

    // Check if target user exists
    const targetUser = await this.userRepo.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError("User not found");
    }

    // Delete user's refresh tokens first
    await this.refreshTokenRepo.deleteAllForUser(targetUserId);

    // Delete the user
    await this.userRepo.delete(targetUserId);

    return { message: `User ${targetUser.email} has been deleted successfully` };
  }
}
