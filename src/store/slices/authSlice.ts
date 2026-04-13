/**
 * Auth Slice (Zustand) — Bulk IPO Apply Nepal
 *
 * Manages authentication state, session lifecycle, and token management.
 */

import { create } from 'zustand';
import {
  login,
  loginWithCache,
  logout,
  isTokenExpired,
  purgeExpiredTokens,
} from '@/src/api/auth';
import { setAuthToken, clearAuthToken, setOnTokenExpired } from '@/src/api/client';
import { logger } from '@/src/utils/logger';
import { getUserMessage } from '@/src/utils/errors';

const TAG = 'AuthSlice';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthSession {
  accountId: string;
  token: string;
  customerId: string;
  loginTime: string;
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface AuthState {
  currentSession: AuthSession | null;
  isAuthenticating: boolean;
  authError: string | null;

  /** Login with credentials and create a session. */
  loginAccount: (
    accountId: string,
    dpId: string,
    username: string,
    password: string,
  ) => Promise<AuthSession>;

  /** Login using cached token if available. */
  loginWithCache: (
    accountId: string,
    dpId: string,
    username: string,
    password: string,
  ) => Promise<AuthSession>;

  /** Logout and clear session. */
  logout: () => Promise<void>;

  /** Check if current session is still valid. */
  isSessionValid: () => boolean;

  /** Clear auth error. */
  clearAuthError: () => void;
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

export const useAuthSlice = create<AuthState>((set, get) => {
  // Set up token expiration handler
  setOnTokenExpired(() => {
    logger.warn(TAG, 'Token expired, clearing session');
    set({ currentSession: null, authError: 'Session expired. Please login again.' });
    clearAuthToken();
  });

  return {
    currentSession: null,
    isAuthenticating: false,
    authError: null,

    loginAccount: async (accountId, dpId, username, password) => {
      set({ isAuthenticating: true, authError: null });
      try {
        const result = await login(dpId, username, password);

        const session: AuthSession = {
          accountId,
          token: result.token,
          customerId: result.customerId,
          loginTime: new Date().toISOString(),
        };

        set({ currentSession: session, isAuthenticating: false });
        logger.info(TAG, `Session created for account ${accountId}`);
        return session;
      } catch (err) {
        const message = getUserMessage(err);
        set({ isAuthenticating: false, authError: message });
        throw err;
      }
    },

    loginWithCache: async (accountId, dpId, username, password) => {
      set({ isAuthenticating: true, authError: null });
      try {
        const result = await loginWithCache(accountId, dpId, username, password);

        const session: AuthSession = {
          accountId,
          token: result.token,
          customerId: result.customerId,
          loginTime: new Date().toISOString(),
        };

        set({ currentSession: session, isAuthenticating: false });
        return session;
      } catch (err) {
        const message = getUserMessage(err);
        set({ isAuthenticating: false, authError: message });
        throw err;
      }
    },

    logout: async () => {
      const { currentSession } = get();
      await logout(currentSession?.accountId);
      set({ currentSession: null });
      logger.info(TAG, 'Session cleared');
    },

    isSessionValid: () => {
      const { currentSession } = get();
      if (!currentSession) return false;
      return !isTokenExpired(currentSession.token);
    },

    clearAuthError: () => set({ authError: null }),
  };
});
