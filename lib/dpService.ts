/**
 * DP (Depository Participant) Service — Bulk IPO Apply Nepal
 *
 * Fetches the list of capital/DP entities from the CDSC MeroShare API.
 * No authentication is required for this endpoint.
 */

import axios from 'axios';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DPEntity {
  id: number;
  code: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DP_LIST_URL = 'https://webbackend.cdsc.com.np/api/meroShare/capital/';
const API_TIMEOUT = 15_000;

// ---------------------------------------------------------------------------
// Raw API shape
// ---------------------------------------------------------------------------

interface RawCapitalEntity {
  id?: number;
  code?: string;
  name?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch all DP / capital entities from the CDSC API.
 * Returns an empty array on network error.
 */
export async function fetchDPList(): Promise<DPEntity[]> {
  try {
    const response = await axios.get<RawCapitalEntity[]>(DP_LIST_URL, {
      timeout: API_TIMEOUT,
      headers: {
        Authorization: 'null',
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;
    if (!Array.isArray(data)) return [];

    return data
      .filter((item) => item.id != null && item.name)
      .map((item) => ({
        id: item.id!,
        code: String(item.code ?? item.id),
        name: item.name!,
      }));
  } catch {
    return [];
  }
}

/**
 * Search/filter DP list by query string.
 * Matches against both ID/code and company name (case-insensitive).
 */
export function searchDPList(dpList: DPEntity[], query: string): DPEntity[] {
  if (!query.trim()) return dpList;

  const q = query.toLowerCase().trim();
  return dpList.filter(
    (dp) =>
      String(dp.id).includes(q) ||
      dp.code.toLowerCase().includes(q) ||
      dp.name.toLowerCase().includes(q),
  );
}
