/**
 * Database Migrations — Bulk IPO Apply Nepal
 *
 * Sequential migration system for evolving the SQLite schema.
 * Each migration function upgrades from version N to N+1.
 */

import type { Database } from './database';
import { logger } from '@/src/utils/logger';

const TAG = 'Migrations';

// ---------------------------------------------------------------------------
// Migration registry
// ---------------------------------------------------------------------------

type MigrationFn = (db: Database) => Promise<void>;

/**
 * Map of "from version" → migration function.
 * e.g. migrations[0] migrates from v0 → v1.
 */
const migrations: Record<number, MigrationFn> = {
  // v0 → v1: Initial schema (handled by CREATE TABLE statements)
  0: async (_db: Database) => {
    // Initial tables are created in database.ts, nothing to migrate.
    logger.info(TAG, 'Migration 0 → 1: Initial schema (no-op).');
  },
};

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

/**
 * Run all necessary migrations from `fromVersion` to `toVersion`.
 */
export async function runMigrations(
  db: Database,
  fromVersion: number,
  toVersion: number,
): Promise<void> {
  logger.info(TAG, `Running migrations from v${fromVersion} to v${toVersion}`);

  for (let v = fromVersion; v < toVersion; v++) {
    const migrateFn = migrations[v];
    if (!migrateFn) {
      logger.warn(TAG, `No migration found for v${v} → v${v + 1}, skipping.`);
      continue;
    }

    try {
      await migrateFn(db);
      logger.info(TAG, `Migration v${v} → v${v + 1} completed.`);
    } catch (err) {
      logger.error(TAG, `Migration v${v} → v${v + 1} FAILED`, err);
      throw err;
    }
  }

  logger.info(TAG, 'All migrations completed successfully.');
}
