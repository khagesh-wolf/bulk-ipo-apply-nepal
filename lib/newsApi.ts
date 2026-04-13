/**
 * News Aggregation API — Bulk IPO Apply Nepal
 *
 * Fetches and categorizes financial news from multiple Nepali sources:
 * - ShareSansar (major Nepali financial news portal)
 * - Merolagani
 * - SEBON official announcements
 *
 * Falls back to mock data when network/CORS errors occur.
 */

import axios from 'axios';
import { Platform } from 'react-native';
import type { NewsArticle, NewsCategory, NewsSource } from '@/types';

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

const RSS_URLS: Record<NewsSource, string> = {
  ShareSansar: 'https://www.sharesansar.com/category/latest/rss',
  Merolagani: 'https://merolagani.com/NewsList.aspx/GetNewsRSS',
  SEBON: 'https://sebon.gov.np/feeds/news.rss',
};

const API_TIMEOUT = 10_000;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const NOW = new Date().toISOString();

export const MOCK_NEWS: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'NEPSE Reaches All-Time High as Banking Stocks Surge',
    summary:
      'The Nepal Stock Exchange index crossed the 2,850 mark for the first time, driven by strong performance in the banking sector.',
    url: 'https://www.sharesansar.com/newsdetail/nepse-reaches-all-time-high',
    source: 'ShareSansar',
    category: 'Market Updates',
    publishedAt: NOW,
  },
  {
    id: 'news-2',
    title: 'Global IME Bank IPO Opens Today for General Public',
    summary:
      'Global IME Bank Limited has opened its IPO worth Rs. 1.5 billion for the general public. The issue closes on 2081-04-15.',
    url: 'https://merolagani.com/NewsDetail.aspx?newsID=12345',
    source: 'Merolagani',
    category: 'IPO Announcements',
    publishedAt: NOW,
  },
  {
    id: 'news-3',
    title: 'SEBON Approves New Guidelines for Online Trading',
    summary:
      'Securities Board of Nepal has approved new regulations for online stock trading, effective from next fiscal year.',
    url: 'https://sebon.gov.np/news/new-guidelines-online-trading',
    source: 'SEBON',
    category: 'Regulatory News',
    publishedAt: NOW,
  },
  {
    id: 'news-4',
    title: 'Nabil Bank Declares 30% Cash Dividend for FY 2080/81',
    summary:
      'Nabil Bank Limited has declared 30% cash dividend to its shareholders for the fiscal year 2080/81. Book close date is set for 2081-03-20.',
    url: 'https://www.sharesansar.com/newsdetail/nabil-bank-30-dividend',
    source: 'ShareSansar',
    category: 'Dividend',
    publishedAt: NOW,
  },
  {
    id: 'news-5',
    title: 'Upper Tamakoshi Hydro Increases Generation Capacity by 20%',
    summary:
      'Upper Tamakoshi Hydropower has completed its capacity expansion project, increasing generation from 456MW to 547MW.',
    url: 'https://merolagani.com/NewsDetail.aspx?newsID=12346',
    source: 'Merolagani',
    category: 'Company News',
    publishedAt: NOW,
  },
  {
    id: 'news-6',
    title: 'SEBON Suspends Trading of XYZ Finance for Regulatory Non-Compliance',
    summary:
      'SEBON has directed NEPSE to suspend trading of XYZ Finance Company shares pending investigation into regulatory violations.',
    url: 'https://sebon.gov.np/news/xyz-suspension',
    source: 'SEBON',
    category: 'Regulatory News',
    publishedAt: NOW,
  },
  {
    id: 'news-7',
    title: 'Hydropower Sector Leads Market Gains This Week',
    summary:
      'Hydropower stocks gained an average of 4.5% this week as monsoon season boosts energy production expectations.',
    url: 'https://www.sharesansar.com/newsdetail/hydropower-sector-weekly-gains',
    source: 'ShareSansar',
    category: 'Market Updates',
    publishedAt: NOW,
  },
  {
    id: 'news-8',
    title: 'Nepal Life Insurance Announces Right Share Issuance',
    summary:
      'Nepal Life Insurance Company is issuing 1:1 right shares to existing shareholders. Record date is 2081-05-01.',
    url: 'https://merolagani.com/NewsDetail.aspx?newsID=12347',
    source: 'Merolagani',
    category: 'Company News',
    publishedAt: NOW,
  },
];

// ---------------------------------------------------------------------------
// Category detection
// ---------------------------------------------------------------------------

const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  'IPO Announcements': ['ipo', 'initial public offering', 'fpo', 'right share issue', 'debenture issue'],
  'Dividend': ['dividend', 'bonus share', 'right share', 'book close'],
  'Regulatory News': ['sebon', 'regulation', 'guideline', 'policy', 'suspend', 'compliance'],
  'Company News': ['quarterly', 'annual report', 'agm', 'profit', 'loss', 'merger', 'capacity'],
  'Market Updates': ['nepse', 'index', 'market', 'trading', 'turnover', 'bull', 'bear'],
  'General': [],
};

export function categorizeNews(title: string, summary: string): NewsCategory {
  const text = `${title} ${summary}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'General') continue;
    if (keywords.some((kw) => text.includes(kw))) {
      return category as NewsCategory;
    }
  }

  return 'General';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch aggregated news from all sources.
 * Falls back to mock data on CORS / network error.
 */
export async function fetchNews(
  source?: NewsSource,
): Promise<NewsArticle[]> {
  if (Platform.OS === 'web') {
    return source
      ? MOCK_NEWS.filter((n) => n.source === source)
      : MOCK_NEWS;
  }

  try {
    const sources = source ? [source] : (['ShareSansar', 'Merolagani', 'SEBON'] as NewsSource[]);
    const requests = sources.map((src) =>
      axios
        .get(RSS_URLS[src], { timeout: API_TIMEOUT, responseType: 'text' })
        .then((res) => parseRSSToArticles(res.data as string, src))
        .catch(() => [] as NewsArticle[]),
    );

    const results = await Promise.all(requests);
    const allNews = results.flat();

    if (allNews.length === 0) {
      return source
        ? MOCK_NEWS.filter((n) => n.source === source)
        : MOCK_NEWS;
    }

    return allNews.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  } catch {
    return source
      ? MOCK_NEWS.filter((n) => n.source === source)
      : MOCK_NEWS;
  }
}

/**
 * Filter news by category.
 */
export function filterNewsByCategory(
  articles: NewsArticle[],
  category: NewsCategory,
): NewsArticle[] {
  return articles.filter((a) => a.category === category);
}

// ---------------------------------------------------------------------------
// RSS parser (lightweight)
// ---------------------------------------------------------------------------

function parseRSSToArticles(xml: string, source: NewsSource): NewsArticle[] {
  const articles: NewsArticle[] = [];

  // Simple regex-based XML parsing for RSS items
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = itemRegex.exec(xml)) !== null && idx < 20) {
    const itemXml = match[1];

    const title = extractTag(itemXml, 'title');
    const description = extractTag(itemXml, 'description');
    const link = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');

    if (title) {
      const summary = description
        ? description.replace(/<[^>]+>/g, '').slice(0, 300)
        : '';

      articles.push({
        id: `${source.toLowerCase()}-${idx}`,
        title,
        summary,
        url: link || RSS_URLS[source],
        source,
        category: categorizeNews(title, summary),
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      });

      idx++;
    }
  }

  return articles;
}

function extractTag(xml: string, tag: string): string {
  const cdataMatch = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`,
    'i',
  ).exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();

  const simpleMatch = new RegExp(
    `<${tag}[^>]*>([\\s\\S]*?)</${tag}>`,
    'i',
  ).exec(xml);
  return simpleMatch ? simpleMatch[1].trim() : '';
}
