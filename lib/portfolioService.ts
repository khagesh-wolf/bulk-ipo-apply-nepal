/**
 * Portfolio Analytics Service — Bulk IPO Apply Nepal
 *
 * Provides multi-account portfolio aggregation, WACC calculation,
 * real-time P&L tracking, and sector allocation analysis.
 */

import type {
  AggregatedPortfolio,
  AggregatedHolding,
  PortfolioHolding,
  StockData,
} from '@/types';

// ---------------------------------------------------------------------------
// Multi-Account Aggregation
// ---------------------------------------------------------------------------

/**
 * Aggregate portfolio holdings across multiple MeroShare accounts
 * into a single consolidated view.
 */
export function aggregatePortfolios(
  holdingsByAccount: Record<string, PortfolioHolding[]>,
  livePrices: Map<string, StockData>,
): AggregatedPortfolio {
  const symbolMap = new Map<string, AggregatedHolding>();

  for (const [accountId, holdings] of Object.entries(holdingsByAccount)) {
    for (const holding of holdings) {
      const existing = symbolMap.get(holding.symbol);
      const livePrice = livePrices.get(holding.symbol);
      const ltp = livePrice?.ltp ?? holding.lastTradedPrice;
      const sector = livePrice?.sector ?? 'Unknown';

      if (existing) {
        // Merge: recalculate weighted average cost
        const totalQty = existing.totalQuantity + holding.totalQuantity;
        const totalInvested =
          existing.investedAmount + holding.totalQuantity * holding.wacc;
        const newWacc = totalQty > 0 ? totalInvested / totalQty : 0;
        const currentValue = totalQty * ltp;
        const profitLoss = currentValue - totalInvested;

        existing.totalQuantity = totalQty;
        existing.weightedAvgCost = Number(newWacc.toFixed(2));
        existing.lastTradedPrice = ltp;
        existing.currentValue = Number(currentValue.toFixed(2));
        existing.investedAmount = Number(totalInvested.toFixed(2));
        existing.profitLoss = Number(profitLoss.toFixed(2));
        existing.profitLossPercent =
          totalInvested > 0
            ? Number(((profitLoss / totalInvested) * 100).toFixed(2))
            : 0;
        existing.sector = sector;
        if (!existing.accounts.includes(accountId)) {
          existing.accounts.push(accountId);
        }
      } else {
        const investedAmount = holding.totalQuantity * holding.wacc;
        const currentValue = holding.totalQuantity * ltp;
        const profitLoss = currentValue - investedAmount;

        symbolMap.set(holding.symbol, {
          symbol: holding.symbol,
          companyName: holding.companyName,
          totalQuantity: holding.totalQuantity,
          weightedAvgCost: holding.wacc,
          lastTradedPrice: ltp,
          currentValue: Number(currentValue.toFixed(2)),
          investedAmount: Number(investedAmount.toFixed(2)),
          profitLoss: Number(profitLoss.toFixed(2)),
          profitLossPercent:
            investedAmount > 0
              ? Number(((profitLoss / investedAmount) * 100).toFixed(2))
              : 0,
          sector,
          accounts: [accountId],
        });
      }
    }
  }

  const holdingsBySymbol = Array.from(symbolMap.values());

  // Sector allocation
  const holdingsBySector: Record<string, number> = {};
  for (const h of holdingsBySymbol) {
    holdingsBySector[h.sector] =
      (holdingsBySector[h.sector] ?? 0) + h.currentValue;
  }

  const totalInvestment = holdingsBySymbol.reduce(
    (sum, h) => sum + h.investedAmount,
    0,
  );
  const totalCurrentValue = holdingsBySymbol.reduce(
    (sum, h) => sum + h.currentValue,
    0,
  );
  const totalProfitLoss = totalCurrentValue - totalInvestment;
  const totalProfitLossPercent =
    totalInvestment > 0
      ? Number(((totalProfitLoss / totalInvestment) * 100).toFixed(2))
      : 0;

  return {
    totalInvestment: Number(totalInvestment.toFixed(2)),
    totalCurrentValue: Number(totalCurrentValue.toFixed(2)),
    totalProfitLoss: Number(totalProfitLoss.toFixed(2)),
    totalProfitLossPercent,
    holdingsBySector,
    holdingsBySymbol,
    accountCount: Object.keys(holdingsByAccount).length,
    lastUpdated: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// WACC Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate Weighted Average Cost of Capital (WACC) for a stock
 * across multiple purchase tranches.
 */
export function calculateWACC(
  tranches: Array<{ quantity: number; price: number }>,
): number {
  const totalQty = tranches.reduce((sum, t) => sum + t.quantity, 0);
  if (totalQty === 0) return 0;

  const totalCost = tranches.reduce(
    (sum, t) => sum + t.quantity * t.price,
    0,
  );

  return Number((totalCost / totalQty).toFixed(2));
}

// ---------------------------------------------------------------------------
// Sector Allocation
// ---------------------------------------------------------------------------

/**
 * Calculate percentage allocation of portfolio by sector.
 */
export function calculateSectorAllocation(
  holdingsBySector: Record<string, number>,
): Array<{ sector: string; value: number; percentage: number }> {
  const totalValue = Object.values(holdingsBySector).reduce(
    (sum, v) => sum + v,
    0,
  );

  if (totalValue === 0) return [];

  return Object.entries(holdingsBySector)
    .map(([sector, value]) => ({
      sector,
      value: Number(value.toFixed(2)),
      percentage: Number(((value / totalValue) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

// ---------------------------------------------------------------------------
// Performance Metrics
// ---------------------------------------------------------------------------

/**
 * Calculate daily return percentage.
 */
export function calculateDailyReturn(
  previousValue: number,
  currentValue: number,
): number {
  if (previousValue === 0) return 0;
  return Number(
    (((currentValue - previousValue) / previousValue) * 100).toFixed(4),
  );
}

/**
 * Calculate standard deviation of returns (risk metric).
 */
export function calculateStdDeviation(returns: number[]): number {
  if (returns.length < 2) return 0;

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const squaredDiffs = returns.map((r) => (r - mean) ** 2);
  const variance =
    squaredDiffs.reduce((sum, d) => sum + d, 0) / (returns.length - 1);

  return Number(Math.sqrt(variance).toFixed(4));
}

/**
 * Calculate portfolio beta relative to the benchmark (NEPSE index).
 */
export function calculateBeta(
  portfolioReturns: number[],
  benchmarkReturns: number[],
): number {
  if (
    portfolioReturns.length < 2 ||
    benchmarkReturns.length < 2 ||
    portfolioReturns.length !== benchmarkReturns.length
  ) {
    return 1; // default beta
  }

  const n = portfolioReturns.length;
  const meanP = portfolioReturns.reduce((s, r) => s + r, 0) / n;
  const meanB = benchmarkReturns.reduce((s, r) => s + r, 0) / n;

  let covariance = 0;
  let varianceB = 0;

  for (let i = 0; i < n; i++) {
    const diffP = portfolioReturns[i] - meanP;
    const diffB = benchmarkReturns[i] - meanB;
    covariance += diffP * diffB;
    varianceB += diffB * diffB;
  }

  covariance /= n - 1;
  varianceB /= n - 1;

  if (varianceB === 0) return 1;
  return Number((covariance / varianceB).toFixed(4));
}

/**
 * Calculate Sharpe Ratio.
 * Uses Nepal's risk-free rate (T-bill rate ≈ 5% annual, ~0.019% daily).
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate = 0.019,
): number {
  if (returns.length < 2) return 0;

  const meanReturn = returns.reduce((s, r) => s + r, 0) / returns.length;
  const stdDev = calculateStdDeviation(returns);

  if (stdDev === 0) return 0;

  return Number(((meanReturn - riskFreeRate) / stdDev).toFixed(4));
}
