/**
 * Market Store (Zustand)
 *
 * Manages NEPSE index data, sub-indices, top gainers/losers, and
 * highest-turnover stocks. Backed by nepseApi.ts which uses
 * mock-data fallbacks for web / offline.
 */

import { create } from 'zustand';
import type { NEPSEIndex, StockData } from '@/types';
import {
  getNEPSEIndex,
  getMarketMovers,
  MOCK_NEPSE_INDEX,
  MOCK_SUB_INDICES,
  MOCK_TOP_GAINERS,
  MOCK_TOP_LOSERS,
  MOCK_HIGHEST_TURNOVER,
} from '@/lib/nepseApi';

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface MarketStore {
  nepseIndex: NEPSEIndex | null;
  subIndices: NEPSEIndex[];
  topGainers: StockData[];
  topLosers: StockData[];
  highestTurnover: StockData[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;

  /** Fetch all market data (index + movers) in one call. */
  fetchMarketData: () => Promise<void>;

  /** Fetch only the NEPSE index and sub-indices. */
  fetchIndex: () => Promise<void>;

  /** Fetch top gainers, losers, and highest turnover. */
  fetchMovers: () => Promise<void>;

  /** Clear error state. */
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

export const useMarketStore = create<MarketStore>((set) => ({
  // Seed with mock data immediately so the UI renders without a loading state
  nepseIndex: MOCK_NEPSE_INDEX,
  subIndices: MOCK_SUB_INDICES,
  topGainers: MOCK_TOP_GAINERS,
  topLosers: MOCK_TOP_LOSERS,
  highestTurnover: MOCK_HIGHEST_TURNOVER,
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchMarketData: async () => {
    set({ isLoading: true, error: null });

    try {
      const [indexData, moversData] = await Promise.all([
        getNEPSEIndex(),
        getMarketMovers(),
      ]);

      set({
        nepseIndex: indexData.nepseIndex,
        subIndices: indexData.subIndices,
        topGainers: moversData.topGainers,
        topLosers: moversData.topLosers,
        highestTurnover: moversData.highestTurnover,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch market data';

      // Keep existing (mock) data and just surface the error
      set({ isLoading: false, error: message });
    }
  },

  fetchIndex: async () => {
    set({ isLoading: true, error: null });

    try {
      const { nepseIndex, subIndices } = await getNEPSEIndex();
      set({
        nepseIndex,
        subIndices,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch NEPSE index';
      set({ isLoading: false, error: message });
    }
  },

  fetchMovers: async () => {
    set({ isLoading: true, error: null });

    try {
      const { topGainers, topLosers, highestTurnover } =
        await getMarketMovers();
      set({
        topGainers,
        topLosers,
        highestTurnover,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch market movers';
      set({ isLoading: false, error: message });
    }
  },

  clearError: () => set({ error: null }),
}));

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** Is the market currently trending up overall? */
export const selectMarketIsUp = (state: MarketStore): boolean =>
  (state.nepseIndex?.change ?? 0) >= 0;

/** Format the NEPSE index change as a signed string, e.g. "+18.42" */
export const selectFormattedChange = (state: MarketStore): string => {
  const change = state.nepseIndex?.change ?? 0;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}`;
};

/** Return the top N gainers */
export const selectTopNGainers =
  (n: number) =>
  (state: MarketStore): StockData[] =>
    state.topGainers.slice(0, n);

/** Return the top N losers */
export const selectTopNLosers =
  (n: number) =>
  (state: MarketStore): StockData[] =>
    state.topLosers.slice(0, n);

/** Return the top N by turnover */
export const selectTopNTurnover =
  (n: number) =>
  (state: MarketStore): StockData[] =>
    state.highestTurnover.slice(0, n);
