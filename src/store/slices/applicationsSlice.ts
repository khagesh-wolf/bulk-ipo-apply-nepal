/**
 * Applications Slice (Zustand) — Bulk IPO Apply Nepal
 *
 * Manages IPO application records and bulk-apply orchestration.
 * Persists to the SQLite database via the SyncService.
 */

import { create } from 'zustand';
import { generateUUID } from '@/src/utils/uuid';
import type { IPOApplication, BulkApplyResult } from '@/src/models/IPOApplication';
import { bulkApply } from '@/src/services/BulkIPOService';
import type { BulkApplyConfig } from '@/src/services/BulkIPOService';
import {
  saveApplication,
  loadApplications,
  updateApplicationStatus,
  deleteApplication as dbDeleteApplication,
} from '@/src/services/SyncService';
import {
  bulkCheckResults,
} from '@/src/api/ipoResult';
import { buildBoid } from '@/src/models/Account';
import type { Account } from '@/src/models/Account';
import { logger } from '@/src/utils/logger';
import { getUserMessage } from '@/src/utils/errors';

const TAG = 'ApplicationsSlice';

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface ApplicationsState {
  applications: IPOApplication[];
  isApplying: boolean;
  isChecking: boolean;
  isLoading: boolean;
  error: string | null;
  lastBulkResults: BulkApplyResult[];
  progress: Map<string, string>; // accountId → status message

  /** Load applications from database. */
  loadApplications: () => Promise<void>;

  /** Run bulk apply for an IPO across selected accounts. */
  applyBulk: (
    accounts: Account[],
    companyShareId: number,
    companyName: string,
    symbol: string,
    appliedKitta: number,
    delayBetweenMs?: number,
  ) => Promise<BulkApplyResult[]>;

  /** Check allotment results for applied applications. */
  checkResults: (
    accounts: Account[],
    companyShareId: number,
  ) => Promise<void>;

  /** Remove an application record. */
  removeApplication: (id: string) => void;

  /** Clear error state. */
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

export const useApplicationsSlice = create<ApplicationsState>((set, get) => ({
  applications: [],
  isApplying: false,
  isChecking: false,
  isLoading: false,
  error: null,
  lastBulkResults: [],
  progress: new Map(),

  loadApplications: async () => {
    set({ isLoading: true, error: null });
    try {
      const apps = await loadApplications();
      set({ applications: apps, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: getUserMessage(err) });
    }
  },

  applyBulk: async (
    accounts,
    companyShareId,
    companyName,
    symbol,
    appliedKitta,
    delayBetweenMs = 2000,
  ) => {
    set({ isApplying: true, error: null, lastBulkResults: [], progress: new Map() });

    const config: BulkApplyConfig = {
      accounts,
      companyShareId,
      appliedKitta,
      delayBetweenMs,
      maxRetries: 1,
      onProgress: (accountId, status, message) => {
        set((state) => {
          const newProgress = new Map(state.progress);
          newProgress.set(accountId, `${status}: ${message ?? ''}`);
          return { progress: newProgress };
        });
      },
    };

    try {
      const report = await bulkApply(config);
      const { applications } = get();

      // Create application records
      const newApps: IPOApplication[] = await Promise.all(
        report.results.map(async (result) => {
          const app: IPOApplication = {
            id: generateUUID(),
            accountId: result.accountId,
            accountNickname: result.accountNickname,
            issueId: String(companyShareId),
            companyName,
            symbol,
            appliedUnits: appliedKitta,
            appliedDate: new Date().toISOString(),
            status: result.success ? 'APPLIED' : 'FAILED',
            errorMessage: result.errorMessage,
            applicantFormId: result.applicationId,
          };

          // Persist to database
          await saveApplication(app);
          return app;
        }),
      );

      set({
        applications: [...newApps, ...applications],
        isApplying: false,
        lastBulkResults: report.results,
      });

      return report.results;
    } catch (err) {
      set({ isApplying: false, error: getUserMessage(err) });
      return [];
    }
  },

  checkResults: async (accounts, companyShareId) => {
    set({ isChecking: true, error: null });

    try {
      const { applications } = get();
      const appliedApps = applications.filter(
        (a) =>
          a.status === 'APPLIED' &&
          a.issueId === String(companyShareId),
      );

      if (appliedApps.length === 0) {
        set({ isChecking: false });
        return;
      }

      // Build BOID list from accounts
      const boidList = appliedApps
        .map((app) => {
          const account = accounts.find((a) => a.id === app.accountId);
          if (!account) return null;
          return {
            accountId: account.id,
            boid: buildBoid(account.dpId, account.crn),
            nickname: account.nickname,
          };
        })
        .filter((b): b is NonNullable<typeof b> => b !== null);

      const checkResults = await bulkCheckResults(boidList, companyShareId);

      // Update application records
      const updatedApps = applications.map((app) => {
        const result = checkResults.find((r) => r.accountId === app.accountId);
        if (!result || app.issueId !== String(companyShareId)) return app;

        const newStatus = result.result.isAllotted ? 'ALLOTTED' : 'NOT_ALLOTTED';
        const updated: IPOApplication = {
          ...app,
          status: newStatus as IPOApplication['status'],
          allottedUnits: result.result.allottedUnits,
        };

        // Persist status update
        updateApplicationStatus(app.id, newStatus, result.result.allottedUnits);
        return updated;
      });

      set({ applications: updatedApps, isChecking: false });
    } catch (err) {
      set({ isChecking: false, error: getUserMessage(err) });
    }
  },

  removeApplication: (id) => {
    dbDeleteApplication(id);
    set((state) => ({
      applications: state.applications.filter((a) => a.id !== id),
    }));
  },

  clearError: () => set({ error: null }),
}));

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectApplicationsByAccount =
  (accountId: string) =>
  (state: ApplicationsState): IPOApplication[] =>
    state.applications.filter((a) => a.accountId === accountId);

export const selectApplicationsByIssue =
  (issueId: string) =>
  (state: ApplicationsState): IPOApplication[] =>
    state.applications.filter((a) => a.issueId === issueId);
