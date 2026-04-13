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
export { calculateShareProfitLoss, breakEvenPrice, calculateIPOReturn, calculateDividendIncome, calculateCapitalGainsTax, calculateBonusShares } from './calculator';
export type { CGTType, CapitalGainsTaxResult } from './calculator';

// ---------------------------------------------------------------------------
// Phase 4 & 5 modules (new)
// ---------------------------------------------------------------------------

// News aggregation
export { fetchNews, filterNewsByCategory, categorizeNews, MOCK_NEWS } from './newsApi';

// Floorsheet & market summary
export { getFloorsheet, getMarketSummary, MOCK_FLOORSHEET, MOCK_MARKET_SUMMARY } from './floorsheetApi';

// Portfolio analytics
export { aggregatePortfolios, calculateWACC, calculateSectorAllocation, calculateDailyReturn, calculateStdDeviation, calculateBeta, calculateSharpeRatio } from './portfolioService';

// Stock screener
export { screenStocks, groupBySector, compareStocks, NEPSE_SECTORS } from './stockScreener';
export type { StockComparison, NEPSESector } from './stockScreener';

// Technical analysis
export { calculateSMA, calculateSMASeries, calculateEMA, calculateEMASeries, calculateRSI, calculateMACD, calculateBollingerBands, calculateAllIndicators } from './technicalAnalysis';
export type { MACDResult, BollingerBands } from './technicalAnalysis';

// Broker directory
export { BROKERS, searchBrokers, getBrokerById, getBrokerByCode, getTMSUrl, getBrokerLocations } from './brokerDirectory';

// Alert service
export { evaluateAlert, checkAlerts, formatAlertMessage, formatAlertType, validateAlertParams, getAlertStats } from './alertService';

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
