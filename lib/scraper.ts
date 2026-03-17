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
  { name: "Times of India", rss: "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms" },
  { name: "Hindustan Times", rss: "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml" },
  { name: "NDTV", rss: "https://feeds.feedburner.com/ndtvnews-india-news" },
  // EXTREME PRECISION: Looking only for heavy property damage/loss
  { name: "Google News", url: "https://news.google.com/rss/search?q=(fire+loss+OR+factory+fire+OR+industrial+fire+OR+warehouse+blaze+OR+short-circuit+damage)+India+-cricket+-politics+-bollywood&hl=en-IN&gl=IN&ceid=IN:en" },
];

const INCIDENT_KEYWORDS = [
    "fire", "blaze", "burnt", "gutted", "short circuit", "short-circuit", "factory", "warehouse", 
    "godown", "industrial", "commercial", "property loss", "damage", "boiler blast",
    "textile", "manufacturing", "chemical", "spinning mill", "plastic factory"
];

const EXCLUDE_KEYWORDS = [
    "cricket", "match", "vs", "score", "ipl", "bollywood", "politics", "film", "movie", 
    "teaser", "trailer", "sunrisers", "hyderabad", "dhruva", "revenge", "null", "undefined"
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

      // Filter Noise
      const hasExclude = EXCLUDE_KEYWORDS.some(ex => text.includes(ex.toLowerCase()));
      if (hasExclude) continue;

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
