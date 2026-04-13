/**
 * IPO Result Checker Service — Bulk IPO Apply Nepal
 *
 * Checks IPO allotment results from iporesult.cdsc.com.np.
 * Handles captcha generation and result verification.
 */

import axios from 'axios';
import { IPO_RESULT, DEFAULT_TIMEOUT_MS } from './endpoints';
import { withRetry } from './client';
import { logger } from '@/src/utils/logger';

const TAG = 'IPOResultService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompanyResult {
  id: number;
  companyName: string;
  scrip: string;
}

export interface CaptchaResponse {
  captchaIdentifier: string;
  captchaImage: string;     // Base64 image data
}

export interface AllotmentResult {
  isAllotted: boolean;
  allottedUnits: number;
  companyName: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Available results
// ---------------------------------------------------------------------------

/**
 * Get list of companies whose IPO results are available.
 */
export async function getAvailableResults(): Promise<CompanyResult[]> {
  return withRetry(async () => {
    const response = await axios.get<CompanyResult[]>(
      IPO_RESULT.COMPANY_LIST,
      { timeout: DEFAULT_TIMEOUT_MS },
    );

    const results = Array.isArray(response.data) ? response.data : [];
    logger.info(TAG, `Found ${results.length} available IPO results`);
    return results;
  });
}

// ---------------------------------------------------------------------------
// Captcha
// ---------------------------------------------------------------------------

/**
 * Reload / generate a new captcha for result checking.
 */
export async function reloadCaptcha(
  captchaId: string,
): Promise<CaptchaResponse> {
  const response = await axios.post<{
    captchaIdentifier?: string;
    captcha?: string;
  }>(IPO_RESULT.CAPTCHA_RELOAD(captchaId), null, {
    timeout: DEFAULT_TIMEOUT_MS,
  });

  return {
    captchaIdentifier: response.data.captchaIdentifier ?? captchaId,
    captchaImage: response.data.captcha ?? '',
  };
}

// ---------------------------------------------------------------------------
// Check result
// ---------------------------------------------------------------------------

/**
 * Check IPO allotment result for a specific BOID and company.
 */
export async function checkAllotmentResult(
  boid: string,
  companyShareId: number,
  captchaIdentifier?: string,
  captchaValue?: string,
): Promise<AllotmentResult> {
  try {
    const response = await axios.post<{
      success?: boolean;
      message?: string;
      description?: string;
      detail?: {
        allotedKitta?: number;
        companyName?: string;
      };
    }>(
      IPO_RESULT.CHECK_RESULT,
      {
        boid,
        companyShareId,
        ...(captchaIdentifier && captchaValue
          ? { captchaIdentifier, captchaValue }
          : {}),
      },
      { timeout: DEFAULT_TIMEOUT_MS },
    );

    const body = response.data;
    const allottedUnits = body.detail?.allotedKitta ?? 0;
    const isAllotted = (body.success ?? false) && allottedUnits > 0;

    logger.info(
      TAG,
      `Result for BOID ${boid}: ${isAllotted ? 'ALLOTTED' : 'NOT ALLOTTED'} (${allottedUnits} units)`,
    );

    return {
      isAllotted,
      allottedUnits,
      companyName: body.detail?.companyName ?? '',
      message:
        body.description ??
        body.message ??
        (isAllotted ? 'Allotted' : 'Not allotted'),
    };
  } catch (err) {
    logger.error(TAG, `Failed to check result for BOID ${boid}`, err);
    return {
      isAllotted: false,
      allottedUnits: 0,
      companyName: '',
      message: 'Could not fetch allotment result.',
    };
  }
}

/**
 * Bulk check allotment results for multiple BOIDs.
 */
export async function bulkCheckResults(
  accounts: Array<{
    accountId: string;
    boid: string;
    nickname: string;
  }>,
  companyShareId: number,
): Promise<
  Array<{
    accountId: string;
    nickname: string;
    result: AllotmentResult;
  }>
> {
  const results: Array<{
    accountId: string;
    nickname: string;
    result: AllotmentResult;
  }> = [];

  for (const account of accounts) {
    const result = await checkAllotmentResult(
      account.boid,
      companyShareId,
    );
    results.push({
      accountId: account.accountId,
      nickname: account.nickname,
      result,
    });

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}
