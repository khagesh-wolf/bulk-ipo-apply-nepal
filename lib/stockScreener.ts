/**
 * Stock Screener — Bulk IPO Apply Nepal
 *
 * Filter and sort stocks by fundamental metrics (PE, EPS, volume, etc.)
 * and technical criteria.
 */

import type { StockData, ScreenerFilter } from '@/types';

// ---------------------------------------------------------------------------
// Stock Screener
// ---------------------------------------------------------------------------

/**
 * Apply screening filters to a list of stocks.
 */
export function screenStocks(
  stocks: StockData[],
  filter: ScreenerFilter,
): StockData[] {
  let result = [...stocks];

  // Sector filter
  if (filter.sector) {
    const sector = filter.sector.toLowerCase();
    result = result.filter(
      (s) => s.sector.toLowerCase().includes(sector),
    );
  }

  // PE Ratio range
  if (filter.minPE !== undefined) {
    result = result.filter((s) => (s.pe ?? 0) >= filter.minPE!);
  }
  if (filter.maxPE !== undefined) {
    result = result.filter((s) => (s.pe ?? Infinity) <= filter.maxPE!);
  }

  // EPS range
  if (filter.minEPS !== undefined) {
    result = result.filter((s) => (s.eps ?? 0) >= filter.minEPS!);
  }
  if (filter.maxEPS !== undefined) {
    result = result.filter((s) => (s.eps ?? Infinity) <= filter.maxEPS!);
  }

  // Minimum volume
  if (filter.minVolume !== undefined) {
    result = result.filter((s) => s.volume >= filter.minVolume!);
  }

  // Minimum market cap (approx: ltp * volume as proxy)
  if (filter.minMarketCap !== undefined) {
    result = result.filter(
      (s) => s.ltp * s.volume >= filter.minMarketCap!,
    );
  }

  // Sorting
  if (filter.sortBy) {
    const order = filter.sortOrder === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      let valA: number;
      let valB: number;

      switch (filter.sortBy) {
        case 'changePercent':
          valA = a.changePercent;
          valB = b.changePercent;
          break;
        case 'volume':
          valA = a.volume;
          valB = b.volume;
          break;
        case 'turnover':
          valA = a.turnover;
          valB = b.turnover;
          break;
        case 'pe':
          valA = a.pe ?? 0;
          valB = b.pe ?? 0;
          break;
        case 'eps':
          valA = a.eps ?? 0;
          valB = b.eps ?? 0;
          break;
        default:
          valA = 0;
          valB = 0;
      }

      return (valA - valB) * order;
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Sector Grouping
// ---------------------------------------------------------------------------

/**
 * Group stocks by sector.
 */
export function groupBySector(
  stocks: StockData[],
): Record<string, StockData[]> {
  const groups: Record<string, StockData[]> = {};

  for (const stock of stocks) {
    const sector = stock.sector || 'Unknown';
    if (!groups[sector]) groups[sector] = [];
    groups[sector].push(stock);
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Stock Comparison
// ---------------------------------------------------------------------------

export interface StockComparison {
  symbol: string;
  companyName: string;
  ltp: number;
  changePercent: number;
  pe: number | null;
  eps: number | null;
  bookValue: number | null;
  pbv: number | null;       // Price to Book Value
  volume: number;
  turnover: number;
}

/**
 * Compare two or more stocks side-by-side with calculated metrics.
 */
export function compareStocks(stocks: StockData[]): StockComparison[] {
  return stocks.map((s) => ({
    symbol: s.symbol,
    companyName: s.companyName,
    ltp: s.ltp,
    changePercent: s.changePercent,
    pe: s.pe ?? null,
    eps: s.eps ?? null,
    bookValue: s.bookValue ?? null,
    pbv:
      s.bookValue && s.bookValue > 0
        ? Number((s.ltp / s.bookValue).toFixed(2))
        : null,
    volume: s.volume,
    turnover: s.turnover,
  }));
}

// ---------------------------------------------------------------------------
// Available sectors in NEPSE
// ---------------------------------------------------------------------------

export const NEPSE_SECTORS = [
  'Commercial Banks',
  'Development Banks',
  'Finance',
  'Microfinance',
  'Life Insurance',
  'Non-Life Insurance',
  'Hydropower',
  'Manufacturing & Processing',
  'Hotels & Tourism',
  'Trading',
  'Investment',
  'Others',
  'Telecom',
  'Mutual Fund',
] as const;

export type NEPSESector = (typeof NEPSE_SECTORS)[number];
