/**
 * Alert Service — Bulk IPO Apply Nepal
 *
 * Manages price target alerts and portfolio alerts.
 * Alerts are stored locally and checked against live prices.
 */

import type { PriceAlert, AlertType, AlertStatus, StockData } from '@/types';

// ---------------------------------------------------------------------------
// Alert Evaluation
// ---------------------------------------------------------------------------

/**
 * Check if a price alert has been triggered based on current market data.
 */
export function evaluateAlert(
  alert: PriceAlert,
  currentPrice: number,
): boolean {
  if (alert.status !== 'ACTIVE') return false;

  switch (alert.alertType) {
    case 'PRICE_ABOVE':
      return currentPrice >= alert.targetPrice;
    case 'PRICE_BELOW':
      return currentPrice <= alert.targetPrice;
    case 'PORTFOLIO_PL':
      // Portfolio P&L alerts are handled differently (by % change)
      return currentPrice >= alert.targetPrice;
    default:
      return false;
  }
}

/**
 * Check all active alerts against current market prices.
 * Returns list of newly triggered alerts.
 */
export function checkAlerts(
  alerts: PriceAlert[],
  liveData: Map<string, StockData>,
): PriceAlert[] {
  const triggered: PriceAlert[] = [];

  for (const alert of alerts) {
    if (alert.status !== 'ACTIVE') continue;

    const stockData = liveData.get(alert.symbol);
    if (!stockData) continue;

    if (evaluateAlert(alert, stockData.ltp)) {
      triggered.push({
        ...alert,
        status: 'TRIGGERED' as AlertStatus,
        currentPrice: stockData.ltp,
        triggeredAt: new Date().toISOString(),
      });
    }
  }

  return triggered;
}

// ---------------------------------------------------------------------------
// Alert Formatting
// ---------------------------------------------------------------------------

/**
 * Format an alert for display notification.
 */
export function formatAlertMessage(alert: PriceAlert): string {
  const direction =
    alert.alertType === 'PRICE_ABOVE' ? 'crossed above' : 'dropped below';

  return `${alert.symbol} has ${direction} Rs. ${alert.targetPrice.toFixed(2)}` +
    (alert.currentPrice
      ? ` (Current: Rs. ${alert.currentPrice.toFixed(2)})`
      : '');
}

/**
 * Format alert type for display.
 */
export function formatAlertType(type: AlertType): string {
  switch (type) {
    case 'PRICE_ABOVE':
      return 'Price Above';
    case 'PRICE_BELOW':
      return 'Price Below';
    case 'PORTFOLIO_PL':
      return 'Portfolio P&L';
    default:
      return 'Unknown';
  }
}

// ---------------------------------------------------------------------------
// Alert Validation
// ---------------------------------------------------------------------------

/**
 * Validate alert parameters before creation.
 */
export function validateAlertParams(params: {
  symbol: string;
  alertType: AlertType;
  targetPrice: number;
}): { valid: boolean; error?: string } {
  if (!params.symbol || params.symbol.trim().length === 0) {
    return { valid: false, error: 'Symbol is required' };
  }

  if (params.targetPrice <= 0) {
    return { valid: false, error: 'Target price must be greater than 0' };
  }

  if (!['PRICE_ABOVE', 'PRICE_BELOW', 'PORTFOLIO_PL'].includes(params.alertType)) {
    return { valid: false, error: 'Invalid alert type' };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Alert Statistics
// ---------------------------------------------------------------------------

/**
 * Get summary statistics for alerts.
 */
export function getAlertStats(alerts: PriceAlert[]): {
  total: number;
  active: number;
  triggered: number;
  dismissed: number;
} {
  return {
    total: alerts.length,
    active: alerts.filter((a) => a.status === 'ACTIVE').length,
    triggered: alerts.filter((a) => a.status === 'TRIGGERED').length,
    dismissed: alerts.filter((a) => a.status === 'DISMISSED').length,
  };
}
