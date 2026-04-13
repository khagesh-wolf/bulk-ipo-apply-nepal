/**
 * Secure Credential Vault — Bulk IPO Apply Nepal
 *
 * High-level API for encrypting / decrypting sensitive account fields.
 * Uses the master key from the keychain and per-field key derivation.
 */

import { getMasterKey } from './keychain';
import { encrypt, decrypt, deriveKey } from './encryption';
import { logger } from '@/src/utils/logger';
import { EncryptionError } from '@/src/utils/errors';

const TAG = 'Vault';

// ---------------------------------------------------------------------------
// Field-specific salts (ensures different ciphertext per field)
// ---------------------------------------------------------------------------

const FIELD_SALTS: Record<string, string> = {
  password: 'field:password:v1',
  crn: 'field:crn:v1',
  pin: 'field:pin:v1',
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Encrypt a sensitive credential field.
 */
export async function encryptField(
  fieldName: 'password' | 'crn' | 'pin',
  plaintext: string,
): Promise<string> {
  try {
    const masterKey = await getMasterKey();
    const salt = FIELD_SALTS[fieldName];
    const fieldKey = await deriveKey(masterKey, salt);
    return await encrypt(plaintext, fieldKey);
  } catch (err) {
    logger.error(TAG, `Failed to encrypt field: ${fieldName}`, err);
    if (err instanceof EncryptionError) throw err;
    throw new EncryptionError(`Failed to encrypt ${fieldName}.`);
  }
}

/**
 * Decrypt a sensitive credential field.
 */
export async function decryptField(
  fieldName: 'password' | 'crn' | 'pin',
  encryptedData: string,
): Promise<string> {
  try {
    const masterKey = await getMasterKey();
    const salt = FIELD_SALTS[fieldName];
    const fieldKey = await deriveKey(masterKey, salt);
    return await decrypt(encryptedData, fieldKey);
  } catch (err) {
    logger.error(TAG, `Failed to decrypt field: ${fieldName}`, err);
    if (err instanceof EncryptionError) throw err;
    throw new EncryptionError(`Failed to decrypt ${fieldName}.`);
  }
}

/**
 * Encrypt all sensitive fields of an account at once.
 */
export async function encryptAccountCredentials(fields: {
  password: string;
  crn: string;
  pin: string;
}): Promise<{
  encryptedPassword: string;
  encryptedCrn: string;
  encryptedPin: string;
}> {
  const [encryptedPassword, encryptedCrn, encryptedPin] = await Promise.all([
    encryptField('password', fields.password),
    encryptField('crn', fields.crn),
    encryptField('pin', fields.pin),
  ]);

  return { encryptedPassword, encryptedCrn, encryptedPin };
}

/**
 * Decrypt all sensitive fields of an account at once.
 */
export async function decryptAccountCredentials(fields: {
  encryptedPassword: string;
  encryptedCrn: string;
  encryptedPin: string;
}): Promise<{
  password: string;
  crn: string;
  pin: string;
}> {
  const [password, crn, pin] = await Promise.all([
    decryptField('password', fields.encryptedPassword),
    decryptField('crn', fields.encryptedCrn),
    decryptField('pin', fields.encryptedPin),
  ]);

  return { password, crn, pin };
}
