/**
 * Unit Tests — Alert Service (Phase 5)
 *
 * Tests alert evaluation, formatting, validation, and statistics.
 */

import {
  evaluateAlert,
  checkAlerts,
  formatAlertMessage,
  formatAlertType,
  validateAlertParams,
  getAlertStats,
} from '@/lib/alertService';
import type { PriceAlert, StockData } from '@/types';

describe('Alert Service', () => {
  describe('evaluateAlert', () => {
    it('should trigger PRICE_ABOVE when price exceeds target', () => {
      const alert: PriceAlert = {
        id: 'test-1',
        symbol: 'NABIL',
        alertType: 'PRICE_ABOVE',
        targetPrice: 1000,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      expect(evaluateAlert(alert, 1050)).toBe(true);
      expect(evaluateAlert(alert, 1000)).toBe(true);
      expect(evaluateAlert(alert, 950)).toBe(false);
    });

    it('should trigger PRICE_BELOW when price drops below target', () => {
      const alert: PriceAlert = {
        id: 'test-2',
        symbol: 'NABIL',
        alertType: 'PRICE_BELOW',
        targetPrice: 1000,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      expect(evaluateAlert(alert, 950)).toBe(true);
      expect(evaluateAlert(alert, 1000)).toBe(true);
      expect(evaluateAlert(alert, 1050)).toBe(false);
    });

    it('should not trigger non-active alerts', () => {
      const alert: PriceAlert = {
        id: 'test-3',
        symbol: 'NABIL',
        alertType: 'PRICE_ABOVE',
        targetPrice: 1000,
        status: 'TRIGGERED',
        createdAt: new Date().toISOString(),
      };

      expect(evaluateAlert(alert, 1050)).toBe(false);
    });

    it('should not trigger dismissed alerts', () => {
      const alert: PriceAlert = {
        id: 'test-4',
        symbol: 'NABIL',
        alertType: 'PRICE_ABOVE',
        targetPrice: 1000,
        status: 'DISMISSED',
        createdAt: new Date().toISOString(),
      };

      expect(evaluateAlert(alert, 2000)).toBe(false);
    });
  });

  describe('checkAlerts', () => {
    it('should return triggered alerts', () => {
      const alerts: PriceAlert[] = [
        {
          id: 'a1',
          symbol: 'NABIL',
          alertType: 'PRICE_ABOVE',
          targetPrice: 1000,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'a2',
          symbol: 'NICA',
          alertType: 'PRICE_BELOW',
          targetPrice: 800,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        },
      ];

      const liveData = new Map<string, StockData>();
      liveData.set('NABIL', {
        symbol: 'NABIL', companyName: 'Nabil Bank', ltp: 1050, change: 0, changePercent: 0,
        open: 1000, high: 1050, low: 990, volume: 0, turnover: 0, sector: 'Banks',
      });
      liveData.set('NICA', {
        symbol: 'NICA', companyName: 'NIC Asia', ltp: 850, change: 0, changePercent: 0,
        open: 800, high: 860, low: 790, volume: 0, turnover: 0, sector: 'Banks',
      });

      const triggered = checkAlerts(alerts, liveData);

      // NABIL crosses above 1000 (triggered), NICA at 850 is not below 800 (not triggered)
      expect(triggered).toHaveLength(1);
      expect(triggered[0].symbol).toBe('NABIL');
      expect(triggered[0].status).toBe('TRIGGERED');
      expect(triggered[0].triggeredAt).toBeDefined();
    });

    it('should skip alerts without live data', () => {
      const alerts: PriceAlert[] = [
        {
          id: 'a1',
          symbol: 'UNKNOWN',
          alertType: 'PRICE_ABOVE',
          targetPrice: 100,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        },
      ];

      const liveData = new Map<string, StockData>();
      const triggered = checkAlerts(alerts, liveData);
      expect(triggered).toHaveLength(0);
    });

    it('should skip non-active alerts', () => {
      const alerts: PriceAlert[] = [
        {
          id: 'a1',
          symbol: 'NABIL',
          alertType: 'PRICE_ABOVE',
          targetPrice: 100,
          status: 'TRIGGERED',
          createdAt: new Date().toISOString(),
        },
      ];

      const liveData = new Map<string, StockData>();
      liveData.set('NABIL', {
        symbol: 'NABIL', companyName: 'Nabil', ltp: 1050, change: 0, changePercent: 0,
        open: 0, high: 0, low: 0, volume: 0, turnover: 0, sector: '',
      });

      const triggered = checkAlerts(alerts, liveData);
      expect(triggered).toHaveLength(0);
    });
  });

  describe('formatAlertMessage', () => {
    it('should format PRICE_ABOVE alert', () => {
      const alert: PriceAlert = {
        id: 'test',
        symbol: 'NABIL',
        alertType: 'PRICE_ABOVE',
        targetPrice: 1000,
        currentPrice: 1050,
        status: 'TRIGGERED',
        createdAt: new Date().toISOString(),
      };

      const msg = formatAlertMessage(alert);
      expect(msg).toContain('NABIL');
      expect(msg).toContain('crossed above');
      expect(msg).toContain('1000');
      expect(msg).toContain('1050');
    });

    it('should format PRICE_BELOW alert', () => {
      const alert: PriceAlert = {
        id: 'test',
        symbol: 'NICA',
        alertType: 'PRICE_BELOW',
        targetPrice: 500,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      const msg = formatAlertMessage(alert);
      expect(msg).toContain('NICA');
      expect(msg).toContain('dropped below');
    });
  });

  describe('formatAlertType', () => {
    it('should format alert types correctly', () => {
      expect(formatAlertType('PRICE_ABOVE')).toBe('Price Above');
      expect(formatAlertType('PRICE_BELOW')).toBe('Price Below');
      expect(formatAlertType('PORTFOLIO_PL')).toBe('Portfolio P&L');
    });
  });

  describe('validateAlertParams', () => {
    it('should accept valid params', () => {
      const result = validateAlertParams({
        symbol: 'NABIL',
        alertType: 'PRICE_ABOVE',
        targetPrice: 1000,
      });
      expect(result.valid).toBe(true);
    });

    it('should reject empty symbol', () => {
      const result = validateAlertParams({
        symbol: '',
        alertType: 'PRICE_ABOVE',
        targetPrice: 1000,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Symbol');
    });

    it('should reject zero target price', () => {
      const result = validateAlertParams({
        symbol: 'NABIL',
        alertType: 'PRICE_ABOVE',
        targetPrice: 0,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Target price');
    });

    it('should reject negative target price', () => {
      const result = validateAlertParams({
        symbol: 'NABIL',
        alertType: 'PRICE_ABOVE',
        targetPrice: -100,
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('getAlertStats', () => {
    it('should count alert statuses correctly', () => {
      const alerts: PriceAlert[] = [
        { id: '1', symbol: 'A', alertType: 'PRICE_ABOVE', targetPrice: 100, status: 'ACTIVE', createdAt: '' },
        { id: '2', symbol: 'B', alertType: 'PRICE_BELOW', targetPrice: 50, status: 'ACTIVE', createdAt: '' },
        { id: '3', symbol: 'C', alertType: 'PRICE_ABOVE', targetPrice: 200, status: 'TRIGGERED', createdAt: '' },
        { id: '4', symbol: 'D', alertType: 'PRICE_BELOW', targetPrice: 75, status: 'DISMISSED', createdAt: '' },
      ];

      const stats = getAlertStats(alerts);
      expect(stats.total).toBe(4);
      expect(stats.active).toBe(2);
      expect(stats.triggered).toBe(1);
      expect(stats.dismissed).toBe(1);
    });

    it('should handle empty array', () => {
      const stats = getAlertStats([]);
      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
    });
  });
});
