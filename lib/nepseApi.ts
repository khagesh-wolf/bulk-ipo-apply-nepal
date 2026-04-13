/**
 * NEPSE / Nepal Stock Exchange public data client.
 *
 * Endpoints from nepalstock.com.np are public (no auth required) but will
 * be blocked by CORS in a web browser. The client always returns a mock data
 * fallback so the UI renders correctly during web preview and offline.
 *
 * On native devices the real API is attempted first; mock data is used on
 * any network/CORS error.
 */

import axios from 'axios';
import type { NEPSEIndex, StockData } from '@/types';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

const NEPAL_STOCK_BASE = 'https://nepalstock.com.np/api/nots';
const MARKET_OPEN_URL = `${NEPAL_STOCK_BASE}/nepse-data/market-open`;
const TODAY_PRICE_URL = `${NEPAL_STOCK_BASE}/nepse-data/today-price`;
const TOP_GAINERS_LOSERS_URL = `${NEPAL_STOCK_BASE}/securityDailyTradeStat/58`;

const API_TIMEOUT = 10_000;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const NOW = new Date().toISOString();

export const MOCK_NEPSE_INDEX: NEPSEIndex = {
  indexName: 'NEPSE',
  currentValue: 2_847.35,
  change: 18.42,
  changePercent: 0.65,
  high: 2_861.14,
  low: 2_830.27,
  turnover: 6_842_317_450,
  updatedAt: NOW,
};

export const MOCK_SUB_INDICES: NEPSEIndex[] = [
  {
    indexName: 'Banking Sub-Index',
    currentValue: 1_492.17,
    change: 9.33,
    changePercent: 0.63,
    high: 1_498.80,
    low: 1_483.42,
    turnover: 2_341_500_000,
    updatedAt: NOW,
  },
  {
    indexName: 'Development Bank Sub-Index',
    currentValue: 2_918.44,
    change: -12.55,
    changePercent: -0.43,
    high: 2_933.01,
    low: 2_910.88,
    turnover: 523_400_000,
    updatedAt: NOW,
  },
  {
    indexName: 'Finance Sub-Index',
    currentValue: 1_123.68,
    change: 5.12,
    changePercent: 0.46,
    high: 1_130.00,
    low: 1_118.25,
    turnover: 342_100_000,
    updatedAt: NOW,
  },
  {
    indexName: 'Hydropower Sub-Index',
    currentValue: 3_204.91,
    change: 27.40,
    changePercent: 0.86,
    high: 3_218.60,
    low: 3_192.17,
    turnover: 1_120_800_000,
    updatedAt: NOW,
  },
  {
    indexName: 'Insurance Sub-Index',
    currentValue: 8_624.53,
    change: -45.22,
    changePercent: -0.52,
    high: 8_675.00,
    low: 8_600.11,
    turnover: 894_300_000,
    updatedAt: NOW,
  },
  {
    indexName: 'Microfinance Sub-Index',
    currentValue: 2_041.77,
    change: 11.88,
    changePercent: 0.59,
    high: 2_050.00,
    low: 2_033.46,
    turnover: 215_600_000,
    updatedAt: NOW,
  },
  {
    indexName: 'Manufacturing & Processing Sub-Index',
    currentValue: 3_582.14,
    change: -8.67,
    changePercent: -0.24,
    high: 3_598.30,
    low: 3_575.50,
    turnover: 188_900_000,
    updatedAt: NOW,
  },
  {
    indexName: 'Hotels & Tourism Sub-Index',
    currentValue: 2_265.39,
    change: 14.71,
    changePercent: 0.65,
    high: 2_272.00,
    low: 2_252.83,
    turnover: 97_400_000,
    updatedAt: NOW,
  },
  {
    indexName: 'Trading Sub-Index',
    currentValue: 1_154.82,
    change: 3.45,
    changePercent: 0.30,
    high: 1_158.60,
    low: 1_150.20,
    turnover: 45_200_000,
    updatedAt: NOW,
  },
  {
    indexName: 'Investment Sub-Index',
    currentValue: 46.58,
    change: 0.23,
    changePercent: 0.50,
    high: 47.00,
    low: 46.20,
    turnover: 318_700_000,
    updatedAt: NOW,
  },
];

export const MOCK_TOP_GAINERS: StockData[] = [
  {
    symbol: 'NABIL',
    companyName: 'Nabil Bank Limited',
    ltp: 1_042.00,
    change: 94.36,
    changePercent: 9.96,
    open: 950.00,
    high: 1_042.00,
    low: 948.00,
    volume: 18_430,
    turnover: 18_920_450,
    sector: 'Commercial Banks',
    pe: 18.4,
    eps: 56.6,
    bookValue: 312.0,
  },
  {
    symbol: 'NICA',
    companyName: 'NIC Asia Bank Limited',
    ltp: 784.50,
    change: 71.30,
    changePercent: 9.99,
    open: 715.00,
    high: 784.50,
    low: 712.50,
    volume: 24_615,
    turnover: 19_296_307,
    sector: 'Commercial Banks',
    pe: 16.8,
    eps: 46.7,
    bookValue: 268.0,
  },
  {
    symbol: 'NTC',
    companyName: 'Nepal Telecom',
    ltp: 756.00,
    change: 68.72,
    changePercent: 9.99,
    open: 690.00,
    high: 756.00,
    low: 688.00,
    volume: 31_200,
    turnover: 23_587_200,
    sector: 'Telecom',
    pe: 21.2,
    eps: 35.7,
    bookValue: 196.0,
  },
  {
    symbol: 'NLIC',
    companyName: 'Nepal Life Insurance Company',
    ltp: 1_354.00,
    change: 122.90,
    changePercent: 9.98,
    open: 1_232.00,
    high: 1_354.00,
    low: 1_229.00,
    volume: 9_840,
    turnover: 13_323_360,
    sector: 'Life Insurance',
    pe: 28.7,
    eps: 47.2,
    bookValue: 245.0,
  },
  {
    symbol: 'HIDCL',
    companyName: 'Hydroelectricity Investment and Development Company',
    ltp: 312.60,
    change: 28.42,
    changePercent: 9.99,
    open: 285.00,
    high: 312.60,
    low: 284.00,
    volume: 45_320,
    turnover: 14_165_032,
    sector: 'Hydropower',
    pe: 12.4,
    eps: 25.2,
    bookValue: 145.0,
  },
];

export const MOCK_TOP_LOSERS: StockData[] = [
  {
    symbol: 'UPPER',
    companyName: 'Upper Tamakoshi Hydropower Ltd',
    ltp: 248.30,
    change: -27.56,
    changePercent: -9.99,
    open: 278.00,
    high: 280.50,
    low: 248.30,
    volume: 12_480,
    turnover: 3_098_784,
    sector: 'Hydropower',
    pe: 22.1,
    eps: 11.2,
    bookValue: 118.0,
  },
  {
    symbol: 'SANIMA',
    companyName: 'Sanima Bank Limited',
    ltp: 342.10,
    change: -37.90,
    changePercent: -9.98,
    open: 381.00,
    high: 382.00,
    low: 342.10,
    volume: 8_910,
    turnover: 3_048_111,
    sector: 'Commercial Banks',
    pe: 14.7,
    eps: 23.3,
    bookValue: 182.0,
  },
  {
    symbol: 'API',
    companyName: 'Api Power Company Limited',
    ltp: 178.40,
    change: -19.80,
    changePercent: -9.99,
    open: 198.50,
    high: 199.00,
    low: 178.40,
    volume: 19_350,
    turnover: 3_451_740,
    sector: 'Hydropower',
  },
  {
    symbol: 'LICN',
    companyName: 'Life Insurance Corporation (Nepal)',
    ltp: 966.00,
    change: -107.00,
    changePercent: -9.98,
    open: 1_074.00,
    high: 1_075.00,
    low: 966.00,
    volume: 3_620,
    turnover: 3_497_320,
    sector: 'Life Insurance',
    pe: 26.5,
    eps: 36.5,
    bookValue: 210.0,
  },
  {
    symbol: 'KPCL',
    companyName: 'Khudi Power Company Limited',
    ltp: 91.20,
    change: -10.13,
    changePercent: -9.99,
    open: 101.50,
    high: 102.00,
    low: 91.20,
    volume: 7_260,
    turnover: 662_112,
    sector: 'Hydropower',
  },
];

export const MOCK_HIGHEST_TURNOVER: StockData[] = [
  {
    symbol: 'NTC',
    companyName: 'Nepal Telecom',
    ltp: 756.00,
    change: 68.72,
    changePercent: 9.99,
    open: 690.00,
    high: 756.00,
    low: 688.00,
    volume: 31_200,
    turnover: 23_587_200,
    sector: 'Telecom',
  },
  {
    symbol: 'NICA',
    companyName: 'NIC Asia Bank Limited',
    ltp: 784.50,
    change: 71.30,
    changePercent: 9.99,
    open: 715.00,
    high: 784.50,
    low: 712.50,
    volume: 24_615,
    turnover: 19_296_307,
    sector: 'Commercial Banks',
  },
  {
    symbol: 'NABIL',
    companyName: 'Nabil Bank Limited',
    ltp: 1_042.00,
    change: 94.36,
    changePercent: 9.96,
    open: 950.00,
    high: 1_042.00,
    low: 948.00,
    volume: 18_430,
    turnover: 18_920_450,
    sector: 'Commercial Banks',
  },
  {
    symbol: 'HIDCL',
    companyName: 'Hydroelectricity Investment and Development Company',
    ltp: 312.60,
    change: 28.42,
    changePercent: 9.99,
    open: 285.00,
    high: 312.60,
    low: 284.00,
    volume: 45_320,
    turnover: 14_165_032,
    sector: 'Hydropower',
  },
  {
    symbol: 'NLIC',
    companyName: 'Nepal Life Insurance Company',
    ltp: 1_354.00,
    change: 122.90,
    changePercent: 9.98,
    open: 1_232.00,
    high: 1_354.00,
    low: 1_229.00,
    volume: 9_840,
    turnover: 13_323_360,
    sector: 'Life Insurance',
  },
];

// ---------------------------------------------------------------------------
// Raw API shapes
// ---------------------------------------------------------------------------

interface NepalStockMarketOpenResponse {
  isOpen?: boolean;
  nepseIndex?: {
    index?: number;
    change?: number;
    perChange?: number;
    high?: number;
    low?: number;
    as_of?: string;
  };
}

interface TodayPriceItem {
  symbol?: string;
  securityName?: string;
  lastTradedPrice?: number;
  percentageChange?: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  totalTradeQuantity?: number;
  totalTradeValue?: number;
  sectorName?: string;
}

interface DailyTradeStatItem {
  securityId?: number;
  symbol?: string;
  securityName?: string;
  lastTradedPrice?: number;
  percentageChange?: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  totalTradedQuantity?: number;
  totalTradedValue?: number;
  sectorName?: string;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapTodayPriceItem(item: TodayPriceItem): StockData {
  const ltp = item.lastTradedPrice ?? 0;
  const pctChange = item.percentageChange ?? 0;
  const change = ltp * (pctChange / 100);

  return {
    symbol: item.symbol ?? '',
    companyName: item.securityName ?? item.symbol ?? '',
    ltp,
    change,
    changePercent: pctChange,
    open: item.openPrice ?? ltp,
    high: item.highPrice ?? ltp,
    low: item.lowPrice ?? ltp,
    volume: item.totalTradeQuantity ?? 0,
    turnover: item.totalTradeValue ?? 0,
    sector: item.sectorName ?? 'Unknown',
  };
}

function mapDailyTradeStatItem(item: DailyTradeStatItem): StockData {
  const ltp = item.lastTradedPrice ?? 0;
  const pctChange = item.percentageChange ?? 0;
  const change = ltp * (pctChange / 100);

  return {
    symbol: item.symbol ?? '',
    companyName: item.securityName ?? item.symbol ?? '',
    ltp,
    change,
    changePercent: pctChange,
    open: item.openPrice ?? ltp,
    high: item.highPrice ?? ltp,
    low: item.lowPrice ?? ltp,
    volume: item.totalTradedQuantity ?? 0,
    turnover: item.totalTradedValue ?? 0,
    sector: item.sectorName ?? 'Unknown',
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the main NEPSE index. Falls back to mock data on CORS / network error.
 */
export async function getNEPSEIndex(): Promise<{
  nepseIndex: NEPSEIndex;
  subIndices: NEPSEIndex[];
}> {
  if (Platform.OS === 'web') {
    return { nepseIndex: MOCK_NEPSE_INDEX, subIndices: MOCK_SUB_INDICES };
  }

  try {
    const response = await axios.get<NepalStockMarketOpenResponse>(
      MARKET_OPEN_URL,
      { timeout: API_TIMEOUT },
    );

    const raw = response.data?.nepseIndex;
    if (!raw) throw new Error('Unexpected response shape');

    const nepseIndex: NEPSEIndex = {
      indexName: 'NEPSE',
      currentValue: raw.index ?? MOCK_NEPSE_INDEX.currentValue,
      change: raw.change ?? MOCK_NEPSE_INDEX.change,
      changePercent: raw.perChange ?? MOCK_NEPSE_INDEX.changePercent,
      high: raw.high ?? MOCK_NEPSE_INDEX.high,
      low: raw.low ?? MOCK_NEPSE_INDEX.low,
      turnover: MOCK_NEPSE_INDEX.turnover,
      updatedAt: raw.as_of ?? new Date().toISOString(),
    };

    return { nepseIndex, subIndices: MOCK_SUB_INDICES };
  } catch {
    return { nepseIndex: MOCK_NEPSE_INDEX, subIndices: MOCK_SUB_INDICES };
  }
}

/**
 * Fetch top gainers, top losers, and highest turnover stocks.
 * Falls back to mock data on CORS / network error.
 */
export async function getMarketMovers(): Promise<{
  topGainers: StockData[];
  topLosers: StockData[];
  highestTurnover: StockData[];
}> {
  if (Platform.OS === 'web') {
    return {
      topGainers: MOCK_TOP_GAINERS,
      topLosers: MOCK_TOP_LOSERS,
      highestTurnover: MOCK_HIGHEST_TURNOVER,
    };
  }

  try {
    const [priceRes, statRes] = await Promise.all([
      axios.get<{ content?: TodayPriceItem[] }>(TODAY_PRICE_URL, {
        timeout: API_TIMEOUT,
      }),
      axios.get<{ content?: DailyTradeStatItem[] }>(TOP_GAINERS_LOSERS_URL, {
        timeout: API_TIMEOUT,
      }),
    ]);

    const priceList: StockData[] = (priceRes.data?.content ?? []).map(
      mapTodayPriceItem,
    );

    const sorted = [...priceList].sort(
      (a, b) => b.changePercent - a.changePercent,
    );

    const topGainers = sorted.filter((s) => s.changePercent > 0).slice(0, 10);
    const topLosers = sorted
      .filter((s) => s.changePercent < 0)
      .reverse()
      .slice(0, 10);

    const highestTurnover = (statRes.data?.content ?? [])
      .map(mapDailyTradeStatItem)
      .sort((a, b) => b.turnover - a.turnover)
      .slice(0, 10);

    return {
      topGainers: topGainers.length ? topGainers : MOCK_TOP_GAINERS,
      topLosers: topLosers.length ? topLosers : MOCK_TOP_LOSERS,
      highestTurnover: highestTurnover.length
        ? highestTurnover
        : MOCK_HIGHEST_TURNOVER,
    };
  } catch {
    return {
      topGainers: MOCK_TOP_GAINERS,
      topLosers: MOCK_TOP_LOSERS,
      highestTurnover: MOCK_HIGHEST_TURNOVER,
    };
  }
}

/**
 * Fetch live price for a single stock symbol.
 * Returns mock data if the network call fails or on web.
 */
export async function getStockPrice(symbol: string): Promise<StockData | null> {
  const symbolUpper = symbol.toUpperCase();

  // Try mock data first for common symbols
  const allMock = [
    ...MOCK_TOP_GAINERS,
    ...MOCK_TOP_LOSERS,
    ...MOCK_HIGHEST_TURNOVER,
  ];
  const mockMatch = allMock.find((s) => s.symbol === symbolUpper);

  if (Platform.OS === 'web') {
    return mockMatch ?? null;
  }

  try {
    const response = await axios.get<{ content?: TodayPriceItem[] }>(
      TODAY_PRICE_URL,
      { timeout: API_TIMEOUT },
    );

    const items = response.data?.content ?? [];
    const found = items.find(
      (item) => item.symbol?.toUpperCase() === symbolUpper,
    );

    return found ? mapTodayPriceItem(found) : mockMatch ?? null;
  } catch {
    return mockMatch ?? null;
  }
}
