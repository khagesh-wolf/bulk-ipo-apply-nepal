/**
 * Unit Tests — News API (Phase 4)
 *
 * Tests news categorization and filtering functions.
 */

import { categorizeNews, filterNewsByCategory, MOCK_NEWS } from '@/lib/newsApi';
import type { NewsArticle, NewsCategory } from '@/types';

describe('News API', () => {
  describe('categorizeNews', () => {
    it('should categorize IPO-related news', () => {
      const result = categorizeNews('New IPO Opens Today', 'The initial public offering begins');
      expect(result).toBe('IPO Announcements');
    });

    it('should categorize dividend news', () => {
      const result = categorizeNews('NABIL Declares 30% Dividend', 'Book close date set for next month');
      expect(result).toBe('Dividend');
    });

    it('should categorize regulatory news', () => {
      const result = categorizeNews('SEBON Issues New Regulation', 'New guidelines for listed companies');
      expect(result).toBe('Regulatory News');
    });

    it('should categorize company news', () => {
      const result = categorizeNews('Annual Report Published', 'Quarterly profit increased by 20%');
      expect(result).toBe('Company News');
    });

    it('should categorize market updates', () => {
      const result = categorizeNews('NEPSE Index Hits New High', 'Market trading volume surges');
      expect(result).toBe('Market Updates');
    });

    it('should default to General for unmatched content', () => {
      const result = categorizeNews('Random Title', 'Some random content');
      expect(result).toBe('General');
    });
  });

  describe('filterNewsByCategory', () => {
    it('should filter articles by category', () => {
      const ipoNews = filterNewsByCategory(MOCK_NEWS, 'IPO Announcements');
      expect(ipoNews.length).toBeGreaterThan(0);
      expect(ipoNews.every((a) => a.category === 'IPO Announcements')).toBe(true);
    });

    it('should filter market updates', () => {
      const marketNews = filterNewsByCategory(MOCK_NEWS, 'Market Updates');
      expect(marketNews.length).toBeGreaterThan(0);
    });

    it('should return empty array for category with no articles', () => {
      const articles: NewsArticle[] = [
        {
          id: '1',
          title: 'Test',
          summary: 'Test',
          url: 'http://test.com',
          source: 'ShareSansar',
          category: 'Market Updates',
          publishedAt: new Date().toISOString(),
        },
      ];

      const result = filterNewsByCategory(articles, 'Regulatory News');
      expect(result).toHaveLength(0);
    });
  });

  describe('MOCK_NEWS', () => {
    it('should have at least 5 articles', () => {
      expect(MOCK_NEWS.length).toBeGreaterThanOrEqual(5);
    });

    it('should include articles from multiple sources', () => {
      const sources = new Set(MOCK_NEWS.map((a) => a.source));
      expect(sources.size).toBeGreaterThanOrEqual(2);
    });

    it('should include articles with multiple categories', () => {
      const categories = new Set(MOCK_NEWS.map((a) => a.category));
      expect(categories.size).toBeGreaterThanOrEqual(3);
    });

    it('should have valid article structure', () => {
      for (const article of MOCK_NEWS) {
        expect(article.id).toBeDefined();
        expect(article.title.length).toBeGreaterThan(0);
        expect(article.summary.length).toBeGreaterThan(0);
        expect(article.url).toMatch(/^https?:\/\//);
        expect(article.publishedAt).toBeDefined();
      }
    });
  });
});
