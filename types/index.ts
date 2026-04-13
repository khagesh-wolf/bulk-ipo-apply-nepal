// ============================================================================
// MEROSHARE ACCOUNT
// ============================================================================

/**
 * A MeroShare DP (Depository Participant) account stored securely.
 * Password and PIN are kept in expo-secure-store, never in plain state.
 */
export interface MeroShareAccount {
  id: string;
  nickname: string;       // display name e.g. "My Laxmi Bank DP"
  dpId: string;           // DP ID e.g. "13060001234"
  username: string;       // MeroShare username
  password: string;       // stored encrypted via secure store
  crn: string;            // Capital Registration Number
  pin: string;            // 4-digit trading PIN
  bankId: string;         // bank ID from MeroShare
  bankName: string;
  isActive: boolean;
  createdAt: string;      // ISO 8601
  lastUsed: string | null;
}

// ============================================================================
// IPO / ISSUE
// ============================================================================

export type ShareType = 'Ordinary' | 'Right' | 'FPO' | 'Debenture' | 'Mutual Fund';
export type IssueStatus = 'Open' | 'Upcoming' | 'Closed';

/**
 * An IPO/Rights/FPO issue from the MeroShare applicable-issue endpoint.
 */
export interface IPOIssue {
  id: string;
  companyName: string;
  symbol: string;
  shareType: ShareType;
  openDate: string;       // ISO 8601
  closeDate: string;      // ISO 8601
  pricePerUnit: number;   // NPR
  minUnit: number;
  maxUnit: number;
  totalUnits: number;
  isOpen: boolean;
  statusLabel: IssueStatus;
  subIssueId: string;
  companyShareId: string;
}

// ============================================================================
// IPO APPLICATION
// ============================================================================

export type ApplicationStatus =
  | 'PENDING'
  | 'APPLIED'
  | 'ALLOTTED'
  | 'NOT_ALLOTTED'
  | 'FAILED';

/**
 * A single IPO application record, linked to one account.
 */
export interface IPOApplication {
  id: string;
  accountId: string;
  accountNickname: string;
  issueId: string;
  companyName: string;
  appliedUnits: number;
  appliedDate: string;    // ISO 8601
  status: ApplicationStatus;
  errorMessage?: string;
  allottedUnits?: number;
}

// ============================================================================
// PORTFOLIO
// ============================================================================

/**
 * A single stock holding in the DEMAT portfolio.
 */
export interface PortfolioHolding {
  symbol: string;
  companyName: string;
  totalQuantity: number;
  wacc: number;           // Weighted Average Cost of Capital (NPR)
  lastTradedPrice: number;
  currentValue: number;   // totalQuantity * lastTradedPrice
  investedAmount: number; // totalQuantity * wacc
  profitLoss: number;
  profitLossPercent: number;
  accountId: string;
}

// ============================================================================
// NEPSE MARKET DATA
// ============================================================================

/**
 * A NEPSE index (main or sub-index).
 */
export interface NEPSEIndex {
  indexName: string;
  currentValue: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  turnover: number;       // NPR crore
  updatedAt: string;      // ISO 8601
}

/**
 * Individual stock / scrip trading data.
 */
export interface StockData {
  symbol: string;
  companyName: string;
  ltp: number;            // Last Traded Price (NPR)
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  turnover: number;       // NPR
  sector: string;
  pe?: number;
  eps?: number;
  bookValue?: number;
}

// ============================================================================
// SHARE CALCULATOR
// ============================================================================

/**
 * Result from the NEPSE share profit/loss calculator.
 * Commission rates follow SEBON/broker rules as of 2024.
 */
export interface CalculatorResult {
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  investedAmount: number;
  saleAmount: number;
  brokerCommission: number;
  sebon: number;
  dpFee: number;
  capitalGainsTax: number;
  netProfitLoss: number;
  netProfitLossPercent: number;
}

// ============================================================================
// API RESPONSE SHAPES (internal use)
// ============================================================================

export interface MeroShareLoginResponse {
  token: string;
  customerId: string;
}

export interface MeroShareApplicableIssueRaw {
  id: number;
  companyName: string;
  scrip: string;
  shareTypeName: string;
  openDate: string;
  closeDate: string;
  minUnit: number;
  maxUnit: number;
  isOpen: boolean;
  statusName: string;
  subGroup: number;
  companyShareId: number;
  shareGroupName: string;
  issueOpenDate: string;
  issueCloseDate: string;
  sharePerUnit: number;
}

export interface MeroShareApplyParams {
  accountBranchId: number;
  accountNumber: string;
  appliedKitta: number;
  crnNumber: string;
  customerId: string;
  issueId: number;
  reservationTypeId: number;
}

export interface BulkApplyResult {
  accountId: string;
  accountNickname: string;
  success: boolean;
  applicationId?: string;
  errorMessage?: string;
}

// ============================================================================
// NEWS & ANNOUNCEMENTS (Phase 4)
// ============================================================================

export type NewsCategory =
  | 'IPO Announcements'
  | 'Company News'
  | 'Market Updates'
  | 'Regulatory News'
  | 'Dividend'
  | 'General';

export type NewsSource = 'ShareSansar' | 'Merolagani' | 'SEBON';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: NewsSource;
  category: NewsCategory;
  publishedAt: string;      // ISO 8601
  imageUrl?: string;
}

// ============================================================================
// FLOORSHEET (Phase 4)
// ============================================================================

export interface FloorsheetEntry {
  id: number;
  symbol: string;
  buyerBrokerId: number;
  sellerBrokerId: number;
  quantity: number;
  rate: number;
  amount: number;
  tradeTime: string;        // ISO 8601
}

// ============================================================================
// MARKET SUMMARY (Phase 4)
// ============================================================================

export interface MarketSummary {
  totalTradedShares: number;
  totalTradedValue: number;  // NPR
  totalTransactions: number;
  totalScripsTraded: number;
  totalMarketCap: number;    // NPR
  isOpen: boolean;
  asOf: string;              // ISO 8601
}

// ============================================================================
// WATCHLIST & ALERTS (Phase 5)
// ============================================================================

export interface WatchlistItem {
  symbol: string;
  companyName: string;
  sector: string;
  addedAt: string;           // ISO 8601
}

export type AlertType = 'PRICE_ABOVE' | 'PRICE_BELOW' | 'PORTFOLIO_PL';

export type AlertStatus = 'ACTIVE' | 'TRIGGERED' | 'DISMISSED';

export interface PriceAlert {
  id: string;
  symbol: string;
  alertType: AlertType;
  targetPrice: number;
  currentPrice?: number;
  status: AlertStatus;
  createdAt: string;         // ISO 8601
  triggeredAt?: string;      // ISO 8601
}

// ============================================================================
// PORTFOLIO ANALYTICS (Phase 5)
// ============================================================================

export interface AggregatedPortfolio {
  totalInvestment: number;
  totalCurrentValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  holdingsBySector: Record<string, number>;  // sector → value
  holdingsBySymbol: AggregatedHolding[];
  accountCount: number;
  lastUpdated: string;       // ISO 8601
}

export interface AggregatedHolding {
  symbol: string;
  companyName: string;
  totalQuantity: number;
  weightedAvgCost: number;   // WACC across all accounts
  lastTradedPrice: number;
  currentValue: number;
  investedAmount: number;
  profitLoss: number;
  profitLossPercent: number;
  sector: string;
  accounts: string[];        // accountIds holding this stock
}

// ============================================================================
// DIVIDEND & BONUS TRACKER (Phase 5)
// ============================================================================

export type DividendType = 'Cash' | 'Bonus' | 'Right';

export interface DividendRecord {
  id: string;
  symbol: string;
  companyName: string;
  type: DividendType;
  rate: number;              // percentage
  amount?: number;           // per share NPR (for cash dividend)
  bookCloseDate: string;     // ISO 8601
  paymentDate?: string;      // ISO 8601
  fiscalYear: string;        // e.g. "2080/81"
}

// ============================================================================
// BROKER DIRECTORY (Phase 5)
// ============================================================================

export interface BrokerInfo {
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  tmsUrl: string;
  commissionRate: number;    // percentage e.g. 0.40
}

// ============================================================================
// IPO RETURN CALCULATOR (Phase 5)
// ============================================================================

export interface IPOReturnResult {
  ipoPrice: number;
  allottedQuantity: number;
  currentPrice: number;
  investedAmount: number;
  currentValue: number;
  profitLoss: number;
  roiPercent: number;
}

// ============================================================================
// DIVIDEND INCOME CALCULATOR (Phase 5)
// ============================================================================

export interface DividendIncomeResult {
  symbol: string;
  quantity: number;
  faceValue: number;         // NPR 100 standard
  dividendRate: number;      // percentage
  grossDividend: number;
  taxAmount: number;          // 5% TDS
  netDividend: number;
}

// ============================================================================
// STOCK SCREENER (Phase 5)
// ============================================================================

export interface ScreenerFilter {
  sector?: string;
  minPE?: number;
  maxPE?: number;
  minEPS?: number;
  maxEPS?: number;
  minVolume?: number;
  minMarketCap?: number;
  sortBy?: 'changePercent' | 'volume' | 'turnover' | 'pe' | 'eps';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// TECHNICAL ANALYSIS (Phase 5)
// ============================================================================

export interface OHLCV {
  date: string;              // ISO 8601
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema12?: number;
  ema26?: number;
  rsi14?: number;
  macdLine?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bollingerUpper?: number;
  bollingerMiddle?: number;
  bollingerLower?: number;
}

// ============================================================================
// PERFORMANCE REPORT (Phase 5)
// ============================================================================

export interface PerformanceReport {
  period: string;              // e.g. "2024-01" or "2024-W01"
  totalReturn: number;
  totalReturnPercent: number;
  benchmarkReturn: number;     // NEPSE index return
  benchmarkReturnPercent: number;
  alpha: number;               // excess return vs benchmark
  standardDeviation: number;
  beta: number;
  sharpeRatio: number;
}
