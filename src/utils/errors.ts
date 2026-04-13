/**
 * Custom Error Types — Bulk IPO Apply Nepal
 *
 * Provides typed errors with user-friendly messages for all app domains:
 * authentication, network, storage, validation, and IPO operations.
 */

// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------

export class AppError extends Error {
  readonly code: string;
  readonly userMessage: string;
  readonly isRetryable: boolean;

  constructor(
    code: string,
    message: string,
    userMessage: string,
    isRetryable = false,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.isRetryable = isRetryable;
  }
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export class AuthError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(
      'AUTH_ERROR',
      message,
      userMessage ?? 'Authentication failed. Please check your credentials.',
      false,
    );
    this.name = 'AuthError';
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super(
      'TOKEN_EXPIRED',
      'JWT token has expired',
      'Your session has expired. Please log in again.',
      false,
    );
    this.name = 'TokenExpiredError';
  }
}

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

export class NetworkError extends AppError {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(
      'NETWORK_ERROR',
      message,
      'Network error. Please check your internet connection and try again.',
      true,
    );
    this.name = 'NetworkError';
    this.statusCode = statusCode;
  }
}

export class ApiError extends AppError {
  readonly statusCode: number;
  readonly responseBody?: unknown;

  constructor(
    statusCode: number,
    message: string,
    userMessage?: string,
    responseBody?: unknown,
  ) {
    super(
      'API_ERROR',
      message,
      userMessage ?? `Server error (${statusCode}). Please try again later.`,
      statusCode >= 500,
    );
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

export class RateLimitError extends AppError {
  readonly retryAfterMs: number;

  constructor(retryAfterMs = 60_000) {
    super(
      'RATE_LIMIT',
      'Rate limit exceeded',
      'Too many requests. Please wait a moment and try again.',
      true,
    );
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

// ---------------------------------------------------------------------------
// Storage / Encryption
// ---------------------------------------------------------------------------

export class StorageError extends AppError {
  constructor(message: string) {
    super(
      'STORAGE_ERROR',
      message,
      'Failed to access local storage. Please restart the app.',
      false,
    );
    this.name = 'StorageError';
  }
}

export class EncryptionError extends AppError {
  constructor(message: string) {
    super(
      'ENCRYPTION_ERROR',
      message,
      'An encryption error occurred. Please contact support.',
      false,
    );
    this.name = 'EncryptionError';
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export class ValidationError extends AppError {
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(
      'VALIDATION_ERROR',
      message,
      message, // validation messages are already user-friendly
      false,
    );
    this.name = 'ValidationError';
    this.field = field;
  }
}

// ---------------------------------------------------------------------------
// IPO Operations
// ---------------------------------------------------------------------------

export class IPOApplicationError extends AppError {
  readonly accountId?: string;

  constructor(message: string, accountId?: string) {
    super(
      'IPO_APPLICATION_ERROR',
      message,
      message,
      true,
    );
    this.name = 'IPOApplicationError';
    this.accountId = accountId;
  }
}

export class BulkApplyError extends AppError {
  readonly failedAccounts: string[];
  readonly successAccounts: string[];

  constructor(
    failedAccounts: string[],
    successAccounts: string[],
    message?: string,
  ) {
    super(
      'BULK_APPLY_ERROR',
      message ?? `Bulk apply partially failed: ${failedAccounts.length} failed, ${successAccounts.length} succeeded.`,
      `${failedAccounts.length} account(s) failed to apply. ${successAccounts.length} succeeded.`,
      true,
    );
    this.name = 'BulkApplyError';
    this.failedAccounts = failedAccounts;
    this.successAccounts = successAccounts;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract a user-friendly message from any error type.
 */
export function getUserMessage(error: unknown): string {
  if (error instanceof AppError) return error.userMessage;
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check whether an error is retryable.
 */
export function isRetryable(error: unknown): boolean {
  if (error instanceof AppError) return error.isRetryable;
  return false;
}
