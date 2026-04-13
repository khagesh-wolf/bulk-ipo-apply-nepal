/**
 * Floorsheet API — Bulk IPO Apply Nepal
 *
 * Fetches real-time floorsheet data (buy/sell orders and transaction history)
 * from NEPSE public endpoints. Falls back to mock data on CORS / network error.
 */

import axios from 'axios';
import { Platform } from 'react-native';
import type { FloorsheetEntry, MarketSummary } from '@/types';

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

const NEPAL_STOCK_BASE = 'https://nepalstock.com.np/api/nots';
const FLOORSHEET_URL = `${NEPAL_STOCK_BASE}/nepse-data/floorsheet`;
const MARKET_SUMMARY_URL = `${NEPAL_STOCK_BASE}/nepse-data/market-open`;

const API_TIMEOUT = 10_000;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const NOW = new Date().toISOString();

export const MOCK_FLOORSHEET: FloorsheetEntry[] = [
  { id: 1001, symbol: 'NABIL', buyerBrokerId: 1, sellerBrokerId: 50, quantity: 100, rate: 1042, amount: 104200, tradeTime: NOW },
  { id: 1002, symbol: 'NICA', buyerBrokerId: 8, sellerBrokerId: 24, quantity: 200, rate: 784.5, amount: 156900, tradeTime: NOW },
  { id: 1003, symbol: 'NTC', buyerBrokerId: 12, sellerBrokerId: 1, quantity: 50, rate: 756, amount: 37800, tradeTime: NOW },
  { id: 1004, symbol: 'NLIC', buyerBrokerId: 50, sellerBrokerId: 12, quantity: 150, rate: 1354, amount: 203100, tradeTime: NOW },
  { id: 1005, symbol: 'HIDCL', buyerBrokerId: 24, sellerBrokerId: 8, quantity: 500, rate: 312.6, amount: 156300, tradeTime: NOW },
  { id: 1006, symbol: 'UPPER', buyerBrokerId: 1, sellerBrokerId: 24, quantity: 300, rate: 248.3, amount: 74490, tradeTime: NOW },
  { id: 1007, symbol: 'SANIMA', buyerBrokerId: 8, sellerBrokerId: 50, quantity: 100, rate: 342.1, amount: 34210, tradeTime: NOW },
  { id: 1008, symbol: 'API', buyerBrokerId: 12, sellerBrokerId: 1, quantity: 250, rate: 178.4, amount: 44600, tradeTime: NOW },
  { id: 1009, symbol: 'NABIL', buyerBrokerId: 50, sellerBrokerId: 24, quantity: 75, rate: 1040, amount: 78000, tradeTime: NOW },
  { id: 1010, symbol: 'NICA', buyerBrokerId: 24, sellerBrokerId: 12, quantity: 400, rate: 783, amount: 313200, tradeTime: NOW },
];

export const MOCK_MARKET_SUMMARY: MarketSummary = {
  totalTradedShares: 6_234_567,
  totalTradedValue: 6_842_317_450,
  totalTransactions: 42_356,
  totalScripsTraded: 196,
  totalMarketCap: 3_456_000_000_000,
  isOpen: false,
  asOf: NOW,
};

// ---------------------------------------------------------------------------
// Raw API shapes
// ---------------------------------------------------------------------------

interface FloorsheetApiItem {
  id?: number;
  stockSymbol?: string;
  buyerMemberId?: number;
  sellerMemberId?: number;
  contractQuantity?: number;
  contractRate?: number;
  contractAmount?: number;
  tradeTime?: string;
}

interface MarketSummaryRaw {
  isOpen?: boolean;
  totalTradedShares?: number;
  totalTradedValue?: number;
  totalTransactions?: number;
  totalScripsTraded?: number;
  totalMarketCapitalization?: number;
  as_of?: string;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapFloorsheetItem(item: FloorsheetApiItem): FloorsheetEntry {
  return {
    id: item.id ?? 0,
    symbol: item.stockSymbol ?? '',
    buyerBrokerId: item.buyerMemberId ?? 0,
    sellerBrokerId: item.sellerMemberId ?? 0,
    quantity: item.contractQuantity ?? 0,
    rate: item.contractRate ?? 0,
    amount: item.contractAmount ?? 0,
    tradeTime: item.tradeTime ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch recent floorsheet entries, optionally filtered by symbol.
 * Returns the last 100 transactions. Falls back to mock data.
 */
export async function getFloorsheet(
  symbol?: string,
  page = 0,
  size = 100,
): Promise<FloorsheetEntry[]> {
  if (Platform.OS === 'web') {
    return filterBySymbol(MOCK_FLOORSHEET, symbol);
  }

  try {
    const response = await axios.get<{ floorsheets?: { content?: FloorsheetApiItem[] } }>(
      FLOORSHEET_URL,
      {
        timeout: API_TIMEOUT,
        params: { page, size },
      },
    );

    const items = response.data?.floorsheets?.content ?? [];
    const mapped = items.map(mapFloorsheetItem);

    return mapped.length > 0
      ? filterBySymbol(mapped, symbol)
      : filterBySymbol(MOCK_FLOORSHEET, symbol);
  } catch {
    return filterBySymbol(MOCK_FLOORSHEET, symbol);
  }
}

/**
 * Fetch market summary (trading volume, value, transactions, market status).
 * Falls back to mock data.
 */
export async function getMarketSummary(): Promise<MarketSummary> {
  if (Platform.OS === 'web') {
    return MOCK_MARKET_SUMMARY;
  }

  try {
    const response = await axios.get<MarketSummaryRaw>(MARKET_SUMMARY_URL, {
      timeout: API_TIMEOUT,
    });

    const raw = response.data;
    if (!raw) return MOCK_MARKET_SUMMARY;

    return {
      totalTradedShares: raw.totalTradedShares ?? MOCK_MARKET_SUMMARY.totalTradedShares,
      totalTradedValue: raw.totalTradedValue ?? MOCK_MARKET_SUMMARY.totalTradedValue,
      totalTransactions: raw.totalTransactions ?? MOCK_MARKET_SUMMARY.totalTransactions,
      totalScripsTraded: raw.totalScripsTraded ?? MOCK_MARKET_SUMMARY.totalScripsTraded,
      totalMarketCap: raw.totalMarketCapitalization ?? MOCK_MARKET_SUMMARY.totalMarketCap,
      isOpen: raw.isOpen ?? false,
      asOf: raw.as_of ?? new Date().toISOString(),
    };
  } catch {
    return MOCK_MARKET_SUMMARY;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function filterBySymbol(entries: FloorsheetEntry[], symbol?: string): FloorsheetEntry[] {
  if (!symbol) return entries;
  const upper = symbol.toUpperCase();
  return entries.filter((e) => e.symbol.toUpperCase() === upper);
}
