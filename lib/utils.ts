/**
 * Shared utility helpers — Bulk IPO Apply Nepal
 */

/**
 * Masks a DP ID string, showing only the last 4 digits.
 * e.g. "13060012345" → "******2345"
 */
export function maskDpId(dpId: string | undefined): string {
  if (!dpId) return '**********';
  const last4 = dpId.slice(-4);
  return '*'.repeat(Math.max(4, dpId.length - 4)) + last4;
}
