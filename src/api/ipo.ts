/**
 * IPO Operations Service — Bulk IPO Apply Nepal
 *
 * Handles fetching active IPOs, submitting applications, checking
 * reapply eligibility, and application history.
 */

import { apiClient, withRetry, setAuthToken } from './client';
import { IPO, MEROSHARE_BACKEND_URL } from './endpoints';
import { logger } from '@/src/utils/logger';
import { IPOApplicationError } from '@/src/utils/errors';

const TAG = 'IPOService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActiveIssue {
  companyShareId: number;
  subGroup: string;
  scrip: string;
  companyName: string;
  shareTypeName: string;
  shareGroupName: string;
  issueOpenDate: string;
  issueCloseDate: string;
  issueStatus: string;
  issueType: string;
  minUnit: number;
  maxUnit: number;
  sharePerUnit: number;
  action?: string;
}

export interface ApplyParams {
  companyShareId: number;
  demat: string;
  boid: string;
  accountNumber: string;      // CRN
  customerId: number;
  accountBranchId: number;
  appliedKitta: number;
  crnNumber: string;
  transactionPIN: string;
  bankId: number;
}

export interface ApplyResponse {
  status: string;
  message: string;
  applicantFormId?: number;
}

export interface ApplicationHistoryItem {
  applicantFormId: number;
  companyShareId: number;
  companyName: string;
  scrip: string;
  appliedDate: string;
  appliedKitta: number;
  amount: number;
  statusName: string;
}

// ---------------------------------------------------------------------------
// Fetch active issues
// ---------------------------------------------------------------------------

/**
 * Fetch all currently applicable (open) IPO/Rights issues.
 */
export async function getActiveIssues(
  token: string,
): Promise<ActiveIssue[]> {
  return withRetry(async () => {
    setAuthToken(token);
    const response = await apiClient.post<{ object: ActiveIssue[] }>(
      '/api/meroShare/companyShare/applicableIssue/',
      {
        filterFieldParams: [
          { key: 'companyIssue.companyISIN.script', alias: 'Scrip' },
          { key: 'companyIssue.companyISIN.company.name', alias: 'Company Name' },
        ],
        page: 1,
        size: 200,
        searchRoleViewConstants: 'VIEW_APPLICABLE_SHARE',
        filterDateParams: [
          {
            key: 'minIssueOpenDate',
            condition: '',
            alias: '',
            value: '',
          },
          {
            key: 'maxIssueCloseDate',
            condition: '',
            alias: '',
            value: '',
          },
        ],
      },
    );

    const data = response.data;
    const issues = Array.isArray(data) ? data : (data?.object ?? []);
    logger.info(TAG, `Fetched ${issues.length} active issues`);
    return issues;
  });
}

// ---------------------------------------------------------------------------
// Apply for IPO
// ---------------------------------------------------------------------------

/**
 * Submit an IPO application.
 */
export async function applyForIPO(
  token: string,
  params: ApplyParams,
): Promise<ApplyResponse> {
  return withRetry(async () => {
    setAuthToken(token);

    logger.info(TAG, `Applying for IPO: companyShareId=${params.companyShareId}`);

    const response = await apiClient.post<ApplyResponse>(
      '/api/meroShare/applicantForm/share/apply',
      {
        accountBranchId: params.accountBranchId,
        accountNumber: params.accountNumber,
        appliedKitta: String(params.appliedKitta),
        bankId: params.bankId,
        boid: params.boid,
        companyShareId: params.companyShareId,
        crnNumber: params.crnNumber,
        customerId: params.customerId,
        demat: params.demat,
        transactionPIN: params.transactionPIN,
      },
    );

    const result = response.data;
    logger.info(TAG, `Apply result: ${result.status} - ${result.message}`);
    return result;
  }, 2); // 2 retries for apply
}

// ---------------------------------------------------------------------------
// Check reapply eligibility
// ---------------------------------------------------------------------------

/**
 * Check if an account is eligible to reapply for a specific share.
 */
export async function checkReapplyEligibility(
  token: string,
  shareId: string,
): Promise<{ isEligible: boolean; message: string }> {
  try {
    setAuthToken(token);
    const response = await apiClient.get<{ statusName?: string; message?: string }>(
      `/api/meroShare/applicantForm/reapply/${shareId}`,
    );

    const data = response.data;
    return {
      isEligible: true,
      message: data?.message ?? 'Eligible to reapply',
    };
  } catch (err) {
    return {
      isEligible: false,
      message: err instanceof Error ? err.message : 'Not eligible to reapply',
    };
  }
}

// ---------------------------------------------------------------------------
// Application history
// ---------------------------------------------------------------------------

/**
 * Fetch application history for the current user.
 */
export async function getApplicationHistory(
  token: string,
  page = 1,
  size = 200,
): Promise<ApplicationHistoryItem[]> {
  return withRetry(async () => {
    setAuthToken(token);
    const response = await apiClient.post<{
      object: ApplicationHistoryItem[];
    }>('/api/meroShare/applicantForm/active/search/', {
      filterFieldParams: [
        {
          key: 'companyShare.companyIssue.companyISIN.script',
          alias: 'Scrip',
        },
        {
          key: 'companyShare.companyIssue.companyISIN.company.name',
          alias: 'Company Name',
        },
      ],
      page,
      size,
      searchRoleViewConstants: 'VIEW_APPLICANT_FORM_COMPLETE',
      filterDateParams: [
        { key: 'appliedDate', condition: '', alias: '', value: '' },
        { key: 'appliedDate', condition: '', alias: '', value: '' },
      ],
    });

    const items = response.data?.object ?? [];
    logger.info(TAG, `Fetched ${items.length} application history items`);
    return items;
  });
}
