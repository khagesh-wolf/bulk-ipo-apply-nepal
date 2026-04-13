/**
 * Keychain Management — Bulk IPO Apply Nepal
 *
 * Manages the master encryption key. On native platforms the key is stored
 * in expo-secure-store (iOS Keychain / Android Keystore). On web it falls
 * back to AsyncStorage.
 *
 * The master key is generated once and persists for the lifetime of the app.
 */

import { Platform } from 'react-native';
import { generateEncryptionKey } from './encryption';
import { logger } from '@/src/utils/logger';

const TAG = 'Keychain';
const MASTER_KEY_ALIAS = 'bulk_ipo_master_key_v1';

// ---------------------------------------------------------------------------
// Storage adapter (same pattern as lib/secureStore.ts)
// ---------------------------------------------------------------------------

interface KeychainAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

function buildKeychainAdapter(): KeychainAdapter {
  if (Platform.OS !== 'web') {
    const SecureStore =
      require('expo-secure-store') as typeof import('expo-secure-store');
    return {
      get: (key) => SecureStore.getItemAsync(key),
      set: (key, value) => SecureStore.setItemAsync(key, value),
      remove: (key) => SecureStore.deleteItemAsync(key),
    };
  }

  const AsyncStorage =
    require('@react-native-async-storage/async-storage')
      .default as typeof import('@react-native-async-storage/async-storage').default;

  return {
    get: (key) => AsyncStorage.getItem(key),
    set: (key, value) => AsyncStorage.setItem(key, value),
    remove: (key) => AsyncStorage.removeItem(key),
  };
}

const adapter = buildKeychainAdapter();

// ---------------------------------------------------------------------------
// Master key cache
// ---------------------------------------------------------------------------

let masterKeyCache: string | null = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the master encryption key. Creates one if it doesn't exist.
 */
export async function getMasterKey(): Promise<string> {
  if (masterKeyCache) return masterKeyCache;

  try {
    let key = await adapter.get(MASTER_KEY_ALIAS);

    if (!key) {
      logger.info(TAG, 'No master key found, generating new one.');
      key = await generateEncryptionKey();
      await adapter.set(MASTER_KEY_ALIAS, key);
      logger.info(TAG, 'Master key generated and stored.');
    }

    masterKeyCache = key;
    return key;
  } catch (err) {
    logger.error(TAG, 'Failed to get/create master key', err);
    throw new Error('Failed to initialize encryption keychain.');
  }
}

/**
 * Clear the cached master key from memory.
 */
export function clearMasterKeyCache(): void {
  masterKeyCache = null;
}

/**
 * Delete the master key entirely (WARNING: all encrypted data becomes
 * unrecoverable). Used for factory reset.
 */
export async function deleteMasterKey(): Promise<void> {
  await adapter.remove(MASTER_KEY_ALIAS);
  masterKeyCache = null;
  logger.warn(TAG, 'Master key deleted. All encrypted data is now unrecoverable.');
}

/**
 * Check whether a master key exists.
 */
export async function hasMasterKey(): Promise<boolean> {
  const key = await adapter.get(MASTER_KEY_ALIAS);
  return key !== null;
}
