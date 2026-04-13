/**
 * API Endpoint Definitions — Bulk IPO Apply Nepal
 *
 * Centralized endpoint configuration for all MeroShare and CDSC APIs.
 * Based on documented curl requests from the CDSC backend.
 */

// ---------------------------------------------------------------------------
// Base URLs
// ---------------------------------------------------------------------------

export const MEROSHARE_BACKEND_URL = 'https://webbackend.cdsc.com.np';
export const IPO_RESULT_URL = 'https://iporesult.cdsc.com.np';

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export const AUTH = {
  /** POST - Login with DP ID, Username, Password */
  LOGIN: `${MEROSHARE_BACKEND_URL}/api/meroShare/auth/`,
  /** GET - Get own details after login */
  OWN_DETAIL: `${MEROSHARE_BACKEND_URL}/api/meroShare/ownDetail/`,
  /** GET - Get list of capital (DP) providers for login dropdown */
  CAPITALS: `${MEROSHARE_BACKEND_URL}/api/meroShare/capital/`,
} as const;

// ---------------------------------------------------------------------------
// IPO / Issue endpoints
// ---------------------------------------------------------------------------

export const IPO = {
  /** POST - Fetch active/applicable IPO issues */
  APPLICABLE_ISSUES: `${MEROSHARE_BACKEND_URL}/api/meroShare/companyShare/applicableIssue/`,
  /** POST - Submit IPO application */
  APPLY: `${MEROSHARE_BACKEND_URL}/api/meroShare/applicantForm/share/apply`,
  /** GET - Check reapply eligibility for a share */
  REAPPLY: (shareId: string) =>
    `${MEROSHARE_BACKEND_URL}/api/meroShare/applicantForm/reapply/${shareId}`,
  /** POST - Get application history/search */
  APPLICATION_HISTORY: `${MEROSHARE_BACKEND_URL}/api/meroShare/applicantForm/active/search/`,
  /** GET - Get application report */
  APPLICATION_REPORT: (applicantFormId: string) =>
    `${MEROSHARE_BACKEND_URL}/api/meroShare/applicantForm/report/${applicantFormId}`,
} as const;

// ---------------------------------------------------------------------------
// Account & Portfolio endpoints
// ---------------------------------------------------------------------------

export const ACCOUNT = {
  /** GET - Fetch account details by demat number */
  MY_DETAIL: (demat: string) =>
    `${MEROSHARE_BACKEND_URL}/api/meroShareView/myDetail/${demat}`,
  /** POST - Fetch portfolio holdings */
  MY_PORTFOLIO: `${MEROSHARE_BACKEND_URL}/api/meroShareView/myPortfolio/`,
  /** GET - Get bank list */
  BANKS: `${MEROSHARE_BACKEND_URL}/api/meroShare/bank/`,
  /** GET - Get bank branches */
  BANK_BRANCHES: (bankId: string) =>
    `${MEROSHARE_BACKEND_URL}/api/meroShare/bank/${bankId}/branch`,
} as const;

// ---------------------------------------------------------------------------
// IPO Result endpoints (iporesult.cdsc.com.np)
// ---------------------------------------------------------------------------

export const IPO_RESULT = {
  /** GET - Check available company results */
  COMPANY_LIST: `${IPO_RESULT_URL}/result/companyShares/fileUploaded`,
  /** POST - Get new captcha for result checking */
  CAPTCHA_RELOAD: (captchaId: string) =>
    `${IPO_RESULT_URL}/result/captcha/reload/${captchaId}`,
  /** POST - Check IPO allotment status */
  CHECK_RESULT: `${IPO_RESULT_URL}/result/result/check`,
} as const;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Client ID used in auth requests */
export const CLIENT_ID = 179;

/** Default request timeout in milliseconds */
export const DEFAULT_TIMEOUT_MS = 15_000;

/** Extended timeout for bulk operations */
export const BULK_TIMEOUT_MS = 30_000;
