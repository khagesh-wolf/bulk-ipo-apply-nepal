/**
 * Unit Tests — Error Types
 *
 * Tests custom error classes, helper functions, and error hierarchy.
 */

import {
  AppError,
  AuthError,
  TokenExpiredError,
  NetworkError,
  ApiError,
  RateLimitError,
  StorageError,
  EncryptionError,
  ValidationError,
  IPOApplicationError,
  BulkApplyError,
  getUserMessage,
  isRetryable,
} from '@/src/utils/errors';

describe('Custom Error Types', () => {
  describe('AppError', () => {
    it('should create with all properties', () => {
      const error = new AppError('TEST', 'test message', 'user msg', true);
      expect(error.code).toBe('TEST');
      expect(error.message).toBe('test message');
      expect(error.userMessage).toBe('user msg');
      expect(error.isRetryable).toBe(true);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('AuthError', () => {
    it('should have AUTH_ERROR code', () => {
      const error = new AuthError('bad credentials');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.isRetryable).toBe(false);
    });

    it('should use custom user message if provided', () => {
      const error = new AuthError('internal', 'Custom message');
      expect(error.userMessage).toBe('Custom message');
    });
  });

  describe('TokenExpiredError', () => {
    it('should be non-retryable', () => {
      const error = new TokenExpiredError();
      expect(error.code).toBe('TOKEN_EXPIRED');
      expect(error.isRetryable).toBe(false);
    });
  });

  describe('NetworkError', () => {
    it('should be retryable', () => {
      const error = new NetworkError('timeout');
      expect(error.isRetryable).toBe(true);
    });

    it('should store status code', () => {
      const error = new NetworkError('fail', 500);
      expect(error.statusCode).toBe(500);
    });
  });

  describe('ApiError', () => {
    it('should be retryable for 5xx errors', () => {
      const error = new ApiError(503, 'Service unavailable');
      expect(error.isRetryable).toBe(true);
    });

    it('should not be retryable for 4xx errors', () => {
      const error = new ApiError(400, 'Bad request');
      expect(error.isRetryable).toBe(false);
    });
  });

  describe('RateLimitError', () => {
    it('should have retry time', () => {
      const error = new RateLimitError(30000);
      expect(error.retryAfterMs).toBe(30000);
      expect(error.isRetryable).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should store field name', () => {
      const error = new ValidationError('Invalid PIN', 'pin');
      expect(error.field).toBe('pin');
      expect(error.isRetryable).toBe(false);
    });
  });

  describe('BulkApplyError', () => {
    it('should track failed and success accounts', () => {
      const error = new BulkApplyError(['acc1', 'acc2'], ['acc3']);
      expect(error.failedAccounts).toEqual(['acc1', 'acc2']);
      expect(error.successAccounts).toEqual(['acc3']);
    });
  });

  describe('getUserMessage', () => {
    it('should extract user message from AppError', () => {
      const error = new AuthError('internal');
      expect(getUserMessage(error)).toContain('Authentication failed');
    });

    it('should extract message from regular Error', () => {
      const error = new Error('plain error');
      expect(getUserMessage(error)).toBe('plain error');
    });

    it('should handle non-error values', () => {
      expect(getUserMessage('string error')).toContain('unexpected');
      expect(getUserMessage(null)).toContain('unexpected');
    });
  });

  describe('isRetryable', () => {
    it('should return true for retryable errors', () => {
      expect(isRetryable(new NetworkError('timeout'))).toBe(true);
      expect(isRetryable(new RateLimitError())).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      expect(isRetryable(new AuthError('bad'))).toBe(false);
      expect(isRetryable(new TokenExpiredError())).toBe(false);
    });

    it('should return false for non-AppError', () => {
      expect(isRetryable(new Error('generic'))).toBe(false);
    });
  });
});
