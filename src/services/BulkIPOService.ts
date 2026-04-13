/**
 * Bulk IPO Service — Bulk IPO Apply Nepal
 *
 * Orchestrates bulk IPO application across multiple accounts:
 * - Sequential login + apply per account
 * - Error handling with per-account retry
 * - Real-time status callbacks
 * - Transaction-like behavior tracking
 */

import { login, loginWithCache } from '@/src/api/auth';
import { applyForIPO } from '@/src/api/ipo';
import type { ApplyParams } from '@/src/api/ipo';
import type { Account } from '@/src/models/Account';
import { buildBoid } from '@/src/models/Account';
import type { BulkApplyResult } from '@/src/models/IPOApplication';
import { logger } from '@/src/utils/logger';
import { getUserMessage } from '@/src/utils/errors';

const TAG = 'BulkIPOService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BulkApplyConfig {
  /** Accounts to apply with */
  accounts: Account[];
  /** Company share ID of the IPO */
  companyShareId: number;
  /** Number of units (kitta) to apply for */
  appliedKitta: number;
  /** Transaction PIN (same for all accounts) */
  transactionPIN?: string;
  /** Delay between accounts in ms (to avoid rate limiting) */
  delayBetweenMs?: number;
  /** Max retries per account */
  maxRetries?: number;
  /** Progress callback */
  onProgress?: (
    accountId: string,
    status: 'logging_in' | 'applying' | 'success' | 'failed',
    message?: string,
  ) => void;
}

export interface BulkApplyReport {
  results: BulkApplyResult[];
  totalAccounts: number;
  successCount: number;
  failedCount: number;
  startedAt: string;
  completedAt: string;
}

// ---------------------------------------------------------------------------
// Bulk apply
// ---------------------------------------------------------------------------

/**
 * Apply for an IPO across multiple accounts sequentially.
 */
export async function bulkApply(
  config: BulkApplyConfig,
): Promise<BulkApplyReport> {
  const {
    accounts,
    companyShareId,
    appliedKitta,
    transactionPIN,
    delayBetweenMs = 2000,
    maxRetries = 1,
    onProgress,
  } = config;

  const startedAt = new Date().toISOString();
  const results: BulkApplyResult[] = [];

  logger.info(
    TAG,
    `Starting bulk apply for ${accounts.length} accounts, companyShareId=${companyShareId}`,
  );

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    let lastError = '';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Step 1: Login
        onProgress?.(account.id, 'logging_in');

        const loginResult = await loginWithCache(
          account.id,
          account.dpId,
          account.username,
          account.password,
        );

        // Step 2: Apply
        onProgress?.(account.id, 'applying');

        const boid = buildBoid(account.dpId, account.crn);

        const applyParams: ApplyParams = {
          companyShareId,
          demat: account.demat ?? boid,
          boid,
          accountNumber: account.crn,
          customerId: Number(loginResult.customerId),
          accountBranchId: Number(account.branchId ?? 0),
          appliedKitta,
          crnNumber: account.crn,
          transactionPIN: transactionPIN ?? account.pin,
          bankId: Number(account.bankId),
        };

        const applyResult = await applyForIPO(loginResult.token, applyParams);

        results.push({
          accountId: account.id,
          accountNickname: account.nickname,
          success: true,
          applicationId: applyResult.applicantFormId
            ? String(applyResult.applicantFormId)
            : undefined,
        });

        onProgress?.(account.id, 'success', applyResult.message);
        logger.info(TAG, `Account ${account.nickname}: Applied successfully`);
        break; // Success, no retry needed
      } catch (err) {
        lastError = getUserMessage(err);

        if (attempt < maxRetries) {
          logger.warn(
            TAG,
            `Account ${account.nickname}: Attempt ${attempt + 1} failed, retrying...`,
          );
          await delay(1000 * (attempt + 1));
        } else {
          // All retries exhausted
          results.push({
            accountId: account.id,
            accountNickname: account.nickname,
            success: false,
            errorMessage: lastError,
          });

          onProgress?.(account.id, 'failed', lastError);
          logger.error(
            TAG,
            `Account ${account.nickname}: Failed after ${maxRetries + 1} attempts: ${lastError}`,
          );
        }
      }
    }

    // Delay between accounts (except after last)
    if (i < accounts.length - 1 && delayBetweenMs > 0) {
      await delay(delayBetweenMs);
    }
  }

  const completedAt = new Date().toISOString();
  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  logger.info(
    TAG,
    `Bulk apply complete: ${successCount}/${accounts.length} succeeded, ${failedCount} failed`,
  );

  return {
    results,
    totalAccounts: accounts.length,
    successCount,
    failedCount,
    startedAt,
    completedAt,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
