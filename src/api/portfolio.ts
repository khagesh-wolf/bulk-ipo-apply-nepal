/**
 * Portfolio Service — Bulk IPO Apply Nepal
 *
 * Fetches account details and portfolio holdings from MeroShare.
 */

import { apiClient, withRetry, setAuthToken } from './client';
import { logger } from '@/src/utils/logger';
import type { PortfolioHolding, AccountDetail } from '@/src/models/Portfolio';

const TAG = 'PortfolioService';

// ---------------------------------------------------------------------------
// Raw API types
// ---------------------------------------------------------------------------

interface MyDetailRaw {
  name?: string;
  email?: string;
  mobileNumber?: string;
  address?: string;
  dpId?: string;
  clientCode?: string;
  boid?: string;
  bankName?: string;
  accountNumber?: string;
  branchName?: string;
}

interface PortfolioItemRaw {
  script?: string;
  scriptDesc?: string;
  currentBalance?: number;
  previousClosingPrice?: number;
  lastTransactionPrice?: number;
  valueOfLastTransPrice?: number;
  valueOfPrevClosingPrice?: number;
}

interface PortfolioResponseRaw {
  meroShareMyPortfolio?: PortfolioItemRaw[];
  totalItems?: number;
}

// ---------------------------------------------------------------------------
// Account details
// ---------------------------------------------------------------------------

/**
 * Fetch account details for a specific demat number.
 */
export async function getAccountDetail(
  token: string,
  demat: string,
): Promise<AccountDetail> {
  return withRetry(async () => {
    setAuthToken(token);

    const response = await apiClient.get<MyDetailRaw>(
      `/api/meroShareView/myDetail/${demat}`,
    );

    const raw = response.data;
    logger.info(TAG, `Fetched account detail for demat: ${demat}`);

    return {
      name: raw.name ?? '',
      email: raw.email ?? '',
      phone: raw.mobileNumber ?? '',
      address: raw.address ?? '',
      dpId: raw.dpId ?? '',
      clientCode: raw.clientCode ?? '',
      boid: raw.boid ?? '',
      bankName: raw.bankName ?? '',
      bankAccountNumber: raw.accountNumber ?? '',
      branchName: raw.branchName ?? '',
    };
  });
}

// ---------------------------------------------------------------------------
// Portfolio holdings
// ---------------------------------------------------------------------------

/**
 * Fetch portfolio holdings for the logged-in user.
 */
export async function getPortfolioHoldings(
  token: string,
  accountId: string,
  page = 1,
  size = 200,
): Promise<PortfolioHolding[]> {
  return withRetry(async () => {
    setAuthToken(token);

    const response = await apiClient.post<PortfolioResponseRaw>(
      '/api/meroShareView/myPortfolio/',
      {
        sortBy: 'script',
        demat: [''],
        clientCode: '',
        page,
        size,
        sortAsc: true,
      },
    );

    const items = response.data?.meroShareMyPortfolio ?? [];
    logger.info(TAG, `Fetched ${items.length} portfolio holdings`);

    return items.map((item) => ({
      symbol: item.script ?? '',
      companyName: item.scriptDesc ?? item.script ?? '',
      scriptDesc: item.scriptDesc,
      currentBalance: item.currentBalance ?? 0,
      previousClosingPrice: item.previousClosingPrice ?? 0,
      lastTransactionPrice: item.lastTransactionPrice ?? 0,
      valueOfLastTransPrice: item.valueOfLastTransPrice ?? 0,
      valueOfPrevClosingPrice: item.valueOfPrevClosingPrice ?? 0,
      accountId,
    }));
  });
}

// ---------------------------------------------------------------------------
// Bank list
// ---------------------------------------------------------------------------

/**
 * Fetch available banks from MeroShare.
 */
export async function getBanks(
  token: string,
): Promise<Array<{ id: number; code: string; name: string }>> {
  return withRetry(async () => {
    setAuthToken(token);

    const response = await apiClient.get<
      Array<{ id: number; code: string; name: string }>
    >('/api/meroShare/bank/');

    return Array.isArray(response.data) ? response.data : [];
  });
}

/**
 * Fetch branches for a specific bank.
 */
export async function getBankBranches(
  token: string,
  bankId: string,
): Promise<Array<{ id: number; name: string }>> {
  return withRetry(async () => {
    setAuthToken(token);

    const response = await apiClient.get<Array<{ id: number; name: string }>>(
      `/api/meroShare/bank/${bankId}/branch`,
    );

    return Array.isArray(response.data) ? response.data : [];
  });
}
