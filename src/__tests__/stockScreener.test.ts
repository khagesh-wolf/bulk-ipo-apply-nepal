/**
 * Unit Tests — Stock Screener (Phase 5)
 *
 * Tests filtering, sorting, grouping, and comparison functions.
 */

import { screenStocks, groupBySector, compareStocks } from '@/lib/stockScreener';
import type { StockData } from '@/types';

const SAMPLE_STOCKS: StockData[] = [
  {
    symbol: 'NABIL',
    companyName: 'Nabil Bank Limited',
    ltp: 1042,
    change: 94.36,
    changePercent: 9.96,
    open: 950,
    high: 1042,
    low: 948,
    volume: 18430,
    turnover: 18920450,
    sector: 'Commercial Banks',
    pe: 18.4,
    eps: 56.6,
    bookValue: 312,
  },
  {
    symbol: 'NICA',
    companyName: 'NIC Asia Bank Limited',
    ltp: 784.5,
    change: 71.3,
    changePercent: 9.99,
    open: 715,
    high: 784.5,
    low: 712.5,
    volume: 24615,
    turnover: 19296307,
    sector: 'Commercial Banks',
    pe: 16.8,
    eps: 46.7,
    bookValue: 268,
  },
  {
    symbol: 'HIDCL',
    companyName: 'Hydroelectricity Investment and Development Company',
    ltp: 312.6,
    change: 28.42,
    changePercent: 9.99,
    open: 285,
    high: 312.6,
    low: 284,
    volume: 45320,
    turnover: 14165032,
    sector: 'Hydropower',
    pe: 12.4,
    eps: 25.2,
    bookValue: 145,
  },
  {
    symbol: 'NLIC',
    companyName: 'Nepal Life Insurance Company',
    ltp: 1354,
    change: 122.9,
    changePercent: 9.98,
    open: 1232,
    high: 1354,
    low: 1229,
    volume: 9840,
    turnover: 13323360,
    sector: 'Life Insurance',
    pe: 28.7,
    eps: 47.2,
    bookValue: 245,
  },
  {
    symbol: 'API',
    companyName: 'Api Power Company Limited',
    ltp: 178.4,
    change: -19.8,
    changePercent: -9.99,
    open: 198.5,
    high: 199,
    low: 178.4,
    volume: 19350,
    turnover: 3451740,
    sector: 'Hydropower',
  },
];

describe('Stock Screener', () => {
  describe('screenStocks', () => {
    it('should return all stocks with no filter', () => {
      const result = screenStocks(SAMPLE_STOCKS, {});
      expect(result).toHaveLength(5);
    });

    it('should filter by sector', () => {
      const result = screenStocks(SAMPLE_STOCKS, { sector: 'Commercial Banks' });
      expect(result).toHaveLength(2);
      expect(result.every((s) => s.sector === 'Commercial Banks')).toBe(true);
    });

    it('should filter by minimum PE ratio', () => {
      const result = screenStocks(SAMPLE_STOCKS, { minPE: 15 });
      expect(result.every((s) => (s.pe ?? 0) >= 15)).toBe(true);
    });

    it('should filter by maximum PE ratio', () => {
      const result = screenStocks(SAMPLE_STOCKS, { maxPE: 20 });
      expect(result.every((s) => (s.pe ?? Infinity) <= 20)).toBe(true);
    });

    it('should filter by PE range', () => {
      const result = screenStocks(SAMPLE_STOCKS, { minPE: 10, maxPE: 20 });
      expect(result.length).toBeGreaterThan(0);
      result.forEach((s) => {
        expect(s.pe).toBeGreaterThanOrEqual(10);
        expect(s.pe).toBeLessThanOrEqual(20);
      });
    });

    it('should filter by minimum EPS', () => {
      const result = screenStocks(SAMPLE_STOCKS, { minEPS: 45 });
      expect(result.every((s) => (s.eps ?? 0) >= 45)).toBe(true);
    });

    it('should filter by minimum volume', () => {
      const result = screenStocks(SAMPLE_STOCKS, { minVolume: 20000 });
      expect(result).toHaveLength(2); // NICA and HIDCL
      expect(result.every((s) => s.volume >= 20000)).toBe(true);
    });

    it('should sort by changePercent descending', () => {
      const result = screenStocks(SAMPLE_STOCKS, {
        sortBy: 'changePercent',
        sortOrder: 'desc',
      });
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].changePercent).toBeGreaterThanOrEqual(
          result[i].changePercent,
        );
      }
    });

    it('should sort by volume ascending', () => {
      const result = screenStocks(SAMPLE_STOCKS, {
        sortBy: 'volume',
        sortOrder: 'asc',
      });
      for (let i = 1; i < result.length; i++) {
        expect(result[i].volume).toBeGreaterThanOrEqual(result[i - 1].volume);
      }
    });

    it('should combine multiple filters', () => {
      const result = screenStocks(SAMPLE_STOCKS, {
        sector: 'Commercial Banks',
        minEPS: 50,
      });
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('NABIL');
    });
  });

  describe('groupBySector', () => {
    it('should group stocks by sector', () => {
      const groups = groupBySector(SAMPLE_STOCKS);
      expect(Object.keys(groups)).toContain('Commercial Banks');
      expect(Object.keys(groups)).toContain('Hydropower');
      expect(Object.keys(groups)).toContain('Life Insurance');
      expect(groups['Commercial Banks']).toHaveLength(2);
      expect(groups['Hydropower']).toHaveLength(2);
    });
  });

  describe('compareStocks', () => {
    it('should compare stocks side-by-side', () => {
      const comparison = compareStocks([SAMPLE_STOCKS[0], SAMPLE_STOCKS[1]]);
      expect(comparison).toHaveLength(2);
      expect(comparison[0].symbol).toBe('NABIL');
      expect(comparison[1].symbol).toBe('NICA');
    });

    it('should calculate PBV from book value', () => {
      const comparison = compareStocks([SAMPLE_STOCKS[0]]);
      expect(comparison[0].pbv).not.toBeNull();
      // NABIL: LTP 1042 / Book Value 312 ≈ 3.34
      expect(comparison[0].pbv).toBeCloseTo(3.34, 1);
    });

    it('should handle missing book value', () => {
      const comparison = compareStocks([SAMPLE_STOCKS[4]]); // API has no bookValue
      expect(comparison[0].pbv).toBeNull();
    });
  });
});
