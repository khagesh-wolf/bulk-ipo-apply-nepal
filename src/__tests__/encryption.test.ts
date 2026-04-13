/**
 * Unit Tests — Encryption Module
 *
 * Tests AES-256-CBC encrypt/decrypt cycle, key generation, and derivation.
 */

import {
  encrypt,
  decrypt,
  generateEncryptionKey,
  deriveKey,
  sha256,
  bytesToHex,
  hexToBytes,
} from '@/src/security/encryption';

describe('Encryption Module', () => {
  describe('generateEncryptionKey', () => {
    it('should generate a 64-character hex string (256-bit key)', async () => {
      const key = await generateEncryptionKey();
      expect(key).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(key)).toBe(true);
    });

    it('should generate unique keys each time', async () => {
      const key1 = await generateEncryptionKey();
      const key2 = await generateEncryptionKey();
      expect(key1).not.toEqual(key2);
    });
  });

  describe('deriveKey', () => {
    it('should derive a deterministic key from master + salt', async () => {
      const masterKey = 'a'.repeat(64);
      const salt = 'field:password:v1';

      const derived1 = await deriveKey(masterKey, salt);
      const derived2 = await deriveKey(masterKey, salt);

      expect(derived1).toEqual(derived2);
      expect(derived1).toHaveLength(64);
    });

    it('should derive different keys for different salts', async () => {
      const masterKey = 'a'.repeat(64);

      const key1 = await deriveKey(masterKey, 'field:password:v1');
      const key2 = await deriveKey(masterKey, 'field:pin:v1');

      expect(key1).not.toEqual(key2);
    });
  });

  describe('encrypt / decrypt', () => {
    it('should encrypt and decrypt a simple string', async () => {
      const key = await generateEncryptionKey();
      const plaintext = 'Hello, MeroShare!';

      const encrypted = await encrypt(plaintext, key);
      const decrypted = await decrypt(encrypted, key);

      expect(decrypted).toEqual(plaintext);
    });

    it('should encrypt and decrypt special characters', async () => {
      const key = await generateEncryptionKey();
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`नेपाल';

      const encrypted = await encrypt(plaintext, key);
      const decrypted = await decrypt(encrypted, key);

      expect(decrypted).toEqual(plaintext);
    });

    it('should produce different ciphertext for same plaintext (random IV)', async () => {
      const key = await generateEncryptionKey();
      const plaintext = 'Test password 123';

      const enc1 = await encrypt(plaintext, key);
      const enc2 = await encrypt(plaintext, key);

      expect(enc1).not.toEqual(enc2);

      // But both should decrypt to the same plaintext
      expect(await decrypt(enc1, key)).toEqual(plaintext);
      expect(await decrypt(enc2, key)).toEqual(plaintext);
    });

    it('should encrypt and decrypt an empty string', async () => {
      const key = await generateEncryptionKey();
      const plaintext = '';

      const encrypted = await encrypt(plaintext, key);
      const decrypted = await decrypt(encrypted, key);

      expect(decrypted).toEqual(plaintext);
    });

    it('should encrypt and decrypt a long string', async () => {
      const key = await generateEncryptionKey();
      const plaintext = 'A'.repeat(1000);

      const encrypted = await encrypt(plaintext, key);
      const decrypted = await decrypt(encrypted, key);

      expect(decrypted).toEqual(plaintext);
    });

    it('should fail to decrypt with wrong key', async () => {
      const key1 = await generateEncryptionKey();
      const key2 = await generateEncryptionKey();
      const plaintext = 'Secret data';

      const encrypted = await encrypt(plaintext, key1);

      await expect(decrypt(encrypted, key2)).rejects.toThrow();
    });

    it('should produce iv:ciphertext format', async () => {
      const key = await generateEncryptionKey();
      const encrypted = await encrypt('test', key);

      expect(encrypted).toContain(':');
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(2);
      expect(parts[0].length).toBe(32); // 16 bytes IV = 32 hex chars
    });
  });

  describe('sha256', () => {
    it('should produce a hash string', async () => {
      const hash = await sha256('test input');
      expect(hash).toHaveLength(64);
    });

    it('should produce same hash for same input', async () => {
      const hash1 = await sha256('deterministic');
      const hash2 = await sha256('deterministic');
      expect(hash1).toEqual(hash2);
    });
  });

  describe('bytesToHex / hexToBytes', () => {
    it('should roundtrip correctly', () => {
      const original = new Uint8Array([0, 1, 255, 128, 64, 32]);
      const hex = bytesToHex(original);
      const restored = hexToBytes(hex);

      expect(Array.from(restored)).toEqual(Array.from(original));
    });

    it('should handle empty array', () => {
      const hex = bytesToHex(new Uint8Array(0));
      expect(hex).toBe('');
      const bytes = hexToBytes('');
      expect(bytes.length).toBe(0);
    });
  });
});
