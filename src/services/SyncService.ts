/**
 * Data Synchronization Service — Bulk IPO Apply Nepal
 *
 * Handles syncing between in-memory state and the database:
 * - Persisting application records
 * - Caching portfolio data
 * - Cleaning up expired tokens
 */

import { getDatabase } from '@/src/db/database';
import type { IPOApplication, ApplicationRow } from '@/src/models/IPOApplication';
import { applicationRowToApplication } from '@/src/models/IPOApplication';
import type { PortfolioHolding, PortfolioRow } from '@/src/models/Portfolio';
import { portfolioRowToHolding } from '@/src/models/Portfolio';
import { purgeExpiredTokens } from '@/src/api/auth';
import { logger } from '@/src/utils/logger';
import * as Crypto from 'expo-crypto';

const TAG = 'SyncService';

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

/**
 * Save an IPO application record to the database.
 */
export async function saveApplication(app: IPOApplication): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO applications (
        id, account_id, account_nickname, issue_id, company_name, symbol,
        applied_units, applied_date, status, error_message, allotted_units,
        applicant_form_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        app.id,
        app.accountId,
        app.accountNickname,
        app.issueId,
        app.companyName,
        app.symbol ?? '',
        app.appliedUnits,
        app.appliedDate,
        app.status,
        app.errorMessage ?? null,
        app.allottedUnits ?? null,
        app.applicantFormId ?? null,
      ],
    );
  } catch (err) {
    logger.error(TAG, `Failed to save application ${app.id}`, err);
  }
}

/**
 * Load all application records from the database.
 */
export async function loadApplications(): Promise<IPOApplication[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ApplicationRow>(
      'SELECT * FROM applications ORDER BY applied_date DESC',
    );
    return rows.map(applicationRowToApplication);
  } catch (err) {
    logger.error(TAG, 'Failed to load applications', err);
    return [];
  }
}

/**
 * Update the status of an application.
 */
export async function updateApplicationStatus(
  id: string,
  status: string,
  allottedUnits?: number,
): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE applications SET status = ?, allotted_units = ? WHERE id = ?',
      [status, allottedUnits ?? null, id],
    );
  } catch (err) {
    logger.error(TAG, `Failed to update application ${id}`, err);
  }
}

/**
 * Delete an application record.
 */
export async function deleteApplication(id: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM applications WHERE id = ?', [id]);
  } catch (err) {
    logger.error(TAG, `Failed to delete application ${id}`, err);
  }
}

/**
 * Get applications for a specific account.
 */
export async function getApplicationsByAccount(
  accountId: string,
): Promise<IPOApplication[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ApplicationRow>(
      'SELECT * FROM applications WHERE account_id = ? ORDER BY applied_date DESC',
      [accountId],
    );
    return rows.map(applicationRowToApplication);
  } catch (err) {
    logger.error(TAG, `Failed to load applications for account ${accountId}`, err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Portfolio cache
// ---------------------------------------------------------------------------

/**
 * Cache portfolio holdings for an account.
 */
export async function cachePortfolioHoldings(
  accountId: string,
  holdings: PortfolioHolding[],
): Promise<void> {
  try {
    const db = await getDatabase();
    const now = new Date().toISOString();

    // Clear existing portfolio for this account
    await db.runAsync('DELETE FROM portfolio WHERE account_id = ?', [accountId]);

    // Insert new holdings
    for (const holding of holdings) {
      const id = Crypto.randomUUID();
      await db.runAsync(
        `INSERT INTO portfolio (
          id, account_id, symbol, company_name, current_balance,
          previous_closing_price, last_transaction_price,
          value_of_last_trans_price, value_of_prev_closing_price, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          accountId,
          holding.symbol,
          holding.companyName,
          holding.currentBalance,
          holding.previousClosingPrice,
          holding.lastTransactionPrice,
          holding.valueOfLastTransPrice,
          holding.valueOfPrevClosingPrice,
          now,
        ],
      );
    }

    logger.info(TAG, `Cached ${holdings.length} holdings for account ${accountId}`);
  } catch (err) {
    logger.error(TAG, 'Failed to cache portfolio holdings', err);
  }
}

/**
 * Load cached portfolio holdings for an account.
 */
export async function loadCachedPortfolio(
  accountId: string,
): Promise<PortfolioHolding[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<PortfolioRow>(
      'SELECT * FROM portfolio WHERE account_id = ? ORDER BY symbol ASC',
      [accountId],
    );
    return rows.map(portfolioRowToHolding);
  } catch (err) {
    logger.error(TAG, `Failed to load cached portfolio for ${accountId}`, err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

/**
 * Run all cleanup tasks: purge expired tokens, etc.
 */
export async function runCleanup(): Promise<void> {
  try {
    await purgeExpiredTokens();
    logger.info(TAG, 'Cleanup completed');
  } catch (err) {
    logger.error(TAG, 'Cleanup failed', err);
  }
}
