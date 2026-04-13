/**
 * Unit Tests — Calculator (Phase 5)
 *
 * Tests the extended calculator functions: IPO return, dividend income,
 * capital gains tax, and bonus share calculators.
 */

import {
  calculateShareProfitLoss,
  breakEvenPrice,
  calculateIPOReturn,
  calculateDividendIncome,
  calculateCapitalGainsTax,
  calculateBonusShares,
} from '@/lib/calculator';

describe('Calculator', () => {
  describe('calculateShareProfitLoss', () => {
    it('should calculate profit correctly', () => {
      const result = calculateShareProfitLoss({
        buyPrice: 500,
        sellPrice: 600,
        quantity: 100,
        cgtType: 'short',
      });

      expect(result.investedAmount).toBe(50000);
      expect(result.saleAmount).toBe(60000);
      expect(result.netProfitLoss).toBeGreaterThan(0);
      expect(result.brokerCommission).toBeGreaterThan(0);
      expect(result.sebon).toBeGreaterThan(0);
      expect(result.dpFee).toBe(25);
    });

    it('should calculate loss correctly', () => {
      const result = calculateShareProfitLoss({
        buyPrice: 600,
        sellPrice: 500,
        quantity: 100,
        cgtType: 'short',
      });

      expect(result.netProfitLoss).toBeLessThan(0);
      expect(result.capitalGainsTax).toBe(0); // no tax on loss
    });

    it('should apply long-term CGT rate (5%)', () => {
      const result = calculateShareProfitLoss({
        buyPrice: 100,
        sellPrice: 200,
        quantity: 10,
        cgtType: 'long',
      });

      // CGT on profit should be at 5% rate
      expect(result.capitalGainsTax).toBeGreaterThan(0);
    });

    it('should apply institutional CGT rate (10%)', () => {
      const result = calculateShareProfitLoss({
        buyPrice: 100,
        sellPrice: 200,
        quantity: 10,
        cgtType: 'institutional',
      });

      const shortResult = calculateShareProfitLoss({
        buyPrice: 100,
        sellPrice: 200,
        quantity: 10,
        cgtType: 'short',
      });

      // Institutional CGT should be higher than short term
      expect(result.capitalGainsTax).toBeGreaterThan(shortResult.capitalGainsTax);
    });
  });

  describe('breakEvenPrice', () => {
    it('should find a price where profit is approximately zero', () => {
      const bep = breakEvenPrice(500, 100);
      const result = calculateShareProfitLoss({
        buyPrice: 500,
        sellPrice: bep,
        quantity: 100,
      });

      expect(Math.abs(result.netProfitLoss)).toBeLessThan(1);
    });

    it('should be higher than buy price', () => {
      const bep = breakEvenPrice(1000, 50);
      expect(bep).toBeGreaterThan(1000);
    });
  });

  describe('calculateIPOReturn', () => {
    it('should calculate positive ROI', () => {
      const result = calculateIPOReturn(100, 10, 150);

      expect(result.investedAmount).toBe(1000);
      expect(result.currentValue).toBe(1500);
      expect(result.profitLoss).toBe(500);
      expect(result.roiPercent).toBe(50);
    });

    it('should calculate negative ROI', () => {
      const result = calculateIPOReturn(100, 10, 80);

      expect(result.profitLoss).toBe(-200);
      expect(result.roiPercent).toBe(-20);
    });

    it('should handle zero investment', () => {
      const result = calculateIPOReturn(0, 10, 100);

      expect(result.investedAmount).toBe(0);
      expect(result.roiPercent).toBe(0);
    });

    it('should handle zero allotment', () => {
      const result = calculateIPOReturn(100, 0, 150);

      expect(result.investedAmount).toBe(0);
      expect(result.currentValue).toBe(0);
    });
  });

  describe('calculateDividendIncome', () => {
    it('should calculate cash dividend income correctly', () => {
      const result = calculateDividendIncome('NABIL', 100, 30);

      // 30% dividend on Rs.100 face value * 100 shares = Rs.3000 gross
      expect(result.grossDividend).toBe(3000);
      expect(result.taxAmount).toBe(150); // 5% TDS
      expect(result.netDividend).toBe(2850);
    });

    it('should handle custom face value', () => {
      const result = calculateDividendIncome('TEST', 50, 20, 50);

      // 20% of Rs.50 face * 50 shares = Rs.500 gross
      expect(result.grossDividend).toBe(500);
      expect(result.taxAmount).toBe(25);
      expect(result.netDividend).toBe(475);
    });

    it('should handle zero quantity', () => {
      const result = calculateDividendIncome('NABIL', 0, 30);

      expect(result.grossDividend).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.netDividend).toBe(0);
    });
  });

  describe('calculateCapitalGainsTax', () => {
    it('should apply short-term rate for holdings < 365 days', () => {
      const result = calculateCapitalGainsTax(100, 200, 10, 180);

      expect(result.holdingPeriod).toBe('short');
      expect(result.taxRate).toBe(0.075);
      expect(result.grossGain).toBe(1000);
      expect(result.taxAmount).toBe(75);
      expect(result.netGain).toBe(925);
    });

    it('should apply long-term rate for holdings >= 365 days', () => {
      const result = calculateCapitalGainsTax(100, 200, 10, 400);

      expect(result.holdingPeriod).toBe('long');
      expect(result.taxRate).toBe(0.05);
      expect(result.taxAmount).toBe(50);
      expect(result.netGain).toBe(950);
    });

    it('should not tax losses', () => {
      const result = calculateCapitalGainsTax(200, 100, 10, 100);

      expect(result.grossGain).toBe(-1000);
      expect(result.taxAmount).toBe(0);
      expect(result.netGain).toBe(-1000);
    });
  });

  describe('calculateBonusShares', () => {
    it('should calculate bonus shares correctly', () => {
      const result = calculateBonusShares(100, 20);

      expect(result.bonusShares).toBe(20);
      expect(result.totalShares).toBe(120);
    });

    it('should floor fractional bonus shares', () => {
      const result = calculateBonusShares(33, 10);

      // 10% of 33 = 3.3, floored to 3
      expect(result.bonusShares).toBe(3);
      expect(result.totalShares).toBe(36);
    });

    it('should handle zero holding', () => {
      const result = calculateBonusShares(0, 20);

      expect(result.bonusShares).toBe(0);
      expect(result.totalShares).toBe(0);
    });

    it('should calculate adjusted WACC when currentWACC is provided', () => {
      const result = calculateBonusShares(100, 20, 500);

      // 100 shares at WACC 500, 20 bonus → 120 total
      // adjusted WACC = (100 * 500) / 120 ≈ 416.67
      expect(result.bonusShares).toBe(20);
      expect(result.totalShares).toBe(120);
      expect(result.adjustedWACC).toBeCloseTo(416.67, 1);
    });
  });
});
