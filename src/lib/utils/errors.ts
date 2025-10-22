// src/lib/utils/errors.ts

/**
 * Base class for all custom application errors
 */
export class AppError extends Error {
  public code?: string;
  public originalError?: unknown;
  public details?: unknown;

  constructor(
    message: string,
    options?: {
      code?: string;
      originalError?: unknown;
      details?: unknown;
    }
  ) {
    super(message);
    this.name = this.constructor.name;
    if (options) {
      this.code = options.code;
      this.originalError = options.originalError;
      this.details = options.details;
    }
    // Fix prototype chain for proper inheritance
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Database related errors */
export class DatabaseError extends AppError {
  constructor(message: string, code?: string, originalError?: unknown) {
    super(message, { code, originalError });
  }
}

/** Thrown when a requested resource is not found */
export class NotFoundError extends AppError {
  constructor(resourceOrMessage: string, id?: string | number) {
    if (id !== undefined) {
      super(`${resourceOrMessage} with ID ${id} not found`);
    } else {
      super(resourceOrMessage);
    }
  }
}

/** Validation errors, can hold optional details */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, { details });
  }
}

/** Authentication required */
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message);
  }
}

/** Insufficient permissions */
export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message);
  }
}

/** Alias for AuthorizationError (used in services) */
export class PermissionError extends AuthorizationError {}

/** Alias for AuthenticationError (used in auth services) */
export class AuthError extends AuthenticationError {}
