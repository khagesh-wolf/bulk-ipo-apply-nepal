/**
 * Axios HTTP Client — Bulk IPO Apply Nepal
 *
 * Configured Axios instance with:
 * - Request interceptor for JWT token injection
 * - Response interceptor for error normalisation
 * - Token expiration detection & auto-logout
 * - Retry logic with exponential backoff
 */

import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { MEROSHARE_BACKEND_URL, DEFAULT_TIMEOUT_MS } from './endpoints';
import { logger } from '@/src/utils/logger';
import {
  NetworkError,
  ApiError,
  TokenExpiredError,
  RateLimitError,
  AuthError,
} from '@/src/utils/errors';

const TAG = 'ApiClient';

// ---------------------------------------------------------------------------
// Token store (in-memory)
// ---------------------------------------------------------------------------

let currentToken: string | null = null;

export function setAuthToken(token: string | null): void {
  currentToken = token;
}

export function getAuthToken(): string | null {
  return currentToken;
}

export function clearAuthToken(): void {
  currentToken = null;
}

// ---------------------------------------------------------------------------
// Token expiration callback
// ---------------------------------------------------------------------------

type TokenExpiredCallback = () => void;
let onTokenExpired: TokenExpiredCallback | null = null;

export function setOnTokenExpired(callback: TokenExpiredCallback): void {
  onTokenExpired = callback;
}

// ---------------------------------------------------------------------------
// Create Axios instance
// ---------------------------------------------------------------------------

export function createApiClient(baseURL = MEROSHARE_BACKEND_URL): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: DEFAULT_TIMEOUT_MS,
    withCredentials: false,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // ----- Request interceptor: inject auth token -----
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (config.headers) {
        // After login, use the real JWT token; before login send literal "null"
        // as required by the MeroShare API.
        config.headers.Authorization = currentToken ?? 'null';
      }
      logger.debug(TAG, `→ ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => Promise.reject(error),
  );

  // ----- Response interceptor: normalise errors -----
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      logger.debug(TAG, `← ${response.status} ${response.config.url}`);
      return response;
    },
    (error: AxiosError<{ message?: string; error?: string }>) => {
      return Promise.reject(normalizeError(error));
    },
  );

  return client;
}

// ---------------------------------------------------------------------------
// Error normalisation
// ---------------------------------------------------------------------------

function normalizeError(error: AxiosError<{ message?: string; error?: string }>): Error {
  if (!error.response) {
    // Network error (no response)
    logger.error(TAG, 'Network error', error.message);
    return new NetworkError(error.message ?? 'Network request failed');
  }

  const { status, data } = error.response;
  const serverMessage = data?.message ?? data?.error ?? error.message;

  // Token expired / unauthorized
  if (status === 401) {
    // Distinguish between a failed login (no token yet) and an expired token
    if (currentToken) {
      logger.warn(TAG, 'Token expired or unauthorized');
      if (onTokenExpired) onTokenExpired();
      return new TokenExpiredError();
    }
    // No token means this was a login attempt — surface the server message
    return new AuthError(
      serverMessage ?? 'Authentication failed (401). Check your credentials.',
    );
  }

  // Forbidden
  if (status === 403) {
    return new AuthError(serverMessage ?? 'Access denied');
  }

  // Rate limited
  if (status === 429) {
    const retryAfter = parseInt(
      error.response.headers['retry-after'] ?? '60',
      10,
    );
    return new RateLimitError(retryAfter * 1000);
  }

  // Other API errors
  return new ApiError(
    status,
    serverMessage ?? `HTTP ${status}`,
    undefined,
    data,
  );
}

// ---------------------------------------------------------------------------
// Retry helper with exponential backoff
// ---------------------------------------------------------------------------

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Don't retry non-retryable errors
      if (err instanceof TokenExpiredError) throw err;
      if (err instanceof AuthError) throw err;

      // Rate limit: wait the specified time
      if (err instanceof RateLimitError) {
        if (attempt < maxRetries) {
          logger.warn(TAG, `Rate limited, waiting ${err.retryAfterMs}ms`);
          await delay(err.retryAfterMs);
          continue;
        }
        throw err;
      }

      // Exponential backoff for retryable errors
      if (attempt < maxRetries) {
        const waitMs = baseDelayMs * Math.pow(2, attempt);
        logger.warn(
          TAG,
          `Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${waitMs}ms`,
        );
        await delay(waitMs);
      }
    }
  }

  throw lastError;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Singleton client
// ---------------------------------------------------------------------------

export const apiClient = createApiClient();
