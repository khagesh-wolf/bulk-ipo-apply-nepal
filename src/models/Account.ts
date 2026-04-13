/**
 * Account Data Model — Bulk IPO Apply Nepal
 *
 * Represents a MeroShare DP account stored in the local database.
 * Sensitive fields (password, pin, crn) are encrypted at rest.
 */

// ---------------------------------------------------------------------------
// Account interface (decrypted / in-memory)
// ---------------------------------------------------------------------------

export interface Account {
  id: string;
  nickname: string;
  dpId: string;
  username: string;
  password: string;       // plaintext in memory, encrypted at rest
  crn: string;            // plaintext in memory, encrypted at rest
  pin: string;            // plaintext in memory, encrypted at rest
  bankId: string;
  bankName: string;
  branchId?: string;
  accountNumber?: string;
  demat?: string;         // 16-digit BOID (DP + account)
  isActive: boolean;
  createdAt: string;      // ISO 8601
  lastUsed: string | null;
}

// ---------------------------------------------------------------------------
// Database row (encrypted fields)
// ---------------------------------------------------------------------------

export interface AccountRow {
  id: string;
  nickname: string;
  dp_id: string;
  username: string;
  encrypted_password: string;
  encrypted_crn: string;
  encrypted_pin: string;
  bank_id: string;
  bank_name: string;
  branch_id: string | null;
  account_number: string | null;
  demat: string | null;
  is_active: number;      // SQLite boolean: 0 | 1
  created_at: string;
  last_used: string | null;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

export function accountRowToAccount(
  row: AccountRow,
  decryptedPassword: string,
  decryptedCrn: string,
  decryptedPin: string,
): Account {
  return {
    id: row.id,
    nickname: row.nickname,
    dpId: row.dp_id,
    username: row.username,
    password: decryptedPassword,
    crn: decryptedCrn,
    pin: decryptedPin,
    bankId: row.bank_id,
    bankName: row.bank_name,
    branchId: row.branch_id ?? undefined,
    accountNumber: row.account_number ?? undefined,
    demat: row.demat ?? undefined,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    lastUsed: row.last_used,
  };
}

/**
 * Build a 16-digit BOID from DP ID and CRN.
 */
export function buildBoid(dpId: string, crn: string): string {
  const dpDigits = dpId.replace(/\D/g, '').padStart(8, '0');
  const crnDigits = crn.replace(/\D/g, '').padStart(8, '0');
  return (dpDigits + crnDigits).slice(0, 16);
}
