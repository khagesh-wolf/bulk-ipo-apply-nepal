/**
 * Technical Analysis Utilities — Bulk IPO Apply Nepal
 *
 * Implements common technical indicators for stock analysis:
 * - Simple Moving Average (SMA)
 * - Exponential Moving Average (EMA)
 * - Relative Strength Index (RSI)
 * - MACD (Moving Average Convergence Divergence)
 * - Bollinger Bands
 */

import type { OHLCV, TechnicalIndicators } from '@/types';

// ---------------------------------------------------------------------------
// Simple Moving Average (SMA)
// ---------------------------------------------------------------------------

/**
 * Calculate Simple Moving Average for the given period.
 * Returns null if insufficient data.
 */
export function calculateSMA(
  prices: number[],
  period: number,
): number | null {
  if (prices.length < period) return null;

  const slice = prices.slice(-period);
  const sum = slice.reduce((s, p) => s + p, 0);
  return Number((sum / period).toFixed(2));
}

/**
 * Calculate SMA series (full history) for charting.
 */
export function calculateSMASeries(
  prices: number[],
  period: number,
): (number | null)[] {
  return prices.map((_, i) => {
    if (i < period - 1) return null;
    const slice = prices.slice(i - period + 1, i + 1);
    return Number((slice.reduce((s, p) => s + p, 0) / period).toFixed(2));
  });
}

// ---------------------------------------------------------------------------
// Exponential Moving Average (EMA)
// ---------------------------------------------------------------------------

/**
 * Calculate Exponential Moving Average for the given period.
 */
export function calculateEMA(
  prices: number[],
  period: number,
): number | null {
  if (prices.length < period) return null;

  const multiplier = 2 / (period + 1);

  // Start with SMA for the first period
  let ema =
    prices.slice(0, period).reduce((s, p) => s + p, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return Number(ema.toFixed(2));
}

/**
 * Calculate EMA series (full history) for charting.
 */
export function calculateEMASeries(
  prices: number[],
  period: number,
): (number | null)[] {
  if (prices.length < period) {
    return prices.map(() => null);
  }

  const multiplier = 2 / (period + 1);
  const result: (number | null)[] = [];

  // First (period - 1) values are null
  for (let i = 0; i < period - 1; i++) {
    result.push(null);
  }

  // SMA as first EMA value
  let ema =
    prices.slice(0, period).reduce((s, p) => s + p, 0) / period;
  result.push(Number(ema.toFixed(2)));

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
    result.push(Number(ema.toFixed(2)));
  }

  return result;
}

// ---------------------------------------------------------------------------
// Relative Strength Index (RSI)
// ---------------------------------------------------------------------------

/**
 * Calculate RSI-14 (or custom period).
 * Returns value between 0–100. >70 = overbought, <30 = oversold.
 */
export function calculateRSI(
  prices: number[],
  period = 14,
): number | null {
  if (prices.length < period + 1) return null;

  let avgGain = 0;
  let avgLoss = 0;

  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }

  avgGain /= period;
  avgLoss /= period;

  // Smooth with subsequent data
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return Number((100 - 100 / (1 + rs)).toFixed(2));
}

// ---------------------------------------------------------------------------
// MACD (Moving Average Convergence Divergence)
// ---------------------------------------------------------------------------

export interface MACDResult {
  macdLine: number;
  signalLine: number;
  histogram: number;
}

/**
 * Calculate MACD with standard parameters (12, 26, 9).
 */
export function calculateMACD(
  prices: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MACDResult | null {
  if (prices.length < slowPeriod + signalPeriod) return null;

  const emaFastSeries = calculateEMASeries(prices, fastPeriod);
  const emaSlowSeries = calculateEMASeries(prices, slowPeriod);

  // MACD line = EMA(fast) - EMA(slow)
  const macdSeries: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    const fast = emaFastSeries[i];
    const slow = emaSlowSeries[i];
    if (fast !== null && slow !== null) {
      macdSeries.push(fast - slow);
    }
  }

  if (macdSeries.length < signalPeriod) return null;

  // Signal line = EMA(macdSeries, signalPeriod)
  const signalEma = calculateEMA(macdSeries, signalPeriod);
  if (signalEma === null) return null;

  const macdLine = macdSeries[macdSeries.length - 1];
  const histogram = macdLine - signalEma;

  return {
    macdLine: Number(macdLine.toFixed(2)),
    signalLine: Number(signalEma.toFixed(2)),
    histogram: Number(histogram.toFixed(2)),
  };
}

// ---------------------------------------------------------------------------
// Bollinger Bands
// ---------------------------------------------------------------------------

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
}

/**
 * Calculate Bollinger Bands (20-period SMA ± 2 std deviations).
 */
export function calculateBollingerBands(
  prices: number[],
  period = 20,
  stdDevMultiplier = 2,
): BollingerBands | null {
  if (prices.length < period) return null;

  const slice = prices.slice(-period);
  const middle = slice.reduce((s, p) => s + p, 0) / period;

  const squaredDiffs = slice.map((p) => (p - middle) ** 2);
  const variance = squaredDiffs.reduce((s, d) => s + d, 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    upper: Number((middle + stdDevMultiplier * stdDev).toFixed(2)),
    middle: Number(middle.toFixed(2)),
    lower: Number((middle - stdDevMultiplier * stdDev).toFixed(2)),
  };
}

// ---------------------------------------------------------------------------
// All Indicators at Once
// ---------------------------------------------------------------------------

/**
 * Calculate all supported technical indicators from OHLCV data.
 */
export function calculateAllIndicators(
  data: OHLCV[],
): TechnicalIndicators {
  const closes = data.map((d) => d.close);

  const sma20 = calculateSMA(closes, 20) ?? undefined;
  const sma50 = calculateSMA(closes, 50) ?? undefined;
  const sma200 = calculateSMA(closes, 200) ?? undefined;
  const ema12 = calculateEMA(closes, 12) ?? undefined;
  const ema26 = calculateEMA(closes, 26) ?? undefined;
  const rsi14 = calculateRSI(closes, 14) ?? undefined;

  const macd = calculateMACD(closes);
  const bb = calculateBollingerBands(closes);

  return {
    sma20,
    sma50,
    sma200,
    ema12,
    ema26,
    rsi14,
    macdLine: macd?.macdLine ?? undefined,
    macdSignal: macd?.signalLine ?? undefined,
    macdHistogram: macd?.histogram ?? undefined,
    bollingerUpper: bb?.upper ?? undefined,
    bollingerMiddle: bb?.middle ?? undefined,
    bollingerLower: bb?.lower ?? undefined,
  };
}
