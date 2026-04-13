/**
 * Portfolio Model — Bulk IPO Apply Nepal
 *
 * Represents portfolio holdings and cached portfolio data.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PortfolioHolding {
  symbol: string;
  companyName: string;
  scriptDesc?: string;
  currentBalance: number;    // total kitta held
  previousClosingPrice: number;
  lastTransactionPrice: number;
  valueOfLastTransPrice: number;
  valueOfPrevClosingPrice: number;
  accountId: string;
}

export interface PortfolioSummary {
  accountId: string;
  totalInvestment: number;
  totalCurrentValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  holdings: PortfolioHolding[];
  lastUpdated: string;       // ISO 8601
}

// ---------------------------------------------------------------------------
// Database row
// ---------------------------------------------------------------------------

export interface PortfolioRow {
  id: string;
  account_id: string;
  symbol: string;
  company_name: string;
  current_balance: number;
  previous_closing_price: number;
  last_transaction_price: number;
  value_of_last_trans_price: number;
  value_of_prev_closing_price: number;
  last_updated: string;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

export function portfolioRowToHolding(row: PortfolioRow): PortfolioHolding {
  return {
    symbol: row.symbol,
    companyName: row.company_name,
    currentBalance: row.current_balance,
    previousClosingPrice: row.previous_closing_price,
    lastTransactionPrice: row.last_transaction_price,
    valueOfLastTransPrice: row.value_of_last_trans_price,
    valueOfPrevClosingPrice: row.value_of_prev_closing_price,
    accountId: row.account_id,
  };
}

// ---------------------------------------------------------------------------
// Account detail (from MeroShare myDetail endpoint)
// ---------------------------------------------------------------------------

export interface AccountDetail {
  name: string;
  email: string;
  phone: string;
  address: string;
  dpId: string;
  clientCode: string;
  boid: string;
  bankName: string;
  bankAccountNumber: string;
  branchName: string;
}
