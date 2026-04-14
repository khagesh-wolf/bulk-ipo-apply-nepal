/**
 * DP Store (Zustand)
 *
 * Manages the list of Depository Participants (DP) fetched from CDSC.
 * Caches the list to avoid repeated fetches.
 */

import { create } from 'zustand';
import { fetchDPList, searchDPList, type DPEntity } from '@/lib/dpService';

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface DPStore {
  dpList: DPEntity[];
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;

  /** Fetch the DP list from the CDSC API (cached after first call). */
  fetchDPList: (force?: boolean) => Promise<void>;

  /** Search the cached DP list by ID/code or name. */
  searchDP: (query: string) => DPEntity[];

  /** Clear error state. */
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

export const useDPStore = create<DPStore>((set, get) => ({
  dpList: [],
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchDPList: async (force = false) => {
    const { dpList, lastFetched, isLoading } = get();

    // Skip if already loading
    if (isLoading) return;

    // Use cache if available and not forcing refresh
    if (!force && dpList.length > 0 && lastFetched) return;

    set({ isLoading: true, error: null });

    try {
      const list = await fetchDPList();

      if (list.length === 0) {
        set({
          isLoading: false,
          error: 'Could not fetch DP list. Please check your connection.',
        });
        return;
      }

      set({
        dpList: list,
        isLoading: false,
        lastFetched: new Date().toISOString(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch DP list';
      set({ isLoading: false, error: message });
    }
  },

  searchDP: (query: string) => {
    const { dpList } = get();
    return searchDPList(dpList, query);
  },

  clearError: () => set({ error: null }),
}));

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** Get a DP by its ID. */
export const selectDPById =
  (id: number) =>
  (state: DPStore): DPEntity | undefined =>
    state.dpList.find((dp) => dp.id === id);
