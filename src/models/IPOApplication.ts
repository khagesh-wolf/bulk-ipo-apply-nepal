/**
 * IPO Application Model — Bulk IPO Apply Nepal
 *
 * Represents a single IPO application record linked to one account.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ApplicationStatus =
  | 'PENDING'
  | 'APPLIED'
  | 'ALLOTTED'
  | 'NOT_ALLOTTED'
  | 'FAILED';

export interface IPOApplication {
  id: string;
  accountId: string;
  accountNickname: string;
  issueId: string;
  companyName: string;
  symbol: string;
  appliedUnits: number;
  appliedDate: string;       // ISO 8601
  status: ApplicationStatus;
  errorMessage?: string;
  allottedUnits?: number;
  applicantFormId?: string;
}

// ---------------------------------------------------------------------------
// Database row
// ---------------------------------------------------------------------------

export interface ApplicationRow {
  id: string;
  account_id: string;
  account_nickname: string;
  issue_id: string;
  company_name: string;
  symbol: string;
  applied_units: number;
  applied_date: string;
  status: string;
  error_message: string | null;
  allotted_units: number | null;
  applicant_form_id: string | null;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

export function applicationRowToApplication(row: ApplicationRow): IPOApplication {
  return {
    id: row.id,
    accountId: row.account_id,
    accountNickname: row.account_nickname,
    issueId: row.issue_id,
    companyName: row.company_name,
    symbol: row.symbol,
    appliedUnits: row.applied_units,
    appliedDate: row.applied_date,
    status: row.status as ApplicationStatus,
    errorMessage: row.error_message ?? undefined,
    allottedUnits: row.allotted_units ?? undefined,
    applicantFormId: row.applicant_form_id ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Bulk apply result
// ---------------------------------------------------------------------------

export interface BulkApplyResult {
  accountId: string;
  accountNickname: string;
  success: boolean;
  applicationId?: string;
  errorMessage?: string;
}
