/**
 * Unit Tests — Auth Service
 *
 * Tests token expiration checking and token lifecycle.
 */

import { isTokenExpired } from '@/src/api/auth';

describe('Auth Service', () => {
  describe('isTokenExpired', () => {
    it('should return true for invalid token format', () => {
      expect(isTokenExpired('not-a-jwt')).toBe(true);
      expect(isTokenExpired('')).toBe(true);
    });

    it('should return true for expired token', () => {
      // Create a JWT with exp in the past
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }),
      );
      const signature = 'test-signature';
      const token = `${header}.${payload}.${signature}`;

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return false for non-expired token', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
      );
      const signature = 'test-signature';
      const token = `${header}.${payload}.${signature}`;

      expect(isTokenExpired(token)).toBe(false);
    });

    it('should handle Bearer prefix', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
      );
      const signature = 'test-signature';
      const token = `Bearer ${header}.${payload}.${signature}`;

      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return false for token without exp claim', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: '12345', name: 'Test' }));
      const signature = 'test-signature';
      const token = `${header}.${payload}.${signature}`;

      expect(isTokenExpired(token)).toBe(false);
    });
  });
});
