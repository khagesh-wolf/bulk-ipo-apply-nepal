/**
 * Authentication Service — Bulk IPO Apply Nepal
 *
 * Handles MeroShare login, token extraction, token caching, and
 * session lifecycle management.
 */

import axios from 'axios';
import { AUTH, CLIENT_ID, DEFAULT_TIMEOUT_MS } from './endpoints';
import { setAuthToken, clearAuthToken } from './client';
import { getDatabase } from '@/src/db/database';
import { logger } from '@/src/utils/logger';
import { AuthError, TokenExpiredError } from '@/src/utils/errors';

const TAG = 'AuthService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LoginResult {
  token: string;
  customerId: string;
  name?: string;
  demat?: string;
}

export interface CachedToken {
  accountId: string;
  token: string;
  customerId: string;
  expiresAt: string;
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

/**
 * Login to MeroShare with DP credentials.
 * Returns the JWT token and customer ID.
 */
export async function login(
  dpId: string,
  username: string,
  password: string,
): Promise<LoginResult> {
  try {
    logger.info(TAG, `Logging in user: ${username} (DP: ${dpId})`);

    const response = await axios.post(
      AUTH.LOGIN,
      {
        clientId: CLIENT_ID,
        username,
        password,
      },
      {
        timeout: DEFAULT_TIMEOUT_MS,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );

    // Extract token from Authorization header
    const authHeader =
      (response.headers['authorization'] as string | undefined) ??
      (response.headers['Authorization'] as string | undefined) ??
      '';

    const token = authHeader.trim();

    if (!token) {
      throw new AuthError('Login failed: no token received from MeroShare.');
    }

    // Extract customer details from response body
    const body = response.data as Record<string, unknown>;
    const customerId = String(body.demat ?? body.id ?? body.customerId ?? '');
    const name = String(body.name ?? body.accountName ?? '');
    const demat = String(body.demat ?? '');

    logger.info(TAG, `Login successful for ${username}`);

    // Set the token for subsequent requests
    setAuthToken(token);

    return { token, customerId, name, demat };
  } catch (err) {
    if (err instanceof AuthError) throw err;

    const message = axios.isAxiosError(err)
      ? err.response?.data?.message ?? err.message
      : err instanceof Error
        ? err.message
        : 'Login failed';

    logger.error(TAG, `Login failed: ${message}`, err);
    throw new AuthError(message);
  }
}

// ---------------------------------------------------------------------------
// Token caching
// ---------------------------------------------------------------------------

/**
 * Cache a token in the database for an account.
 * Tokens expire after 30 minutes by default.
 */
export async function cacheToken(
  accountId: string,
  token: string,
  customerId: string,
  expiresInMinutes = 30,
): Promise<void> {
  try {
    const db = await getDatabase();
    const expiresAt = new Date(
      Date.now() + expiresInMinutes * 60 * 1000,
    ).toISOString();

    await db.runAsync(
      `INSERT OR REPLACE INTO cached_tokens (account_id, token, customer_id, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [accountId, token, customerId, expiresAt, new Date().toISOString()],
    );

    logger.debug(TAG, `Token cached for account ${accountId}`);
  } catch (err) {
    logger.error(TAG, 'Failed to cache token', err);
    // Non-critical — proceed without caching
  }
}

/**
 * Get a cached token for an account, if still valid.
 */
export async function getCachedToken(
  accountId: string,
): Promise<CachedToken | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{
      account_id: string;
      token: string;
      customer_id: string;
      expires_at: string;
    }>(
      'SELECT * FROM cached_tokens WHERE account_id = ? AND expires_at > ?',
      [accountId, new Date().toISOString()],
    );

    if (!row) return null;

    return {
      accountId: row.account_id,
      token: row.token,
      customerId: row.customer_id,
      expiresAt: row.expires_at,
    };
  } catch {
    return null;
  }
}

/**
 * Remove cached token for an account.
 */
export async function clearCachedToken(accountId: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM cached_tokens WHERE account_id = ?', [
      accountId,
    ]);
  } catch {
    // Non-critical
  }
}

/**
 * Remove all expired tokens from the cache.
 */
export async function purgeExpiredTokens(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM cached_tokens WHERE expires_at < ?', [
      new Date().toISOString(),
    ]);
  } catch {
    // Non-critical
  }
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

/**
 * Clear all auth state: in-memory token and cached tokens for an account.
 */
export async function logout(accountId?: string): Promise<void> {
  clearAuthToken();

  if (accountId) {
    await clearCachedToken(accountId);
  }

  logger.info(TAG, 'Logged out');
}

// ---------------------------------------------------------------------------
// Token validation
// ---------------------------------------------------------------------------

/**
 * Check if a JWT token is expired by decoding its payload.
 * Returns true if expired or invalid.
 */
export function isTokenExpired(token: string): boolean {
  try {
    // JWT format: header.payload.signature
    const parts = token.replace(/^Bearer\s+/i, '').split('.');
    if (parts.length !== 3) return true;

    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;
    if (!exp) return false; // No expiration claim

    // exp is in seconds, Date.now() is in milliseconds
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Login with cached token if available, otherwise perform fresh login.
 */
export async function loginWithCache(
  accountId: string,
  dpId: string,
  username: string,
  password: string,
): Promise<LoginResult> {
  // Try cached token first
  const cached = await getCachedToken(accountId);
  if (cached && !isTokenExpired(cached.token)) {
    logger.info(TAG, `Using cached token for account ${accountId}`);
    setAuthToken(cached.token);
    return {
      token: cached.token,
      customerId: cached.customerId,
    };
  }

  // Fresh login
  const result = await login(dpId, username, password);

  // Cache the new token
  await cacheToken(accountId, result.token, result.customerId);

  return result;
}
