/**
 * Watchlist & Alerts Store (Zustand)
 *
 * Manages custom stock watchlist and price target alerts.
 */

import { create } from 'zustand';
import type { WatchlistItem, PriceAlert, AlertType, AlertStatus, StockData } from '@/types';
import { checkAlerts, validateAlertParams } from '@/lib/alertService';

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface WatchlistStore {
  watchlist: WatchlistItem[];
  alerts: PriceAlert[];
  isLoading: boolean;
  error: string | null;

  /** Add a stock to watchlist. */
  addToWatchlist: (item: Omit<WatchlistItem, 'addedAt'>) => void;

  /** Remove a stock from watchlist. */
  removeFromWatchlist: (symbol: string) => void;

  /** Check if a symbol is in the watchlist. */
  isInWatchlist: (symbol: string) => boolean;

  /** Create a new price alert. */
  createAlert: (params: {
    symbol: string;
    alertType: AlertType;
    targetPrice: number;
  }) => { success: boolean; error?: string };

  /** Dismiss a triggered alert. */
  dismissAlert: (alertId: string) => void;

  /** Delete an alert. */
  deleteAlert: (alertId: string) => void;

  /** Evaluate all active alerts against current prices. */
  evaluateAlerts: (liveData: Map<string, StockData>) => PriceAlert[];

  /** Clear error state. */
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

let alertCounter = 0;

export const useWatchlistStore = create<WatchlistStore>((set, get) => ({
  watchlist: [],
  alerts: [],
  isLoading: false,
  error: null,

  addToWatchlist: (item) => {
    set((state) => {
      const exists = state.watchlist.some(
        (w) => w.symbol === item.symbol,
      );
      if (exists) return state;

      return {
        watchlist: [
          ...state.watchlist,
          { ...item, addedAt: new Date().toISOString() },
        ],
      };
    });
  },

  removeFromWatchlist: (symbol) => {
    set((state) => ({
      watchlist: state.watchlist.filter((w) => w.symbol !== symbol),
    }));
  },

  isInWatchlist: (symbol) => {
    return get().watchlist.some((w) => w.symbol === symbol);
  },

  createAlert: (params) => {
    const validation = validateAlertParams(params);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    alertCounter++;
    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}-${alertCounter}`,
      symbol: params.symbol.toUpperCase(),
      alertType: params.alertType,
      targetPrice: params.targetPrice,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      alerts: [...state.alerts, newAlert],
    }));

    return { success: true };
  },

  dismissAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, status: 'DISMISSED' as AlertStatus } : a,
      ),
    }));
  },

  deleteAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== alertId),
    }));
  },

  evaluateAlerts: (liveData) => {
    const { alerts } = get();
    const triggered = checkAlerts(alerts, liveData);

    if (triggered.length > 0) {
      set((state) => ({
        alerts: state.alerts.map((a) => {
          const t = triggered.find((ta) => ta.id === a.id);
          return t ?? a;
        }),
      }));
    }

    return triggered;
  },

  clearError: () => set({ error: null }),
}));

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** Get active alerts only. */
export const selectActiveAlerts = (state: WatchlistStore): PriceAlert[] =>
  state.alerts.filter((a) => a.status === 'ACTIVE');

/** Get triggered alerts only. */
export const selectTriggeredAlerts = (state: WatchlistStore): PriceAlert[] =>
  state.alerts.filter((a) => a.status === 'TRIGGERED');

/** Get alerts for a specific symbol. */
export const selectAlertsBySymbol =
  (symbol: string) =>
  (state: WatchlistStore): PriceAlert[] =>
    state.alerts.filter((a) => a.symbol === symbol);

/** Get watchlist symbols. */
export const selectWatchlistSymbols = (state: WatchlistStore): string[] =>
  state.watchlist.map((w) => w.symbol);
