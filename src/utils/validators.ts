/**
 * Input Validation — Bulk IPO Apply Nepal
 *
 * Validates user-provided data for MeroShare accounts, IPO applications,
 * and other form inputs.
 */

import { ValidationError } from './errors';

// ---------------------------------------------------------------------------
// MeroShare Account Validation
// ---------------------------------------------------------------------------

/**
 * Validate a DP ID (Depository Participant ID).
 * Format: numeric string, typically 8–13 digits.
 */
export function validateDPId(dpId: string): void {
  const trimmed = dpId.trim();
  if (!trimmed) {
    throw new ValidationError('DP ID is required.', 'dpId');
  }
  if (!/^\d{4,13}$/.test(trimmed)) {
    throw new ValidationError(
      'DP ID must be a numeric string of 4–13 digits.',
      'dpId',
    );
  }
}

/**
 * Validate a MeroShare username.
 */
export function validateUsername(username: string): void {
  const trimmed = username.trim();
  if (!trimmed) {
    throw new ValidationError('Username is required.', 'username');
  }
  if (trimmed.length < 2 || trimmed.length > 50) {
    throw new ValidationError(
      'Username must be between 2 and 50 characters.',
      'username',
    );
  }
}

/**
 * Validate a MeroShare password.
 */
export function validatePassword(password: string): void {
  if (!password) {
    throw new ValidationError('Password is required.', 'password');
  }
  if (password.length < 4) {
    throw new ValidationError(
      'Password must be at least 4 characters.',
      'password',
    );
  }
}

/**
 * Validate a CRN (Capital Registration Number).
 */
export function validateCRN(crn: string): void {
  const trimmed = crn.trim();
  if (!trimmed) {
    throw new ValidationError('CRN is required.', 'crn');
  }
  if (!/^[A-Za-z0-9-]{4,30}$/.test(trimmed)) {
    throw new ValidationError(
      'CRN must be 4–30 alphanumeric characters or hyphens.',
      'crn',
    );
  }
}

/**
 * Validate a trading PIN (typically 4 digits).
 */
export function validatePIN(pin: string): void {
  if (!pin) {
    throw new ValidationError('PIN is required.', 'pin');
  }
  if (!/^\d{4,8}$/.test(pin)) {
    throw new ValidationError(
      'PIN must be 4–8 digits.',
      'pin',
    );
  }
}

/**
 * Validate all account fields at once. Throws on first failure.
 */
export function validateAccountFields(fields: {
  dpId: string;
  username: string;
  password: string;
  crn: string;
  pin: string;
}): void {
  validateDPId(fields.dpId);
  validateUsername(fields.username);
  validatePassword(fields.password);
  validateCRN(fields.crn);
  validatePIN(fields.pin);
}

// ---------------------------------------------------------------------------
// IPO Application Validation
// ---------------------------------------------------------------------------

/**
 * Validate the number of kitta (units) being applied for.
 */
export function validateAppliedKitta(
  kitta: number,
  minUnit: number,
  maxUnit: number,
): void {
  if (!Number.isInteger(kitta) || kitta <= 0) {
    throw new ValidationError('Applied units must be a positive integer.', 'kitta');
  }
  if (kitta < minUnit) {
    throw new ValidationError(
      `Minimum application is ${minUnit} units.`,
      'kitta',
    );
  }
  if (kitta > maxUnit) {
    throw new ValidationError(
      `Maximum application is ${maxUnit} units.`,
      'kitta',
    );
  }
  if (kitta % 10 !== 0) {
    throw new ValidationError(
      'Applied units must be a multiple of 10.',
      'kitta',
    );
  }
}

// ---------------------------------------------------------------------------
// Generic
// ---------------------------------------------------------------------------

/**
 * Validate that a string is non-empty after trimming.
 */
export function validateRequired(value: string, fieldName: string): void {
  if (!value || !value.trim()) {
    throw new ValidationError(`${fieldName} is required.`, fieldName);
  }
}

/**
 * Validate an email address format.
 */
export function validateEmail(email: string): void {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email.trim())) {
    throw new ValidationError('Please enter a valid email address.', 'email');
  }
}
