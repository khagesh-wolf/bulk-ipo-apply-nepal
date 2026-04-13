/**
 * AES-256 Encryption / Decryption — Bulk IPO Apply Nepal
 *
 * Uses expo-crypto for random byte generation and a pure-JS AES-256-CBC
 * implementation. The master encryption key is stored in the platform
 * keychain (see keychain.ts).
 *
 * NOTE: On native platforms, expo-crypto delegates to the OS crypto module.
 * On web, it uses the Web Crypto API under the hood.
 */

import * as Crypto from 'expo-crypto';
import { EncryptionError } from '@/src/utils/errors';
import { logger } from '@/src/utils/logger';

const TAG = 'Encryption';

// ---------------------------------------------------------------------------
// Key derivation helpers
// ---------------------------------------------------------------------------

/**
 * Generate a 256-bit (32-byte) random key as a hex string.
 */
export async function generateEncryptionKey(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  return bytesToHex(bytes);
}

/**
 * Derive a deterministic key from a master key + salt using SHA-256.
 * This is a simplified HKDF-like derivation for per-field keys.
 */
export async function deriveKey(
  masterKey: string,
  salt: string,
): Promise<string> {
  const input = `${masterKey}:${salt}`;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    input,
  );
  return hash;
}

// ---------------------------------------------------------------------------
// AES-256-CBC (pure JS implementation)
// ---------------------------------------------------------------------------

/**
 * Encrypt plaintext with AES-256-CBC.
 * Returns `iv:ciphertext` in hex encoding.
 */
export async function encrypt(
  plaintext: string,
  keyHex: string,
): Promise<string> {
  try {
    const ivBytes = await Crypto.getRandomBytesAsync(16);
    const iv = bytesToHex(ivBytes);
    const keyBytes = hexToBytes(keyHex.slice(0, 64)); // ensure 32 bytes
    const inputBytes = stringToBytes(plaintext);

    // PKCS7 padding
    const padded = pkcs7Pad(inputBytes, 16);

    // AES-256-CBC encrypt
    const encrypted = aesCbcEncrypt(padded, keyBytes, ivBytes);
    const cipherHex = bytesToHex(encrypted);

    return `${iv}:${cipherHex}`;
  } catch (err) {
    logger.error(TAG, 'Encryption failed', err);
    throw new EncryptionError('Failed to encrypt data.');
  }
}

/**
 * Decrypt ciphertext (`iv:ciphertext` in hex) with AES-256-CBC.
 */
export async function decrypt(
  encryptedData: string,
  keyHex: string,
): Promise<string> {
  try {
    const [ivHex, cipherHex] = encryptedData.split(':');
    if (!ivHex || !cipherHex) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = hexToBytes(ivHex);
    const keyBytes = hexToBytes(keyHex.slice(0, 64));
    const cipherBytes = hexToBytes(cipherHex);

    // AES-256-CBC decrypt
    const decrypted = aesCbcDecrypt(cipherBytes, keyBytes, iv);

    // Remove PKCS7 padding
    const unpadded = pkcs7Unpad(decrypted);

    return bytesToString(unpadded);
  } catch (err) {
    logger.error(TAG, 'Decryption failed', err);
    throw new EncryptionError('Failed to decrypt data.');
  }
}

// ---------------------------------------------------------------------------
// Hashing helpers
// ---------------------------------------------------------------------------

/**
 * SHA-256 hash of a string, returned as hex.
 */
export async function sha256(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

// ---------------------------------------------------------------------------
// Byte / Hex / String conversion utilities
// ---------------------------------------------------------------------------

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function stringToBytes(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

function bytesToString(bytes: Uint8Array): string {
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

// ---------------------------------------------------------------------------
// PKCS7 Padding
// ---------------------------------------------------------------------------

function pkcs7Pad(data: Uint8Array, blockSize: number): Uint8Array {
  const padLen = blockSize - (data.length % blockSize);
  const padded = new Uint8Array(data.length + padLen);
  padded.set(data);
  for (let i = data.length; i < padded.length; i++) {
    padded[i] = padLen;
  }
  return padded;
}

function pkcs7Unpad(data: Uint8Array): Uint8Array {
  if (data.length === 0) {
    throw new Error('Cannot unpad empty data');
  }
  const padLen = data[data.length - 1];
  if (padLen < 1 || padLen > 16) {
    throw new Error('Invalid PKCS7 padding');
  }
  for (let i = data.length - padLen; i < data.length; i++) {
    if (data[i] !== padLen) {
      throw new Error('Invalid PKCS7 padding');
    }
  }
  return data.slice(0, data.length - padLen);
}

// ---------------------------------------------------------------------------
// AES-256-CBC Pure JS Implementation
// ---------------------------------------------------------------------------

// AES S-Box
const SBOX: number[] = [
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16,
];

// Inverse S-Box
const INV_SBOX: number[] = [
  0x52,0x09,0x6a,0xd5,0x30,0x36,0xa5,0x38,0xbf,0x40,0xa3,0x9e,0x81,0xf3,0xd7,0xfb,
  0x7c,0xe3,0x39,0x82,0x9b,0x2f,0xff,0x87,0x34,0x8e,0x43,0x44,0xc4,0xde,0xe9,0xcb,
  0x54,0x7b,0x94,0x32,0xa6,0xc2,0x23,0x3d,0xee,0x4c,0x95,0x0b,0x42,0xfa,0xc3,0x4e,
  0x08,0x2e,0xa1,0x66,0x28,0xd9,0x24,0xb2,0x76,0x5b,0xa2,0x49,0x6d,0x8b,0xd1,0x25,
  0x72,0xf8,0xf6,0x64,0x86,0x68,0x98,0x16,0xd4,0xa4,0x5c,0xcc,0x5d,0x65,0xb6,0x92,
  0x6c,0x70,0x48,0x50,0xfd,0xed,0xb9,0xda,0x5e,0x15,0x46,0x57,0xa7,0x8d,0x9d,0x84,
  0x90,0xd8,0xab,0x00,0x8c,0xbc,0xd3,0x0a,0xf7,0xe4,0x58,0x05,0xb8,0xb3,0x45,0x06,
  0xd0,0x2c,0x1e,0x8f,0xca,0x3f,0x0f,0x02,0xc1,0xaf,0xbd,0x03,0x01,0x13,0x8a,0x6b,
  0x3a,0x91,0x11,0x41,0x4f,0x67,0xdc,0xea,0x97,0xf2,0xcf,0xce,0xf0,0xb4,0xe6,0x73,
  0x96,0xac,0x74,0x22,0xe7,0xad,0x35,0x85,0xe2,0xf9,0x37,0xe8,0x1c,0x75,0xdf,0x6e,
  0x47,0xf1,0x1a,0x71,0x1d,0x29,0xc5,0x89,0x6f,0xb7,0x62,0x0e,0xaa,0x18,0xbe,0x1b,
  0xfc,0x56,0x3e,0x4b,0xc6,0xd2,0x79,0x20,0x9a,0xdb,0xc0,0xfe,0x78,0xcd,0x5a,0xf4,
  0x1f,0xdd,0xa8,0x33,0x88,0x07,0xc7,0x31,0xb1,0x12,0x10,0x59,0x27,0x80,0xec,0x5f,
  0x60,0x51,0x7f,0xa9,0x19,0xb5,0x4a,0x0d,0x2d,0xe5,0x7a,0x9f,0x93,0xc9,0x9c,0xef,
  0xa0,0xe0,0x3b,0x4d,0xae,0x2a,0xf5,0xb0,0xc8,0xeb,0xbb,0x3c,0x83,0x53,0x99,0x61,
  0x17,0x2b,0x04,0x7e,0xba,0x77,0xd6,0x26,0xe1,0x69,0x14,0x63,0x55,0x21,0x0c,0x7d,
];

// Round constants for key expansion
const RCON: number[] = [
  0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36,
  0x6c,0xd8,0xab,0x4d,0x9a,
];

function subWord(w: number): number {
  return (
    (SBOX[(w >>> 24) & 0xff] << 24) |
    (SBOX[(w >>> 16) & 0xff] << 16) |
    (SBOX[(w >>> 8) & 0xff] << 8) |
    SBOX[w & 0xff]
  ) >>> 0;
}

function rotWord(w: number): number {
  return ((w << 8) | (w >>> 24)) >>> 0;
}

function keyExpansion(key: Uint8Array): Uint32Array {
  const nk = 8;  // AES-256
  const nr = 14;
  const nb = 4;
  const w = new Uint32Array(nb * (nr + 1));

  for (let i = 0; i < nk; i++) {
    w[i] =
      ((key[4 * i] << 24) |
        (key[4 * i + 1] << 16) |
        (key[4 * i + 2] << 8) |
        key[4 * i + 3]) >>> 0;
  }

  for (let i = nk; i < nb * (nr + 1); i++) {
    let temp = w[i - 1];
    if (i % nk === 0) {
      temp = (subWord(rotWord(temp)) ^ ((RCON[i / nk - 1] << 24) >>> 0)) >>> 0;
    } else if (i % nk === 4) {
      temp = subWord(temp);
    }
    w[i] = (w[i - nk] ^ temp) >>> 0;
  }

  return w;
}

function addRoundKey(state: Uint8Array, w: Uint32Array, round: number): void {
  for (let c = 0; c < 4; c++) {
    const wrd = w[round * 4 + c];
    state[c * 4 + 0] ^= (wrd >>> 24) & 0xff;
    state[c * 4 + 1] ^= (wrd >>> 16) & 0xff;
    state[c * 4 + 2] ^= (wrd >>> 8) & 0xff;
    state[c * 4 + 3] ^= wrd & 0xff;
  }
}

function subBytes(state: Uint8Array): void {
  for (let i = 0; i < 16; i++) state[i] = SBOX[state[i]];
}

function invSubBytes(state: Uint8Array): void {
  for (let i = 0; i < 16; i++) state[i] = INV_SBOX[state[i]];
}

function shiftRows(state: Uint8Array): void {
  // Row 1: shift left 1
  let t = state[1];
  state[1] = state[5]; state[5] = state[9]; state[9] = state[13]; state[13] = t;
  // Row 2: shift left 2
  t = state[2]; state[2] = state[10]; state[10] = t;
  t = state[6]; state[6] = state[14]; state[14] = t;
  // Row 3: shift left 3
  t = state[15];
  state[15] = state[11]; state[11] = state[7]; state[7] = state[3]; state[3] = t;
}

function invShiftRows(state: Uint8Array): void {
  // Row 1: shift right 1
  let t = state[13];
  state[13] = state[9]; state[9] = state[5]; state[5] = state[1]; state[1] = t;
  // Row 2: shift right 2
  t = state[2]; state[2] = state[10]; state[10] = t;
  t = state[6]; state[6] = state[14]; state[14] = t;
  // Row 3: shift right 3
  t = state[3];
  state[3] = state[7]; state[7] = state[11]; state[11] = state[15]; state[15] = t;
}

function xtime(a: number): number {
  return ((a << 1) ^ ((a & 0x80) ? 0x1b : 0)) & 0xff;
}

function gmul(a: number, b: number): number {
  let p = 0;
  let aa = a;
  let bb = b;
  for (let i = 0; i < 8; i++) {
    if (bb & 1) p ^= aa;
    const hiBit = aa & 0x80;
    aa = (aa << 1) & 0xff;
    if (hiBit) aa ^= 0x1b;
    bb >>= 1;
  }
  return p;
}

function mixColumns(state: Uint8Array): void {
  for (let c = 0; c < 4; c++) {
    const i = c * 4;
    const a = state[i], b = state[i + 1], cc2 = state[i + 2], d = state[i + 3];
    state[i]     = xtime(a) ^ (xtime(b) ^ b) ^ cc2 ^ d;
    state[i + 1] = a ^ xtime(b) ^ (xtime(cc2) ^ cc2) ^ d;
    state[i + 2] = a ^ b ^ xtime(cc2) ^ (xtime(d) ^ d);
    state[i + 3] = (xtime(a) ^ a) ^ b ^ cc2 ^ xtime(d);
  }
}

function invMixColumns(state: Uint8Array): void {
  for (let c = 0; c < 4; c++) {
    const i = c * 4;
    const a = state[i], b = state[i + 1], cc2 = state[i + 2], d = state[i + 3];
    state[i]     = gmul(a, 14) ^ gmul(b, 11) ^ gmul(cc2, 13) ^ gmul(d, 9);
    state[i + 1] = gmul(a, 9) ^ gmul(b, 14) ^ gmul(cc2, 11) ^ gmul(d, 13);
    state[i + 2] = gmul(a, 13) ^ gmul(b, 9) ^ gmul(cc2, 14) ^ gmul(d, 11);
    state[i + 3] = gmul(a, 11) ^ gmul(b, 13) ^ gmul(cc2, 9) ^ gmul(d, 14);
  }
}

function aesEncryptBlock(block: Uint8Array, w: Uint32Array): Uint8Array {
  const nr = 14; // AES-256
  const state = new Uint8Array(16);
  // Column-major to state
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      state[c * 4 + r] = block[r * 4 + c];
    }
  }

  addRoundKey(state, w, 0);

  for (let round = 1; round < nr; round++) {
    subBytes(state);
    shiftRows(state);
    mixColumns(state);
    addRoundKey(state, w, round);
  }

  subBytes(state);
  shiftRows(state);
  addRoundKey(state, w, nr);

  // State to column-major output
  const output = new Uint8Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      output[r * 4 + c] = state[c * 4 + r];
    }
  }
  return output;
}

function aesDecryptBlock(block: Uint8Array, w: Uint32Array): Uint8Array {
  const nr = 14;
  const state = new Uint8Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      state[c * 4 + r] = block[r * 4 + c];
    }
  }

  addRoundKey(state, w, nr);

  for (let round = nr - 1; round >= 1; round--) {
    invShiftRows(state);
    invSubBytes(state);
    addRoundKey(state, w, round);
    invMixColumns(state);
  }

  invShiftRows(state);
  invSubBytes(state);
  addRoundKey(state, w, 0);

  const output = new Uint8Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      output[r * 4 + c] = state[c * 4 + r];
    }
  }
  return output;
}

function aesCbcEncrypt(
  data: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
): Uint8Array {
  const w = keyExpansion(key);
  const numBlocks = data.length / 16;
  const output = new Uint8Array(data.length);
  let prevBlock = iv;

  for (let i = 0; i < numBlocks; i++) {
    const block = data.slice(i * 16, (i + 1) * 16);
    const xored = new Uint8Array(16);
    for (let j = 0; j < 16; j++) xored[j] = block[j] ^ prevBlock[j];
    const encrypted = aesEncryptBlock(xored, w);
    output.set(encrypted, i * 16);
    prevBlock = encrypted;
  }

  return output;
}

function aesCbcDecrypt(
  data: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
): Uint8Array {
  const w = keyExpansion(key);
  const numBlocks = data.length / 16;
  const output = new Uint8Array(data.length);
  let prevBlock = iv;

  for (let i = 0; i < numBlocks; i++) {
    const block = data.slice(i * 16, (i + 1) * 16);
    const decrypted = aesDecryptBlock(block, w);
    for (let j = 0; j < 16; j++) output[i * 16 + j] = decrypted[j] ^ prevBlock[j];
    prevBlock = block;
  }

  return output;
}
