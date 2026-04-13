/**
 * Unit Tests — Technical Analysis (Phase 5)
 *
 * Tests SMA, EMA, RSI, MACD, and Bollinger Bands calculations.
 */

import {
  calculateSMA,
  calculateSMASeries,
  calculateEMA,
  calculateEMASeries,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateAllIndicators,
} from '@/lib/technicalAnalysis';
import type { OHLCV } from '@/types';

// Sample price data (30 days of closing prices)
const PRICES = [
  100, 102, 101, 104, 103, 105, 107, 106, 108, 110,
  109, 111, 113, 112, 114, 116, 115, 117, 119, 118,
  120, 122, 121, 123, 125, 124, 126, 128, 127, 129,
];

// Extended price data (40 days for MACD)
const EXTENDED_PRICES = [
  100, 102, 101, 104, 103, 105, 107, 106, 108, 110,
  109, 111, 113, 112, 114, 116, 115, 117, 119, 118,
  120, 122, 121, 123, 125, 124, 126, 128, 127, 129,
  131, 130, 132, 134, 133, 135, 137, 136, 138, 140,
];

describe('Technical Analysis', () => {
  describe('calculateSMA', () => {
    it('should calculate SMA correctly', () => {
      const sma5 = calculateSMA([10, 20, 30, 40, 50], 5);
      expect(sma5).toBe(30);
    });

    it('should return null for insufficient data', () => {
      const sma = calculateSMA([10, 20], 5);
      expect(sma).toBeNull();
    });

    it('should use last N prices', () => {
      const sma3 = calculateSMA([10, 20, 30, 40, 50], 3);
      // Last 3: 30, 40, 50 → avg = 40
      expect(sma3).toBe(40);
    });

    it('should calculate SMA-20 for PRICES data', () => {
      const sma20 = calculateSMA(PRICES, 20);
      expect(sma20).not.toBeNull();
      expect(sma20).toBeGreaterThan(100);
    });
  });

  describe('calculateSMASeries', () => {
    it('should produce correct length series', () => {
      const series = calculateSMASeries(PRICES, 5);
      expect(series).toHaveLength(PRICES.length);
    });

    it('should have nulls for first (period-1) values', () => {
      const series = calculateSMASeries(PRICES, 5);
      expect(series[0]).toBeNull();
      expect(series[3]).toBeNull();
      expect(series[4]).not.toBeNull();
    });
  });

  describe('calculateEMA', () => {
    it('should return null for insufficient data', () => {
      const ema = calculateEMA([10, 20], 5);
      expect(ema).toBeNull();
    });

    it('should return a number for sufficient data', () => {
      const ema12 = calculateEMA(PRICES, 12);
      expect(ema12).not.toBeNull();
      expect(typeof ema12).toBe('number');
    });

    it('should track price trends', () => {
      // Upward trending prices → EMA should be above starting SMA
      const ema5 = calculateEMA(PRICES, 5);
      expect(ema5).not.toBeNull();
      expect(ema5!).toBeGreaterThan(100);
    });
  });

  describe('calculateEMASeries', () => {
    it('should produce correct length series', () => {
      const series = calculateEMASeries(PRICES, 5);
      expect(series).toHaveLength(PRICES.length);
    });

    it('should have nulls for first (period-1) values', () => {
      const series = calculateEMASeries(PRICES, 5);
      expect(series[0]).toBeNull();
      expect(series[3]).toBeNull();
      expect(series[4]).not.toBeNull();
    });
  });

  describe('calculateRSI', () => {
    it('should return null for insufficient data', () => {
      const rsi = calculateRSI([10, 20, 30], 14);
      expect(rsi).toBeNull();
    });

    it('should return value between 0 and 100', () => {
      const rsi = calculateRSI(PRICES, 14);
      expect(rsi).not.toBeNull();
      expect(rsi!).toBeGreaterThanOrEqual(0);
      expect(rsi!).toBeLessThanOrEqual(100);
    });

    it('should be high (>70) for consistently rising prices', () => {
      const risingPrices = Array.from({ length: 20 }, (_, i) => 100 + i * 2);
      const rsi = calculateRSI(risingPrices, 14);
      expect(rsi).not.toBeNull();
      expect(rsi!).toBeGreaterThan(70);
    });

    it('should be 100 for only-rising prices', () => {
      const pureRise = Array.from({ length: 20 }, (_, i) => 100 + i);
      const rsi = calculateRSI(pureRise, 14);
      expect(rsi).toBe(100);
    });
  });

  describe('calculateMACD', () => {
    it('should return null for insufficient data', () => {
      const macd = calculateMACD(PRICES.slice(0, 10));
      expect(macd).toBeNull();
    });

    it('should return MACD components for sufficient data', () => {
      const macd = calculateMACD(EXTENDED_PRICES);
      expect(macd).not.toBeNull();
      expect(typeof macd!.macdLine).toBe('number');
      expect(typeof macd!.signalLine).toBe('number');
      expect(typeof macd!.histogram).toBe('number');
    });

    it('should have positive MACD for uptrending prices', () => {
      const macd = calculateMACD(EXTENDED_PRICES);
      if (macd) {
        // In an uptrend, short EMA > long EMA, so MACD line should be positive
        expect(macd.macdLine).toBeGreaterThan(0);
      }
    });
  });

  describe('calculateBollingerBands', () => {
    it('should return null for insufficient data', () => {
      const bb = calculateBollingerBands([10, 20, 30], 20);
      expect(bb).toBeNull();
    });

    it('should return upper, middle, lower bands', () => {
      const bb = calculateBollingerBands(PRICES, 20);
      expect(bb).not.toBeNull();
      expect(bb!.upper).toBeGreaterThan(bb!.middle);
      expect(bb!.middle).toBeGreaterThan(bb!.lower);
    });

    it('should have middle band equal to SMA', () => {
      const bb = calculateBollingerBands(PRICES, 20);
      const sma = calculateSMA(PRICES, 20);
      expect(bb!.middle).toBe(sma);
    });
  });

  describe('calculateAllIndicators', () => {
    it('should calculate all supported indicators', () => {
      const data: OHLCV[] = EXTENDED_PRICES.map((close, i) => ({
        date: new Date(2024, 0, i + 1).toISOString(),
        open: close - 1,
        high: close + 2,
        low: close - 2,
        close,
        volume: 10000 + i * 100,
      }));

      const indicators = calculateAllIndicators(data);
      expect(indicators.sma20).toBeDefined();
      expect(indicators.ema12).toBeDefined();
      expect(indicators.ema26).toBeDefined();
      expect(indicators.rsi14).toBeDefined();
    });

    it('should handle short data gracefully', () => {
      const data: OHLCV[] = [
        { date: '2024-01-01', open: 100, high: 102, low: 99, close: 101, volume: 1000 },
      ];

      const indicators = calculateAllIndicators(data);
      expect(indicators.sma20).toBeUndefined();
      expect(indicators.rsi14).toBeUndefined();
    });
  });
});
