/**
 * Secure Account Storage
 *
 * Uses expo-secure-store on native (iOS Keychain / Android Keystore).
 * Falls back to @react-native-async-storage/async-storage on web since
 * SecureStore is not available in browsers.
 *
 * All accounts are serialised as a single JSON array under ACCOUNTS_KEY.
 */

import { Platform } from 'react-native';
import type { MeroShareAccount } from '@/types';

const ACCOUNTS_KEY = 'meroshare_accounts_v1';

// ---------------------------------------------------------------------------
// Storage adapter (platform-aware)
// ---------------------------------------------------------------------------

interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

function buildAdapter(): StorageAdapter {
  if (Platform.OS !== 'web') {
    // Native: expo-secure-store (Keychain / Keystore)
    // We import lazily to avoid bundling on web where the native module is absent.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SecureStore = require('expo-secure-store') as typeof import('expo-secure-store');
    return {
      getItem: (key) => SecureStore.getItemAsync(key),
      setItem: (key, value) => SecureStore.setItemAsync(key, value),
      removeItem: (key) => SecureStore.deleteItemAsync(key),
    };
  }

  // Web fallback: AsyncStorage
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require('@react-native-async-storage/async-storage')
    .default as typeof import('@react-native-async-storage/async-storage').default;

  return {
    getItem: (key) => AsyncStorage.getItem(key),
    setItem: (key, value) => AsyncStorage.setItem(key, value),
    removeItem: (key) => AsyncStorage.removeItem(key),
  };
}

const storage: StorageAdapter = buildAdapter();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function readAllAccounts(): Promise<MeroShareAccount[]> {
  try {
    const raw = await storage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MeroShareAccount[]) : [];
  } catch {
    return [];
  }
}

async function writeAllAccounts(accounts: MeroShareAccount[]): Promise<void> {
  await storage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Persist the full accounts array to secure storage.
 */
export async function saveAccounts(accounts: MeroShareAccount[]): Promise<void> {
  await writeAllAccounts(accounts);
}

/**
 * Load all accounts from secure storage. Returns [] on error.
 */
export async function loadAccounts(): Promise<MeroShareAccount[]> {
  return readAllAccounts();
}

/**
 * Append a new account. The caller must supply a fully-formed MeroShareAccount.
 */
export async function addAccount(account: MeroShareAccount): Promise<void> {
  const accounts = await readAllAccounts();
  // Prevent duplicate IDs
  if (accounts.some((a) => a.id === account.id)) {
    throw new Error(`Account with id "${account.id}" already exists.`);
  }
  accounts.push(account);
  await writeAllAccounts(accounts);
}

/**
 * Update an existing account (matched by id). Throws if not found.
 */
export async function updateAccount(account: MeroShareAccount): Promise<void> {
  const accounts = await readAllAccounts();
  const idx = accounts.findIndex((a) => a.id === account.id);
  if (idx === -1) {
    throw new Error(`Account with id "${account.id}" not found.`);
  }
  accounts[idx] = account;
  await writeAllAccounts(accounts);
}

/**
 * Remove an account by id. No-op if not found.
 */
export async function deleteAccount(id: string): Promise<void> {
  const accounts = await readAllAccounts();
  const filtered = accounts.filter((a) => a.id !== id);
  await writeAllAccounts(filtered);
}

/**
 * Generate a UUID v4.
 * Uses crypto.randomUUID() when available, otherwise falls back to a
 * pure-JS implementation that doesn't require native modules.
 */
export async function generateId(): Promise<string> {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  // Pure-JS UUID v4 fallback
  const bytes = new Uint8Array(16);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  // Set version (4) and variant (RFC 4122)
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
