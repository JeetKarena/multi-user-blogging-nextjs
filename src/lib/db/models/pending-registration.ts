// src/lib/db/models/pending-registration.ts
export interface PendingRegistration {
  id: string;
  email: string;
  name: string;
  username?: string;
  passwordHash: string;
  otpCode: string;
  otpExpiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePendingRegistrationInput {
  email: string;
  name: string;
  username?: string;
  passwordHash: string;
  otpCode: string;
  otpExpiresAt: Date;
}