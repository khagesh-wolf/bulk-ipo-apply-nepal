/**
 * Lib barrel — re-exports all library utilities.
 */

// Secure storage helpers
export {
  saveAccounts,
  loadAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
  generateId,
} from './secureStore';

// MeroShare API client
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
