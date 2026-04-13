/**
 * Unit Tests — Validators Module
 *
 * Tests input validation for account fields and IPO applications.
 */

import {
  validateDPId,
  validateUsername,
  validatePassword,
  validateCRN,
  validatePIN,
  validateAccountFields,
  validateAppliedKitta,
  validateRequired,
  validateEmail,
} from '@/src/utils/validators';
import { ValidationError } from '@/src/utils/errors';

describe('Validators', () => {
  describe('validateDPId', () => {
    it('should accept valid DP IDs', () => {
      expect(() => validateDPId('13060')).not.toThrow();
      expect(() => validateDPId('1306000')).not.toThrow();
      expect(() => validateDPId('1306000123')).not.toThrow();
    });

    it('should reject empty DP ID', () => {
      expect(() => validateDPId('')).toThrow(ValidationError);
      expect(() => validateDPId('   ')).toThrow(ValidationError);
    });

    it('should reject non-numeric DP ID', () => {
      expect(() => validateDPId('ABC123')).toThrow(ValidationError);
      expect(() => validateDPId('13-06')).toThrow(ValidationError);
    });

    it('should reject too short DP ID', () => {
      expect(() => validateDPId('123')).toThrow(ValidationError);
    });
  });

  describe('validateUsername', () => {
    it('should accept valid usernames', () => {
      expect(() => validateUsername('user123')).not.toThrow();
      expect(() => validateUsername('ab')).not.toThrow();
    });

    it('should reject empty username', () => {
      expect(() => validateUsername('')).toThrow(ValidationError);
    });

    it('should reject too short username', () => {
      expect(() => validateUsername('a')).toThrow(ValidationError);
    });
  });

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      expect(() => validatePassword('pass')).not.toThrow();
      expect(() => validatePassword('MyStr0ng!Pass')).not.toThrow();
    });

    it('should reject empty password', () => {
      expect(() => validatePassword('')).toThrow(ValidationError);
    });

    it('should reject too short password', () => {
      expect(() => validatePassword('abc')).toThrow(ValidationError);
    });
  });

  describe('validateCRN', () => {
    it('should accept valid CRNs', () => {
      expect(() => validateCRN('1234567890')).not.toThrow();
      expect(() => validateCRN('CRN-1234')).not.toThrow();
    });

    it('should reject empty CRN', () => {
      expect(() => validateCRN('')).toThrow(ValidationError);
    });
  });

  describe('validatePIN', () => {
    it('should accept valid PINs', () => {
      expect(() => validatePIN('1234')).not.toThrow();
      expect(() => validatePIN('12345678')).not.toThrow();
    });

    it('should reject empty PIN', () => {
      expect(() => validatePIN('')).toThrow(ValidationError);
    });

    it('should reject non-numeric PIN', () => {
      expect(() => validatePIN('abcd')).toThrow(ValidationError);
    });

    it('should reject too short PIN', () => {
      expect(() => validatePIN('123')).toThrow(ValidationError);
    });
  });

  describe('validateAccountFields', () => {
    it('should accept all valid fields', () => {
      expect(() =>
        validateAccountFields({
          dpId: '13060001',
          username: 'testuser',
          password: 'testpass',
          crn: '1234567890',
          pin: '1234',
        }),
      ).not.toThrow();
    });

    it('should throw on first invalid field', () => {
      expect(() =>
        validateAccountFields({
          dpId: '', // invalid
          username: 'testuser',
          password: 'testpass',
          crn: '1234567890',
          pin: '1234',
        }),
      ).toThrow(ValidationError);
    });
  });

  describe('validateAppliedKitta', () => {
    it('should accept valid kitta amounts', () => {
      expect(() => validateAppliedKitta(10, 10, 50)).not.toThrow();
      expect(() => validateAppliedKitta(20, 10, 50)).not.toThrow();
      expect(() => validateAppliedKitta(50, 10, 50)).not.toThrow();
    });

    it('should reject below minimum', () => {
      expect(() => validateAppliedKitta(5, 10, 50)).toThrow(ValidationError);
    });

    it('should reject above maximum', () => {
      expect(() => validateAppliedKitta(60, 10, 50)).toThrow(ValidationError);
    });

    it('should reject non-multiples of 10', () => {
      expect(() => validateAppliedKitta(15, 10, 50)).toThrow(ValidationError);
    });

    it('should reject zero', () => {
      expect(() => validateAppliedKitta(0, 10, 50)).toThrow(ValidationError);
    });

    it('should reject negative', () => {
      expect(() => validateAppliedKitta(-10, 10, 50)).toThrow(ValidationError);
    });
  });

  describe('validateRequired', () => {
    it('should accept non-empty values', () => {
      expect(() => validateRequired('hello', 'field')).not.toThrow();
    });

    it('should reject empty values', () => {
      expect(() => validateRequired('', 'field')).toThrow(ValidationError);
      expect(() => validateRequired('   ', 'field')).toThrow(ValidationError);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(() => validateEmail('user@example.com')).not.toThrow();
      expect(() => validateEmail('test.user@domain.co.np')).not.toThrow();
    });

    it('should reject invalid emails', () => {
      expect(() => validateEmail('not-an-email')).toThrow(ValidationError);
      expect(() => validateEmail('@missing.user')).toThrow(ValidationError);
    });
  });
});
