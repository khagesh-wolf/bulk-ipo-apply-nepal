/**
 * Unit Tests — Portfolio Service (Phase 5)
 *
 * Tests multi-account aggregation, WACC, sector allocation, and risk metrics.
 */

import {
  aggregatePortfolios,
  calculateWACC,
  calculateSectorAllocation,
  calculateDailyReturn,
  calculateStdDeviation,
  calculateBeta,
  calculateSharpeRatio,
} from '@/lib/portfolioService';
import type { PortfolioHolding, StockData } from '@/types';

describe('Portfolio Service', () => {
  describe('aggregatePortfolios', () => {
    it('should aggregate holdings from multiple accounts', () => {
      const holdingsByAccount: Record<string, PortfolioHolding[]> = {
        'acc-1': [
          {
            symbol: 'NABIL',
            companyName: 'Nabil Bank Limited',
            totalQuantity: 100,
            wacc: 1000,
            lastTradedPrice: 1042,
            currentValue: 104200,
            investedAmount: 100000,
            profitLoss: 4200,
            profitLossPercent: 4.2,
            accountId: 'acc-1',
          },
        ],
        'acc-2': [
          {
            symbol: 'NABIL',
            companyName: 'Nabil Bank Limited',
            totalQuantity: 50,
            wacc: 1100,
            lastTradedPrice: 1042,
            currentValue: 52100,
            investedAmount: 55000,
            profitLoss: -2900,
            profitLossPercent: -5.27,
            accountId: 'acc-2',
          },
        ],
      };

      const livePrices = new Map<string, StockData>();
      livePrices.set('NABIL', {
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
      });

      const result = aggregatePortfolios(holdingsByAccount, livePrices);

      expect(result.accountCount).toBe(2);
      expect(result.holdingsBySymbol).toHaveLength(1);

      const nabil = result.holdingsBySymbol[0];
      expect(nabil.symbol).toBe('NABIL');
      expect(nabil.totalQuantity).toBe(150);
      expect(nabil.accounts).toContain('acc-1');
      expect(nabil.accounts).toContain('acc-2');
      // WACC should be weighted: (100*1000 + 50*1100) / 150 ≈ 1033.33
      expect(nabil.weightedAvgCost).toBeCloseTo(1033.33, 0);
    });

    it('should handle multiple different symbols', () => {
      const holdingsByAccount: Record<string, PortfolioHolding[]> = {
        'acc-1': [
          {
            symbol: 'NABIL',
            companyName: 'Nabil Bank',
            totalQuantity: 100,
            wacc: 1000,
            lastTradedPrice: 1042,
            currentValue: 104200,
            investedAmount: 100000,
            profitLoss: 4200,
            profitLossPercent: 4.2,
            accountId: 'acc-1',
          },
          {
            symbol: 'NICA',
            companyName: 'NIC Asia Bank',
            totalQuantity: 200,
            wacc: 500,
            lastTradedPrice: 784.5,
            currentValue: 156900,
            investedAmount: 100000,
            profitLoss: 56900,
            profitLossPercent: 56.9,
            accountId: 'acc-1',
          },
        ],
      };

      const livePrices = new Map<string, StockData>();
      livePrices.set('NABIL', {
        symbol: 'NABIL', companyName: 'Nabil Bank', ltp: 1042, change: 0, changePercent: 0,
        open: 1000, high: 1050, low: 990, volume: 10000, turnover: 1000000, sector: 'Commercial Banks',
      });
      livePrices.set('NICA', {
        symbol: 'NICA', companyName: 'NIC Asia Bank', ltp: 784.5, change: 0, changePercent: 0,
        open: 750, high: 790, low: 740, volume: 20000, turnover: 2000000, sector: 'Commercial Banks',
      });

      const result = aggregatePortfolios(holdingsByAccount, livePrices);

      expect(result.holdingsBySymbol).toHaveLength(2);
      expect(result.totalInvestment).toBe(200000);
    });

    it('should calculate sector allocation', () => {
      const holdingsByAccount: Record<string, PortfolioHolding[]> = {
        'acc-1': [
          {
            symbol: 'NABIL', companyName: 'Nabil Bank', totalQuantity: 100,
            wacc: 1000, lastTradedPrice: 1000, currentValue: 100000,
            investedAmount: 100000, profitLoss: 0, profitLossPercent: 0, accountId: 'acc-1',
          },
        ],
      };

      const livePrices = new Map<string, StockData>();
      livePrices.set('NABIL', {
        symbol: 'NABIL', companyName: 'Nabil Bank', ltp: 1000, change: 0, changePercent: 0,
        open: 1000, high: 1000, low: 1000, volume: 0, turnover: 0, sector: 'Commercial Banks',
      });

      const result = aggregatePortfolios(holdingsByAccount, livePrices);
      expect(result.holdingsBySector['Commercial Banks']).toBeDefined();
    });
  });

  describe('calculateWACC', () => {
    it('should calculate weighted average cost', () => {
      const wacc = calculateWACC([
        { quantity: 100, price: 500 },
        { quantity: 200, price: 600 },
      ]);

      // (100*500 + 200*600) / 300 = 170000 / 300 ≈ 566.67
      expect(wacc).toBeCloseTo(566.67, 1);
    });

    it('should handle single tranche', () => {
      const wacc = calculateWACC([{ quantity: 100, price: 500 }]);
      expect(wacc).toBe(500);
    });

    it('should handle empty tranches', () => {
      const wacc = calculateWACC([]);
      expect(wacc).toBe(0);
    });

    it('should handle zero total quantity', () => {
      const wacc = calculateWACC([{ quantity: 0, price: 500 }]);
      expect(wacc).toBe(0);
    });
  });

  describe('calculateSectorAllocation', () => {
    it('should calculate percentage allocation', () => {
      const allocation = calculateSectorAllocation({
        'Commercial Banks': 50000,
        'Hydropower': 30000,
        'Insurance': 20000,
      });

      expect(allocation).toHaveLength(3);
      expect(allocation[0].sector).toBe('Commercial Banks');
      expect(allocation[0].percentage).toBe(50);
      expect(allocation[1].percentage).toBe(30);
      expect(allocation[2].percentage).toBe(20);
    });

    it('should sort by percentage descending', () => {
      const allocation = calculateSectorAllocation({
        'Small': 1000,
        'Large': 9000,
      });

      expect(allocation[0].sector).toBe('Large');
    });

    it('should handle empty input', () => {
      const allocation = calculateSectorAllocation({});
      expect(allocation).toHaveLength(0);
    });
  });

  describe('calculateDailyReturn', () => {
    it('should calculate positive return', () => {
      const ret = calculateDailyReturn(100, 105);
      expect(ret).toBe(5);
    });

    it('should calculate negative return', () => {
      const ret = calculateDailyReturn(100, 95);
      expect(ret).toBe(-5);
    });

    it('should handle zero previous value', () => {
      const ret = calculateDailyReturn(0, 100);
      expect(ret).toBe(0);
    });
  });

  describe('calculateStdDeviation', () => {
    it('should calculate standard deviation', () => {
      const stdDev = calculateStdDeviation([2, 4, 4, 4, 5, 5, 7, 9]);
      expect(stdDev).toBeGreaterThan(0);
    });

    it('should return 0 for insufficient data', () => {
      expect(calculateStdDeviation([])).toBe(0);
      expect(calculateStdDeviation([1])).toBe(0);
    });

    it('should return 0 for identical values', () => {
      const stdDev = calculateStdDeviation([5, 5, 5, 5]);
      expect(stdDev).toBe(0);
    });
  });

  describe('calculateBeta', () => {
    it('should return default beta for insufficient data', () => {
      const beta = calculateBeta([1], [1]);
      expect(beta).toBe(1);
    });

    it('should return 1 for equal returns', () => {
      const returns = [1, 2, 3, 4, 5];
      const beta = calculateBeta(returns, returns);
      expect(beta).toBeCloseTo(1, 2);
    });

    it('should handle different length arrays', () => {
      const beta = calculateBeta([1, 2, 3], [1, 2]);
      expect(beta).toBe(1); // default
    });
  });

  describe('calculateSharpeRatio', () => {
    it('should return 0 for insufficient data', () => {
      expect(calculateSharpeRatio([])).toBe(0);
      expect(calculateSharpeRatio([1])).toBe(0);
    });

    it('should return negative for returns below risk-free rate', () => {
      const returns = [0.001, 0.002, 0.001, 0.002, 0.001];
      const sharpe = calculateSharpeRatio(returns, 0.019);
      expect(sharpe).toBeLessThan(0);
    });

    it('should return 0 for zero standard deviation', () => {
      const returns = [5, 5, 5, 5, 5];
      const sharpe = calculateSharpeRatio(returns, 0.019);
      expect(sharpe).toBe(0);
    });
  });
});
