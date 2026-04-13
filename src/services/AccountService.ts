/**
 * Account Service — Bulk IPO Apply Nepal
 *
 * Multi-account management: CRUD operations with encrypted storage.
 * Bridges the vault (encryption), database, and API layers.
 */

import * as Crypto from 'expo-crypto';
import { getDatabase } from '@/src/db/database';
import {
  encryptAccountCredentials,
  decryptAccountCredentials,
} from '@/src/security/vault';
import type { Account, AccountRow } from '@/src/models/Account';
import { accountRowToAccount } from '@/src/models/Account';
import { logger } from '@/src/utils/logger';
import { StorageError } from '@/src/utils/errors';
import { validateAccountFields } from '@/src/utils/validators';

const TAG = 'AccountService';

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/**
 * Get all stored accounts (decrypted).
 */
export async function getAllAccounts(): Promise<Account[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<AccountRow>(
      'SELECT * FROM accounts ORDER BY created_at DESC',
    );

    const accounts: Account[] = [];

    for (const row of rows) {
      try {
        const decrypted = await decryptAccountCredentials({
          encryptedPassword: row.encrypted_password,
          encryptedCrn: row.encrypted_crn,
          encryptedPin: row.encrypted_pin,
        });

        accounts.push(
          accountRowToAccount(
            row,
            decrypted.password,
            decrypted.crn,
            decrypted.pin,
          ),
        );
      } catch (err) {
        logger.error(TAG, `Failed to decrypt account ${row.id}`, err);
        // Skip corrupt accounts rather than crashing
      }
    }

    return accounts;
  } catch (err) {
    logger.error(TAG, 'Failed to load accounts', err);
    throw new StorageError('Failed to load accounts from database.');
  }
}

/**
 * Get a single account by ID (decrypted).
 */
export async function getAccountById(id: string): Promise<Account | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<AccountRow>(
      'SELECT * FROM accounts WHERE id = ?',
      [id],
    );

    if (!row) return null;

    const decrypted = await decryptAccountCredentials({
      encryptedPassword: row.encrypted_password,
      encryptedCrn: row.encrypted_crn,
      encryptedPin: row.encrypted_pin,
    });

    return accountRowToAccount(
      row,
      decrypted.password,
      decrypted.crn,
      decrypted.pin,
    );
  } catch (err) {
    logger.error(TAG, `Failed to get account ${id}`, err);
    return null;
  }
}

/**
 * Add a new account with encrypted credentials.
 */
export async function addAccount(
  account: Omit<Account, 'id' | 'createdAt'>,
): Promise<Account> {
  // Validate fields
  validateAccountFields({
    dpId: account.dpId,
    username: account.username,
    password: account.password,
    crn: account.crn,
    pin: account.pin,
  });

  const id = Crypto.randomUUID();
  const createdAt = new Date().toISOString();

  // Encrypt sensitive fields
  const encrypted = await encryptAccountCredentials({
    password: account.password,
    crn: account.crn,
    pin: account.pin,
  });

  const db = await getDatabase();

  await db.runAsync(
    `INSERT INTO accounts (
      id, nickname, dp_id, username, encrypted_password, encrypted_crn,
      encrypted_pin, bank_id, bank_name, branch_id, account_number,
      demat, is_active, created_at, last_used
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      account.nickname,
      account.dpId,
      account.username,
      encrypted.encryptedPassword,
      encrypted.encryptedCrn,
      encrypted.encryptedPin,
      account.bankId,
      account.bankName,
      account.branchId ?? null,
      account.accountNumber ?? null,
      account.demat ?? null,
      account.isActive ? 1 : 0,
      createdAt,
      account.lastUsed ?? null,
    ],
  );

  logger.info(TAG, `Account added: ${id} (${account.nickname})`);

  return {
    ...account,
    id,
    createdAt,
  };
}

/**
 * Update an existing account.
 */
export async function updateAccount(account: Account): Promise<void> {
  validateAccountFields({
    dpId: account.dpId,
    username: account.username,
    password: account.password,
    crn: account.crn,
    pin: account.pin,
  });

  const encrypted = await encryptAccountCredentials({
    password: account.password,
    crn: account.crn,
    pin: account.pin,
  });

  const db = await getDatabase();

  const result = await db.runAsync(
    `UPDATE accounts SET
      nickname = ?, dp_id = ?, username = ?, encrypted_password = ?,
      encrypted_crn = ?, encrypted_pin = ?, bank_id = ?, bank_name = ?,
      branch_id = ?, account_number = ?, demat = ?, is_active = ?,
      last_used = ?
    WHERE id = ?`,
    [
      account.nickname,
      account.dpId,
      account.username,
      encrypted.encryptedPassword,
      encrypted.encryptedCrn,
      encrypted.encryptedPin,
      account.bankId,
      account.bankName,
      account.branchId ?? null,
      account.accountNumber ?? null,
      account.demat ?? null,
      account.isActive ? 1 : 0,
      account.lastUsed,
      account.id,
    ],
  );

  if (result.changes === 0) {
    throw new StorageError(`Account ${account.id} not found.`);
  }

  logger.info(TAG, `Account updated: ${account.id}`);
}

/**
 * Delete an account by ID.
 */
export async function deleteAccount(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM accounts WHERE id = ?', [id]);
  logger.info(TAG, `Account deleted: ${id}`);
}

/**
 * Toggle the isActive flag for an account.
 */
export async function toggleAccountActive(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE accounts SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?',
    [id],
  );
}

/**
 * Update the last_used timestamp for an account.
 */
export async function touchAccount(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE accounts SET last_used = ? WHERE id = ?',
    [new Date().toISOString(), id],
  );
}

/**
 * Get all active accounts (decrypted).
 */
export async function getActiveAccounts(): Promise<Account[]> {
  const all = await getAllAccounts();
  return all.filter((a) => a.isActive);
}

/**
 * Get the count of stored accounts.
 */
export async function getAccountCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM accounts',
  );
  return result?.count ?? 0;
}
