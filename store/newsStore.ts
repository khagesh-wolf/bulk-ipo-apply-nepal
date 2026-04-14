/**
 * News Store (Zustand)
 *
 * Manages news articles from multiple sources with category filtering.
 */

import { create } from 'zustand';
import type { NewsArticle, NewsCategory, NewsSource } from '@/types';
import { fetchNews, filterNewsByCategory } from '@/lib/newsApi';

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface NewsStore {
  articles: NewsArticle[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  selectedCategory: NewsCategory | null;
  selectedSource: NewsSource | null;

  /** Fetch all news from all sources. */
  fetchAllNews: () => Promise<void>;

  /** Fetch news from a specific source. */
  fetchNewsBySource: (source: NewsSource) => Promise<void>;

  /** Set category filter. */
  setCategory: (category: NewsCategory | null) => void;

  /** Set source filter. */
  setSource: (source: NewsSource | null) => void;

  /** Clear error state. */
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

export const useNewsStore = create<NewsStore>((set) => ({
  articles: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  selectedCategory: null,
  selectedSource: null,

  fetchAllNews: async () => {
    set({ isLoading: true, error: null });

    try {
      const articles = await fetchNews();
      set({
        articles,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch news';
      set({ isLoading: false, error: message });
    }
  },

  fetchNewsBySource: async (source: NewsSource) => {
    set({ isLoading: true, error: null, selectedSource: source });

    try {
      const articles = await fetchNews(source);
      set({
        articles,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch news';
      set({ isLoading: false, error: message });
    }
  },

  setCategory: (category) => set({ selectedCategory: category }),
  setSource: (source) => set({ selectedSource: source }),
  clearError: () => set({ error: null }),
}));

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** Get filtered articles by currently selected category. */
export const selectFilteredArticles = (state: NewsStore): NewsArticle[] => {
  if (!state.selectedCategory) return state.articles;
  return filterNewsByCategory(state.articles, state.selectedCategory);
};

/** Get articles by category. */
export const selectArticlesByCategory =
  (category: NewsCategory) =>
  (state: NewsStore): NewsArticle[] =>
    state.articles.filter((a) => a.category === category);

/** Get unique categories from loaded articles. */
export const selectAvailableCategories = (state: NewsStore): NewsCategory[] => {
  const categories = new Set(state.articles.map((a) => a.category));
  return Array.from(categories);
};
