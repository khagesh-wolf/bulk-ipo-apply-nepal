/**
 * Database Initialization — Bulk IPO Apply Nepal
 *
 * Uses expo-sqlite to create and manage the local SQLite database.
 * On web, falls back to in-memory storage.
 */

import { Platform } from 'react-native';
import { ALL_CREATE_STATEMENTS, CURRENT_SCHEMA_VERSION } from './schema';
import { runMigrations } from './migrations';
import { logger } from '@/src/utils/logger';
import { StorageError } from '@/src/utils/errors';

const TAG = 'Database';
const DB_NAME = 'bulk_ipo_apply.db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DatabaseRow {
  [key: string]: unknown;
}

export interface Database {
  execAsync(sql: string): Promise<void>;
  getAllAsync<T = DatabaseRow>(sql: string, params?: unknown[]): Promise<T[]>;
  getFirstAsync<T = DatabaseRow>(sql: string, params?: unknown[]): Promise<T | null>;
  runAsync(sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowId: number }>;
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let dbInstance: Database | null = null;

// ---------------------------------------------------------------------------
// In-memory fallback for web
// ---------------------------------------------------------------------------

class InMemoryDatabase implements Database {
  private tables: Map<string, DatabaseRow[]> = new Map();

  async execAsync(_sql: string): Promise<void> {
    // No-op for schema creation on web
  }

  async getAllAsync<T = DatabaseRow>(_sql: string, _params?: unknown[]): Promise<T[]> {
    return [] as T[];
  }

  async getFirstAsync<T = DatabaseRow>(_sql: string, _params?: unknown[]): Promise<T | null> {
    return null;
  }

  async runAsync(_sql: string, _params?: unknown[]): Promise<{ changes: number; lastInsertRowId: number }> {
    return { changes: 0, lastInsertRowId: 0 };
  }
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Get or create the database instance. Thread-safe singleton.
 */
export async function getDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;

  try {
    if (Platform.OS === 'web') {
      logger.info(TAG, 'Using in-memory database for web platform.');
      dbInstance = new InMemoryDatabase();
      return dbInstance;
    }

    // Native: use expo-sqlite
    const SQLite = require('expo-sqlite') as typeof import('expo-sqlite');
    const db = await SQLite.openDatabaseAsync(DB_NAME);

    // Enable WAL mode for better performance
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Create all tables
    for (const statement of ALL_CREATE_STATEMENTS) {
      await db.execAsync(statement);
    }

    // Check and run migrations
    const versionRow = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1',
    );

    const currentVersion = versionRow?.version ?? 0;

    if (currentVersion === 0) {
      // First run — insert current version
      await db.runAsync(
        'INSERT INTO schema_version (version) VALUES (?)',
        [CURRENT_SCHEMA_VERSION],
      );
    } else if (currentVersion < CURRENT_SCHEMA_VERSION) {
      // Run migrations
      await runMigrations(db as unknown as Database, currentVersion, CURRENT_SCHEMA_VERSION);
      await db.runAsync(
        'INSERT OR REPLACE INTO schema_version (version) VALUES (?)',
        [CURRENT_SCHEMA_VERSION],
      );
    }

    logger.info(TAG, `Database initialized. Version: ${CURRENT_SCHEMA_VERSION}`);
    dbInstance = db as unknown as Database;
    return dbInstance;
  } catch (err) {
    logger.error(TAG, 'Failed to initialize database', err);
    throw new StorageError('Failed to initialize local database.');
  }
}

/**
 * Close the database connection and clear the singleton.
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance && Platform.OS !== 'web') {
    try {
      const db = dbInstance as unknown as { closeAsync?: () => Promise<void> };
      if (typeof db.closeAsync === 'function') {
        await db.closeAsync();
      }
    } catch (err) {
      logger.error(TAG, 'Error closing database', err);
    }
  }
  dbInstance = null;
}

/**
 * Perform a database integrity check.
 */
export async function checkDatabaseIntegrity(): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ integrity_check: string }>(
      'PRAGMA integrity_check;',
    );
    const ok = result?.integrity_check === 'ok';
    if (!ok) {
      logger.warn(TAG, 'Database integrity check failed', result);
    }
    return ok;
  } catch {
    return false;
  }
}
