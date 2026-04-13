/**
 * IPO Store (Zustand)
 *
 * Manages active IPO issues, application records, and bulk-apply logic.
 * Uses the meroshareApi client to interact with CDSC MeroShare.
 *
 * Mock IPO data is used as the initial seed so the UI renders on web preview
 * and when the API is unreachable.
 */

import { create } from 'zustand';
import type { IPOIssue, IPOApplication, BulkApplyResult } from '@/types';
import { meroshareApi } from '@/lib/meroshareApi';
import { useAccountStore } from './accountStore';
import { generateId } from '@/lib/secureStore';

// ---------------------------------------------------------------------------
// Mock seed data — realistic Nepali companies
// ---------------------------------------------------------------------------

const TODAY = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];

function daysFromNow(n: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return fmt(d);
}

const MOCK_ISSUES: IPOIssue[] = [
  {
    id: 'mock-1',
    companyName: 'Himalayan Distillery Limited',
    symbol: 'HDL',
    shareType: 'Ordinary',
    openDate: fmt(TODAY),
    closeDate: daysFromNow(7),
    pricePerUnit: 100,
    minUnit: 10,
    maxUnit: 20,
    totalUnits: 2_500_000,
    isOpen: true,
    statusLabel: 'Open',
    subIssueId: '1001',
    companyShareId: '5001',
  },
  {
    id: 'mock-2',
    companyName: 'Nepal Reinsurance Company Limited',
    symbol: 'NRIC',
    shareType: 'Ordinary',
    openDate: fmt(TODAY),
    closeDate: daysFromNow(10),
    pricePerUnit: 100,
    minUnit: 10,
    maxUnit: 20,
    totalUnits: 5_000_000,
    isOpen: true,
    statusLabel: 'Open',
    subIssueId: '1002',
    companyShareId: '5002',
  },
  {
    id: 'mock-3',
    companyName: 'Siddhartha Energy Limited',
    symbol: 'SEL',
    shareType: 'Ordinary',
    openDate: fmt(TODAY),
    closeDate: daysFromNow(14),
    pricePerUnit: 100,
    minUnit: 10,
    maxUnit: 20,
    totalUnits: 3_200_000,
    isOpen: true,
    statusLabel: 'Open',
    subIssueId: '1003',
    companyShareId: '5003',
  },
  {
    id: 'mock-4',
    companyName: 'Mahila Sahayatra Microfinance Bittiya Sanstha',
    symbol: 'MSMBS',
    shareType: 'Right',
    openDate: daysFromNow(3),
    closeDate: daysFromNow(17),
    pricePerUnit: 100,
    minUnit: 10,
    maxUnit: 10,
    totalUnits: 1_500_000,
    isOpen: false,
    statusLabel: 'Upcoming',
    subIssueId: '1004',
    companyShareId: '5004',
  },
  {
    id: 'mock-5',
    companyName: 'Jyoti Bikash Bank Limited',
    symbol: 'JBBL',
    shareType: 'FPO',
    openDate: daysFromNow(5),
    closeDate: daysFromNow(19),
    pricePerUnit: 318,
    minUnit: 10,
    maxUnit: 50,
    totalUnits: 4_000_000,
    isOpen: false,
    statusLabel: 'Upcoming',
    subIssueId: '1005',
    companyShareId: '5005',
  },
];

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface IPOStore {
  activeIssues: IPOIssue[];
  applications: IPOApplication[];
  isApplying: boolean;
  isLoadingIssues: boolean;
  error: string | null;
  lastBulkResults: BulkApplyResult[];

  /** Fetch live issues from MeroShare (falls back to mock on error). */
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
  activeIssues: MOCK_ISSUES,
  applications: [],
  isApplying: false,
  isLoadingIssues: false,
  error: null,
  lastBulkResults: [],

  fetchActiveIssues: async () => {
    set({ isLoadingIssues: true, error: null });

    try {
      // To fetch issues we need any valid token — attempt with first active account
      const { accounts } = useAccountStore.getState();
      const activeAccount = accounts.find((a) => a.isActive);

      if (!activeAccount) {
        // No accounts configured — keep mock data
        set({ isLoadingIssues: false });
        return;
      }

      const { token } = await meroshareApi.login(
        activeAccount.dpId,
        activeAccount.username,
        activeAccount.password,
      );

      const issues = await meroshareApi.getActiveIssues(token);

      set({
        activeIssues: issues.length ? issues : MOCK_ISSUES,
        isLoadingIssues: false,
      });
    } catch {
      // Keep mock data on failure so the UI still renders
      set({ isLoadingIssues: false });
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
