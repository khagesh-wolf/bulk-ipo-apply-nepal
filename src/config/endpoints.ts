/**
 * Legacy config/endpoints — re-exports from src/api/endpoints.ts
 *
 * Kept for backward compatibility. New code should import from
 * @/src/api/endpoints instead.
 */

export {
  MEROSHARE_BACKEND_URL,
  IPO_RESULT_URL,
  AUTH,
  IPO,
  ACCOUNT,
  IPO_RESULT,
  CLIENT_ID,
  DEFAULT_TIMEOUT_MS,
  BULK_TIMEOUT_MS,
} from '@/src/api/endpoints';