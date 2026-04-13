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
