// src/lib/db/models/user.ts
export interface User {
  id: string;
  email: string;
  username?: string;
  passwordHash: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  role: 'user' | 'editor' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  username?: string;
  password: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  role?: 'user' | 'editor' | 'admin';
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  password?: string;
  passwordHash?: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  role?: 'user' | 'editor' | 'admin';
  isActive?: boolean;
  emailVerified?: boolean;
  lastLoginAt?: Date;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface RegisterUserInput {
  email: string;
  password: string;
  username?: string;
  name: string;
}