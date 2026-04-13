/**
 * Store barrel — re-exports all Zustand stores from src/store/slices.
 *
 * These are the Phase 2/3 stores backed by SQLite + encrypted storage.
 */

export {
  useAccountsSlice,
  selectActiveAccounts,
  selectAccountById,
} from './slices/accountsSlice';

export {
  useApplicationsSlice,
  selectApplicationsByAccount,
  selectApplicationsByIssue,
} from './slices/applicationsSlice';

export {
  useAuthSlice,
} from './slices/authSlice';
