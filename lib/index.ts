/**
 * Lib barrel — re-exports all library utilities.
 */

// Secure storage helpers (legacy — uses expo-secure-store directly)
export {
  saveAccounts,
  loadAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
  generateId,
} from './secureStore';

// MeroShare API client (legacy — direct Axios wrapper)
export { MeroShareApiClient, meroshareApi } from './meroshareApi';

// NEPSE public data
export {
  getNEPSEIndex,
  getMarketMovers,
  getStockPrice,
  MOCK_NEPSE_INDEX,
  MOCK_SUB_INDICES,
  MOCK_TOP_GAINERS,
  MOCK_TOP_LOSERS,
  MOCK_HIGHEST_TURNOVER,
} from './nepseApi';

// Calculator utilities
export { calculateShareProfitLoss, breakEvenPrice } from './calculator';
export type { CGTType } from './calculator';

// ---------------------------------------------------------------------------
// Phase 2 & 3 modules (new)
// ---------------------------------------------------------------------------

// Security & encryption
export { encrypt, decrypt, generateEncryptionKey, sha256 } from '@/src/security/encryption';
export { getMasterKey, hasMasterKey } from '@/src/security/keychain';
export { encryptField, decryptField, encryptAccountCredentials, decryptAccountCredentials } from '@/src/security/vault';

// Database
export { getDatabase, closeDatabase, checkDatabaseIntegrity } from '@/src/db/database';

// API services
export { login, loginWithCache, logout, isTokenExpired } from '@/src/api/auth';
export { getActiveIssues, applyForIPO, checkReapplyEligibility, getApplicationHistory } from '@/src/api/ipo';
export { getAccountDetail, getPortfolioHoldings, getBanks, getBankBranches } from '@/src/api/portfolio';
export { getAvailableResults, checkAllotmentResult, bulkCheckResults } from '@/src/api/ipoResult';

// Services
export { bulkApply } from '@/src/services/BulkIPOService';
export * as AccountService from '@/src/services/AccountService';
export * as SyncService from '@/src/services/SyncService';
