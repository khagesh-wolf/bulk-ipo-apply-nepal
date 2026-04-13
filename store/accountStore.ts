/**
 * Account Store (Zustand)
 *
 * Manages the list of MeroShare DP accounts. Persists to expo-secure-store
 * (or AsyncStorage on web) via the secureStore lib.
 */

import { create } from 'zustand';
import type { MeroShareAccount } from '@/types';
import {
  loadAccounts as secureLoadAccounts,
  saveAccounts as secureSaveAccounts,
  addAccount as secureAddAccount,
  updateAccount as secureUpdateAccount,
  deleteAccount as secureDeleteAccount,
  generateId,
} from '@/lib/secureStore';

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface AccountStore {
  accounts: MeroShareAccount[];
  isLoading: boolean;
  error: string | null;

  /** Load all saved accounts from secure storage. */
  loadAccounts: () => Promise<void>;

  /** Add a new account (id and createdAt are generated automatically). */
  addAccount: (
    account: Omit<MeroShareAccount, 'id' | 'createdAt'>,
  ) => Promise<MeroShareAccount>;

  /** Update an existing account in-place. */
  updateAccount: (account: MeroShareAccount) => Promise<void>;

  /** Remove an account by id. */
  deleteAccount: (id: string) => Promise<void>;

  /** Mark an account as last-used now. */
  touchAccount: (id: string) => Promise<void>;

  /** Toggle the isActive flag. */
  toggleAccountActive: (id: string) => Promise<void>;

  /** Clear the error state. */
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  loadAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const accounts = await secureLoadAccounts();
      set({ accounts, isLoading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load accounts';
      set({ isLoading: false, error: message });
    }
  },

  addAccount: async (accountData) => {
    set({ isLoading: true, error: null });
    try {
      const id = await generateId();
      const newAccount: MeroShareAccount = {
        ...accountData,
        id,
        createdAt: new Date().toISOString(),
        lastUsed: null,
        isActive: accountData.isActive ?? true,
      };

      await secureAddAccount(newAccount);
      set((state) => ({
        accounts: [...state.accounts, newAccount],
        isLoading: false,
      }));

      return newAccount;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to add account';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  updateAccount: async (account) => {
    set({ isLoading: true, error: null });
    try {
      await secureUpdateAccount(account);
      set((state) => ({
        accounts: state.accounts.map((a) =>
          a.id === account.id ? account : a,
        ),
        isLoading: false,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update account';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  deleteAccount: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await secureDeleteAccount(id);
      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== id),
        isLoading: false,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete account';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  touchAccount: async (id) => {
    const { accounts } = get();
    const account = accounts.find((a) => a.id === id);
    if (!account) return;

    const updated: MeroShareAccount = {
      ...account,
      lastUsed: new Date().toISOString(),
    };

    try {
      await secureUpdateAccount(updated);
      set((state) => ({
        accounts: state.accounts.map((a) => (a.id === id ? updated : a)),
      }));
    } catch {
      // Non-critical; swallow silently
    }
  },

  toggleAccountActive: async (id) => {
    const { accounts } = get();
    const account = accounts.find((a) => a.id === id);
    if (!account) return;

    const updated: MeroShareAccount = {
      ...account,
      isActive: !account.isActive,
    };

    try {
      await secureUpdateAccount(updated);
      set((state) => ({
        accounts: state.accounts.map((a) => (a.id === id ? updated : a)),
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to toggle account';
      set({ error: message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));

// ---------------------------------------------------------------------------
// Selectors (exported for convenience)
// ---------------------------------------------------------------------------

/** Returns only accounts where isActive === true */
export const selectActiveAccounts = (state: AccountStore) =>
  state.accounts.filter((a) => a.isActive);

/** Returns an account by id */
export const selectAccountById =
  (id: string) =>
  (state: AccountStore): MeroShareAccount | undefined =>
    state.accounts.find((a) => a.id === id);
