/**
 * Accounts Slice (Zustand) — Bulk IPO Apply Nepal
 *
 * Manages MeroShare accounts with encrypted database-backed storage.
 * This is the Phase 2/3 replacement for the original accountStore.
 */

import { create } from 'zustand';
import type { Account } from '@/src/models/Account';
import * as AccountService from '@/src/services/AccountService';
import { logger } from '@/src/utils/logger';
import { getUserMessage } from '@/src/utils/errors';

const TAG = 'AccountsSlice';

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface AccountsState {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;

  /** Load all accounts from encrypted database. */
  loadAccounts: () => Promise<void>;

  /** Add a new account. */
  addAccount: (
    account: Omit<Account, 'id' | 'createdAt'>,
  ) => Promise<Account>;

  /** Update an existing account. */
  updateAccount: (account: Account) => Promise<void>;

  /** Delete an account by ID. */
  deleteAccount: (id: string) => Promise<void>;

  /** Toggle active state of an account. */
  toggleAccountActive: (id: string) => Promise<void>;

  /** Update last-used timestamp. */
  touchAccount: (id: string) => Promise<void>;

  /** Clear error state. */
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

export const useAccountsSlice = create<AccountsState>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  loadAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const accounts = await AccountService.getAllAccounts();
      set({ accounts, isLoading: false });
      logger.info(TAG, `Loaded ${accounts.length} accounts`);
    } catch (err) {
      const message = getUserMessage(err);
      set({ isLoading: false, error: message });
      logger.error(TAG, 'Failed to load accounts', err);
    }
  },

  addAccount: async (accountData) => {
    set({ isLoading: true, error: null });
    try {
      const newAccount = await AccountService.addAccount(accountData);
      set((state) => ({
        accounts: [newAccount, ...state.accounts],
        isLoading: false,
      }));
      return newAccount;
    } catch (err) {
      const message = getUserMessage(err);
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  updateAccount: async (account) => {
    set({ isLoading: true, error: null });
    try {
      await AccountService.updateAccount(account);
      set((state) => ({
        accounts: state.accounts.map((a) =>
          a.id === account.id ? account : a,
        ),
        isLoading: false,
      }));
    } catch (err) {
      const message = getUserMessage(err);
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  deleteAccount: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await AccountService.deleteAccount(id);
      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== id),
        isLoading: false,
      }));
    } catch (err) {
      const message = getUserMessage(err);
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  toggleAccountActive: async (id) => {
    try {
      await AccountService.toggleAccountActive(id);
      set((state) => ({
        accounts: state.accounts.map((a) =>
          a.id === id ? { ...a, isActive: !a.isActive } : a,
        ),
      }));
    } catch (err) {
      const message = getUserMessage(err);
      set({ error: message });
    }
  },

  touchAccount: async (id) => {
    try {
      await AccountService.touchAccount(id);
      const now = new Date().toISOString();
      set((state) => ({
        accounts: state.accounts.map((a) =>
          a.id === id ? { ...a, lastUsed: now } : a,
        ),
      }));
    } catch {
      // Non-critical
    }
  },

  clearError: () => set({ error: null }),
}));

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectActiveAccounts = (state: AccountsState) =>
  state.accounts.filter((a) => a.isActive);

export const selectAccountById =
  (id: string) =>
  (state: AccountsState): Account | undefined =>
    state.accounts.find((a) => a.id === id);
