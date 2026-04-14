/**
 * MeroShare API Client
 *
 * Wraps the CDSC MeroShare REST API (https://meroshare.cdsc.com.np/api/v2).
 * All endpoints require a Bearer token obtained via login().
 *
 * NOTE: Direct API calls from web will be blocked by CORS — this is expected
 * behaviour for a mobile-first application.
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import type {
  IPOIssue,
  MeroShareApplyParams,
  MeroShareLoginResponse,
  MeroShareApplicableIssueRaw,
  ShareType,
  IssueStatus,
  BulkApplyResult,
} from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MEROSHARE_BASE_URL = 'https://webbackend.cdsc.com.np/api/meroShare';
const CDSC_RESULT_URL = 'https://iporesult.cdsc.com.np/result/result/check';
const DEFAULT_TIMEOUT_MS = 15_000;
const MEROSHARE_CLIENT_ID = 179;

// ---------------------------------------------------------------------------
// Raw API shapes
// ---------------------------------------------------------------------------

interface LoginResponseBody {
  [key: string]: unknown;
}

interface ApplyResponse {
  message: string;
  applicantFormId?: number;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapShareType(raw: string): ShareType {
  const typeMap: Record<string, ShareType> = {
    ordinary: 'Ordinary',
    right: 'Right',
    fpo: 'FPO',
    debenture: 'Debenture',
    'mutual fund': 'Mutual Fund',
  };
  return typeMap[raw.toLowerCase()] ?? 'Ordinary';
}

function mapStatusLabel(isOpen: boolean, closeDate: string): IssueStatus {
  if (isOpen) return 'Open';
  const now = Date.now();
  const close = new Date(closeDate).getTime();
  return now < close ? 'Upcoming' : 'Closed';
}

function mapRawIssue(raw: MeroShareApplicableIssueRaw): IPOIssue {
  return {
    id: String(raw.id),
    companyName: raw.companyName,
    symbol: raw.scrip,
    shareType: mapShareType(raw.shareTypeName ?? raw.shareGroupName ?? ''),
    openDate: raw.issueOpenDate ?? raw.openDate,
    closeDate: raw.issueCloseDate ?? raw.closeDate,
    pricePerUnit: raw.sharePerUnit ?? 100,
    minUnit: raw.minUnit,
    maxUnit: raw.maxUnit,
    totalUnits: 0, // not returned in list endpoint
    isOpen: raw.isOpen,
    statusLabel: mapStatusLabel(raw.isOpen, raw.issueCloseDate ?? raw.closeDate),
    subIssueId: String(raw.subGroup),
    companyShareId: String(raw.companyShareId),
  };
}

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

function formatApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const ae = error as AxiosError<{ message?: string; error?: string }>;
    const status = ae.response?.status;
    const serverMsg =
      ae.response?.data?.message ??
      ae.response?.data?.error ??
      ae.message ??
      'Network error';
    return status ? `HTTP ${status}: ${serverMsg}` : serverMsg;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

// ---------------------------------------------------------------------------
// MeroShareApiClient
// ---------------------------------------------------------------------------

export class MeroShareApiClient {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: MEROSHARE_BASE_URL,
      timeout: DEFAULT_TIMEOUT_MS,
      withCredentials: false,
      headers: {
        'Content-Type': 'application/json',
        // MeroShare API requires the literal string "null" as the
        // Authorization value for unauthenticated (login) requests.
        Authorization: 'null',
      },
    });

    // Response interceptor: unwrap data and normalise errors
    this.http.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        const message = formatApiError(error);
        return Promise.reject(new Error(message));
      },
    );
  }

  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------

  /**
   * Login with DP credentials. Returns token and customerId.
   * MeroShare returns the JWT token in the response body (plain string).
   */
  async login(
    dpId: string,
    username: string,
    password: string,
  ): Promise<MeroShareLoginResponse> {
    const response = await this.http.post<LoginResponseBody>('/auth/', {
      clientId: MEROSHARE_CLIENT_ID,
      username,
      password,
    });

    // MeroShare returns the JWT token directly in the response body.
    const raw = response.data;
    let token = '';
    if (typeof raw === 'string' && raw.length > 0) {
      token = raw.trim();
    } else if (raw && typeof raw === 'object') {
      const body = raw as Record<string, unknown>;
      token = String(body.token ?? body.accessToken ?? '').trim();
    }

    // Fall back to Authorization header if body didn't contain a token
    if (!token) {
      const authHeader =
        (response.headers['authorization'] as string | undefined) ??
        (response.headers['Authorization'] as string | undefined) ??
        '';
      token = authHeader.replace(/^Bearer\s+/i, '').trim();
    }

    // customerId may come in the body
    const body =
      typeof raw === 'object' && raw !== null
        ? (raw as Record<string, unknown>)
        : {};
    const customerId = String(
      body.id ?? body.customerId ?? body.userId ?? '',
    );

    if (!token) {
      throw new Error('Login failed: no token received from MeroShare.');
    }

    return { token, customerId };
  }

  // -------------------------------------------------------------------------
  // Issues
  // -------------------------------------------------------------------------

  /**
   * Fetch all applicable (currently open/upcoming) IPO/Rights issues.
   */
  async getActiveIssues(token: string): Promise<IPOIssue[]> {
    const response = await this.http.post<MeroShareApplicableIssueRaw[] | { object: MeroShareApplicableIssueRaw[] }>(
      '/companyShare/applicableIssue/',
      {
        filterFieldParams: [
          { key: 'companyIssue.companyISIN.script', alias: 'Scrip' },
          { key: 'companyIssue.companyISIN.company.name', alias: 'Company Name' },
        ],
        page: 1,
        size: 200,
        searchRoleViewConstants: 'VIEW_APPLICABLE_SHARE',
        filterDateParams: [
          { key: 'minIssueOpenDate', condition: '', alias: '', value: '' },
          { key: 'maxIssueCloseDate', condition: '', alias: '', value: '' },
        ],
      },
      {
        headers: { Authorization: token },
      },
    );

    const rawData = response.data;
    const data = Array.isArray(rawData) ? rawData : ((rawData as { object?: MeroShareApplicableIssueRaw[] })?.object ?? []);
    return data.map(mapRawIssue);
  }

  /**
   * Get applicable units for a given company share.
   */
  async getApplicableUnits(
    token: string,
    companyShareId: string,
  ): Promise<{ minUnit: number; maxUnit: number }> {
    const response = await this.http.get<{ minUnit: number; maxUnit: number }>(
      `/companyShare/applicableIssue/${companyShareId}/applyunit`,
      { headers: { Authorization: token } },
    );
    return {
      minUnit: response.data.minUnit ?? 10,
      maxUnit: response.data.maxUnit ?? 10,
    };
  }

  // -------------------------------------------------------------------------
  // Applications
  // -------------------------------------------------------------------------

  /**
   * Apply for an IPO issue.
   */
  async applyIPO(
    token: string,
    params: MeroShareApplyParams,
  ): Promise<{ applicantFormId: string; message: string }> {
    const response = await this.http.post<ApplyResponse>(
      '/applicantForm/share/apply',
      params,
      { headers: { Authorization: token } },
    );

    return {
      applicantFormId: String(response.data.applicantFormId ?? ''),
      message: response.data.message ?? 'Applied successfully',
    };
  }

  /**
   * Edit an existing IPO application.
   */
  async editApplication(
    token: string,
    applicantFormId: string,
    params: Partial<MeroShareApplyParams>,
  ): Promise<void> {
    await this.http.post(
      `/applicantForm/share/editapplication/${applicantFormId}`,
      params,
      { headers: { Authorization: token } },
    );
  }

  /**
   * Get details of a specific application.
   */
  async getApplicationDetails(
    token: string,
    applicantFormId: string,
  ): Promise<Record<string, unknown>> {
    const response = await this.http.get<Record<string, unknown>>(
      `/applicantForm/report/${applicantFormId}`,
      { headers: { Authorization: token } },
    );
    return response.data;
  }

  // -------------------------------------------------------------------------
  // Bank / Branch
  // -------------------------------------------------------------------------

  /**
   * Fetch the list of banks available in MeroShare.
   */
  async getBanks(
    token: string,
  ): Promise<Array<{ id: number; name: string; code: string }>> {
    const response = await this.http.get<
      Array<{ id: number; name: string; code: string }>
    >('/bank/', { headers: { Authorization: token } });
    return Array.isArray(response.data) ? response.data : [];
  }

  /**
   * Fetch branches for a given bank.
   */
  async getBankBranches(
    token: string,
    bankId: string,
  ): Promise<Array<{ id: number; name: string }>> {
    const response = await this.http.get<Array<{ id: number; name: string }>>(
      `/bank/branch/?bankId=${bankId}`,
      { headers: { Authorization: token } },
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  // -------------------------------------------------------------------------
  // Allotment results
  // -------------------------------------------------------------------------

  /**
   * Check allotment result from CDSC public result endpoint.
   * boid: 16-digit BOID number (DP + account number)
   */
  async checkAllotmentResult(
    boid: string,
  ): Promise<{
    isAllotted: boolean;
    allottedUnits: number;
    message: string;
  }> {
    try {
      const response = await axios.post<{
        success: boolean;
        description?: string;
        detail?: { allotedKitta?: number };
      }>(CDSC_RESULT_URL, {
        boid,
      }, {
        timeout: DEFAULT_TIMEOUT_MS,
      });

      const body = response.data;
      const allottedUnits = body.detail?.allotedKitta ?? 0;
      const isAllotted = body.success && allottedUnits > 0;

      return {
        isAllotted,
        allottedUnits,
        message: body.description ?? (isAllotted ? 'Allotted' : 'Not allotted'),
      };
    } catch {
      return {
        isAllotted: false,
        allottedUnits: 0,
        message: 'Could not fetch allotment result.',
      };
    }
  }

  // -------------------------------------------------------------------------
  // Bulk apply helper
  // -------------------------------------------------------------------------

  /**
   * Apply for an IPO across multiple accounts sequentially.
   * Returns one BulkApplyResult per account.
   */
  async bulkApply(
    accounts: Array<{
      id: string;
      nickname: string;
      dpId: string;
      username: string;
      password: string;
      crn: string;
      bankId: string;
    }>,
    issueId: string,
    companyShareId: string,
    appliedKitta: number,
    reservationTypeId = 1,
  ): Promise<BulkApplyResult[]> {
    const results: BulkApplyResult[] = [];

    for (const account of accounts) {
      try {
        // 1. Login
        const { token, customerId } = await this.login(
          account.dpId,
          account.username,
          account.password,
        );

        // 2. Apply
        const { applicantFormId } = await this.applyIPO(token, {
          accountBranchId: 0, // resolved at API level
          accountNumber: account.crn,
          appliedKitta,
          crnNumber: account.crn,
          customerId,
          issueId: Number(issueId),
          reservationTypeId,
        });

        results.push({
          accountId: account.id,
          accountNickname: account.nickname,
          success: true,
          applicationId: applicantFormId,
        });
      } catch (err) {
        results.push({
          accountId: account.id,
          accountNickname: account.nickname,
          success: false,
          errorMessage: formatApiError(err),
        });
      }
    }

    return results;
  }
}

// Singleton instance for convenience
export const meroshareApi = new MeroShareApiClient();
