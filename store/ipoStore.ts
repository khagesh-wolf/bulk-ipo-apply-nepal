/**
 * IPO Store (Zustand)
 *
 * Manages active IPO issues, application records, and bulk-apply logic.
 * Uses the meroshareApi client to interact with CDSC MeroShare.
 */

import { create } from 'zustand';
import type { IPOIssue, IPOApplication, BulkApplyResult, BulkCheckResult } from '@/types';
import { meroshareApi } from '@/lib/meroshareApi';
import { useAccountStore } from './accountStore';
import { generateId } from '@/lib/secureStore';

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface IPOStore {
  activeIssues: IPOIssue[];
  applications: IPOApplication[];
  isApplying: boolean;
  isLoadingIssues: boolean;
  isCheckingResults: boolean;
  error: string | null;
  lastBulkResults: BulkApplyResult[];
  lastCheckResults: BulkCheckResult[];

  /** Fetch live issues from MeroShare. */
  fetchActiveIssues: () => Promise<void>;

  /**
   * Bulk-apply for an issue across the given account IDs.
   * Uses the stored account credentials to login + apply sequentially.
   */
  applyBulk: (
    issueId: string,
    accountIds: string[],
    units: number,
  ) => Promise<BulkApplyResult[]>;

  /**
   * Check allotment results for all APPLIED applications.
   * Updates status to ALLOTTED / NOT_ALLOTTED as appropriate.
   */
  checkResults: () => Promise<void>;

  /**
   * Bulk check IPO allotment results for selected accounts.
   * Checks each account's allotment by building BOID and querying CDSC.
   */
  bulkCheckResults: (accountIds: string[]) => Promise<BulkCheckResult[]>;

  /** Clear error state. */
  clearError: () => void;

  /** Remove a single application record. */
  removeApplication: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildBoid(dpId: string, crn: string): string {
  // BOID is 16 digits: first 8 are DP ID digits, next 8 are account/CRN digits
  return (dpId.replace(/\D/g, '').padStart(8, '0') +
    crn.replace(/\D/g, '').padStart(8, '0')).slice(0, 16);
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

export const useIPOStore = create<IPOStore>((set, get) => ({
  activeIssues: [],
  applications: [],
  isApplying: false,
  isLoadingIssues: false,
  isCheckingResults: false,
  error: null,
  lastBulkResults: [],
  lastCheckResults: [],

  fetchActiveIssues: async () => {
    set({ isLoadingIssues: true, error: null });

    try {
      // To fetch issues we need any valid token — attempt with first active account
      const { accounts } = useAccountStore.getState();
      const activeAccount = accounts.find((a) => a.isActive);

      if (!activeAccount) {
        set({
          isLoadingIssues: false,
          error: 'Add a MeroShare account to view IPO issues.',
        });
        return;
      }

      const { token } = await meroshareApi.login(
        activeAccount.dpId,
        activeAccount.username,
        activeAccount.password,
      );

      const issues = await meroshareApi.getActiveIssues(token);

      set({
        activeIssues: issues,
        isLoadingIssues: false,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch IPO issues';
      set({ isLoadingIssues: false, error: message });
    }
  },

  applyBulk: async (issueId, accountIds, units) => {
    set({ isApplying: true, error: null, lastBulkResults: [] });

    const { activeIssues, applications } = get();
    const issue = activeIssues.find((i) => i.id === issueId);

    if (!issue) {
      set({ isApplying: false, error: 'IPO issue not found.' });
      return [];
    }

    const { accounts } = useAccountStore.getState();
    const selectedAccounts = accounts.filter(
      (a) => accountIds.includes(a.id) && a.isActive,
    );

    if (!selectedAccounts.length) {
      set({ isApplying: false, error: 'No active accounts selected.' });
      return [];
    }

    // Build results via the API client bulk helper
    const bulkResults = await meroshareApi.bulkApply(
      selectedAccounts,
      issueId,
      issue.companyShareId,
      units,
    );

    // Create application records
    const newApplications: IPOApplication[] = await Promise.all(
      bulkResults.map(async (result) => {
        const id = await generateId();
        return {
          id,
          accountId: result.accountId,
          accountNickname: result.accountNickname,
          issueId,
          companyName: issue.companyName,
          appliedUnits: units,
          appliedDate: new Date().toISOString(),
          status: result.success ? 'APPLIED' : ('FAILED' as const),
          errorMessage: result.errorMessage,
          allottedUnits: undefined,
        } satisfies IPOApplication;
      }),
    );

    set({
      applications: [...applications, ...newApplications],
      isApplying: false,
      lastBulkResults: bulkResults,
    });

    return bulkResults;
  },

  checkResults: async () => {
    const { applications } = get();
    const toCheck = applications.filter((a) => a.status === 'APPLIED');

    if (!toCheck.length) return;

    const { accounts } = useAccountStore.getState();
    const updatedApplications = [...applications];

    for (const application of toCheck) {
      const account = accounts.find((a) => a.id === application.accountId);
      if (!account) continue;

      try {
        const boid = buildBoid(account.dpId, account.crn);
        const result = await meroshareApi.checkAllotmentResult(boid);

        const idx = updatedApplications.findIndex(
          (a) => a.id === application.id,
        );
        if (idx !== -1) {
          updatedApplications[idx] = {
            ...updatedApplications[idx],
            status: result.isAllotted ? 'ALLOTTED' : 'NOT_ALLOTTED',
            allottedUnits: result.isAllotted ? result.allottedUnits : 0,
          };
        }
      } catch {
        // Leave status unchanged on error
      }
    }

    set({ applications: updatedApplications });
  },

  bulkCheckResults: async (accountIds) => {
    set({ isCheckingResults: true, error: null, lastCheckResults: [] });

    const { accounts } = useAccountStore.getState();
    const selectedAccounts = accounts.filter(
      (a) => accountIds.includes(a.id) && a.isActive,
    );

    if (!selectedAccounts.length) {
      set({ isCheckingResults: false, error: 'No active accounts selected.' });
      return [];
    }

    const results: BulkCheckResult[] = [];

    for (const account of selectedAccounts) {
      try {
        const boid = buildBoid(account.dpId, account.crn);
        const result = await meroshareApi.checkAllotmentResult(boid);

        results.push({
          accountId: account.id,
          accountNickname: account.nickname,
          status: result.isAllotted ? 'allotted' : 'not_allotted',
          allottedUnits: result.allottedUnits,
          message: result.message,
        });
      } catch (err) {
        console.error('[bulkCheckResults] allotment check failed for account', account.id, err);
        results.push({
          accountId: account.id,
          accountNickname: account.nickname,
          status: 'error',
          allottedUnits: 0,
          message: 'Failed to check allotment.',
        });
      }
    }

    // Update matching application records with allotment info
    const { applications } = get();
    const updatedApps = applications.map((app) => {
      const checkResult = results.find((r) => r.accountId === app.accountId);
      if (checkResult && app.status === 'APPLIED') {
        if (checkResult.status === 'allotted') {
          return { ...app, status: 'ALLOTTED' as const, allottedUnits: checkResult.allottedUnits };
        }
        if (checkResult.status === 'not_allotted') {
          return { ...app, status: 'NOT_ALLOTTED' as const, allottedUnits: 0 };
        }
        // For 'error' or 'pending', preserve APPLIED status — result is not yet definitive
      }
      return app;
    });

    set({
      isCheckingResults: false,
      lastCheckResults: results,
      applications: updatedApps,
    });

    return results;
  },

  clearError: () => set({ error: null }),

  removeApplication: (id) =>
    set((state) => ({
      applications: state.applications.filter((a) => a.id !== id),
    })),
}));

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** Open issues only */
export const selectOpenIssues = (state: IPOStore) =>
  state.activeIssues.filter((i) => i.isOpen);

/** Upcoming issues only */
export const selectUpcomingIssues = (state: IPOStore) =>
  state.activeIssues.filter((i) => !i.isOpen && i.statusLabel === 'Upcoming');

/** Applications for a given account */
export const selectApplicationsByAccount =
  (accountId: string) =>
  (state: IPOStore): IPOApplication[] =>
    state.applications.filter((a) => a.accountId === accountId);

/** Applications for a given issue */
export const selectApplicationsByIssue =
  (issueId: string) =>
  (state: IPOStore): IPOApplication[] =>
    state.applications.filter((a) => a.issueId === issueId);
