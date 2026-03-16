import Parser from 'rss-parser';
import crypto from 'crypto';

export interface RawIncident {
  title: string;
  description: string;
  sourceUrl: string;
  publishedAt: Date;
  newsSource: string;
  dedupHash: string;
}

const NEWS_SOURCES = [
  // RSS Feeds (preferred - faster, reliable)
  { name: "Times of India", rss: "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms" },
  { name: "Hindustan Times", rss: "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml" },
  { name: "NDTV", rss: "https://feeds.feedburner.com/ndtvnews-india-news" },
  { name: "The Hindu", rss: "https://www.thehindu.com/news/national/feeder/default.rss" },
  { name: "India Today", rss: "https://www.indiatoday.in/rss/home" },
  { name: "News18", rss: "https://www.news18.com/rss/india.xml" },
  { name: "Amar Ujala", rss: "https://www.amarujala.com/rss/breaking-news.xml" },
  { name: "Dainik Bhaskar", rss: "https://www.bhaskar.com/rss-feed/1061/" },
  { name: "Zee News", rss: "https://zeenews.india.com/rss/india-national-news.xml" },
  // Google News Search (dynamic)
  { name: "Google News", url: "https://news.google.com/rss/search?q=(fire+OR+flood+OR+accident+OR+theft+OR+expansion+OR+opening)+India&hl=en-IN&gl=IN&ceid=IN:en" },
];

const INCIDENT_KEYWORDS = [
  // Simple Keywords (High match rate)
  "fire", "blaze", "inferno", "aag", "flood", "cyclone", "theft", "robbery", "accident",
  "collapse", "opening", "inaugurated", "expansion", "factory", "plant", "warehouse",
  "godown", "shop", "market", "showroom", "business", "commercial",
  // Phrases
  "short circuit", "property damage", "heavy rain", "new project", "breaking news"
];

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
  },
  timeout: 10000,
});

export interface ScrapeDebugInfo {
  sourceName: string;
  itemCount: number;
  error?: string;
  matchedCount: number;
}

export async function scrapeAllSources(): Promise<{ results: RawIncident[], debug: ScrapeDebugInfo[] }> {
  const results: RawIncident[] = [];
  const debug: ScrapeDebugInfo[] = [];
  const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

  const fetchPromises = NEWS_SOURCES.map(source => 
    parser.parseURL(source.rss || source.url || '')
      .then(feed => ({ source, feed, error: null }))
      .catch(err => ({ source, feed: null, error: err.message }))
  );

  const responses = await Promise.all(fetchPromises);

  for (const resp of responses) {
    const { source, feed, error } = resp;
    const debugInfo: ScrapeDebugInfo = { 
        sourceName: source.name, 
        itemCount: feed?.items?.length || 0, 
        error: error || undefined,
        matchedCount: 0 
    };

    if (!feed || !feed.items) {
      debug.push(debugInfo);
      continue;
    }

    for (const item of feed.items) {
      const pubDateText = item.pubDate || item.isoDate || item.date || '';
      const pubDate = new Date(pubDateText);
      
      if (isNaN(pubDate.getTime())) continue;
      if (pubDate < threeDaysAgo) continue;

      const title = item.title || '';
      const description = item.contentSnippet || item.content || item.summary || '';
      const text = `${title} ${description}`.toLowerCase();

      const isRecordable = INCIDENT_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
      if (!isRecordable) continue;

      debugInfo.matchedCount++;

      const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().slice(0, 80);
      const dedupHash = crypto.createHash('sha256').update(normalizedTitle).digest('hex');

      results.push({
        title,
        description,
        sourceUrl: item.link || '',
        publishedAt: pubDate,
        newsSource: source.name,
        dedupHash,
      });
    }
    debug.push(debugInfo);
  }

  return { results, debug };
}
