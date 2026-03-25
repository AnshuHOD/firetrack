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
  { name: 'Times of India',         url: 'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms' },
  { name: 'Hindustan Times',        url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml' },
  { name: 'NDTV',                   url: 'https://feeds.feedburner.com/ndtvnews-india-news' },
  { name: 'Google News (Fire)',      url: 'https://news.google.com/rss/search?q=(factory+fire+OR+warehouse+blaze+OR+industrial+fire+OR+godown+fire)+India&hl=en-IN&gl=IN&ceid=IN:en' },
  { name: 'Google News (Disaster)',  url: 'https://news.google.com/rss/search?q=(earthquake+OR+flood+OR+explosion+OR+blast+OR+chemical+leak+OR+building+collapse)+India&hl=en-IN&gl=IN&ceid=IN:en' },
  { name: 'Google News (Storm)',     url: 'https://news.google.com/rss/search?q=(cyclone+OR+landslide+OR+tsunami+OR+storm+damage)+India&hl=en-IN&gl=IN&ceid=IN:en' },
];

// Keywords that indicate a disaster incident with commercial relevance
const INCIDENT_KEYWORDS = [
  // Fire
  'fire', 'blaze', 'burnt', 'gutted', 'arson', 'short circuit', 'short-circuit',
  'boiler blast', 'factory fire', 'warehouse fire', 'godown fire',
  // Structural
  'explosion', 'blast', 'collapse', 'building collapse', 'structure collapse',
  // Natural
  'earthquake', 'tremor', 'seismic', 'flood', 'flooding', 'inundated', 'cyclone',
  'tsunami', 'landslide', 'storm damage', 'flash flood',
  // Chemical
  'chemical leak', 'gas leak', 'toxic', 'hazmat',
  // Commercial indicators
  'factory', 'warehouse', 'godown', 'industrial', 'commercial', 'property loss',
  'damage', 'textile', 'manufacturing', 'chemical plant', 'spinning mill',
  'plastic factory', 'storage', 'market fire', 'shop fire',
];

const EXCLUDE_KEYWORDS = [
  'cricket', 'match', 'vs', 'ipl', 'score', 'wicket', 'bollywood', 'film', 'movie',
  'teaser', 'trailer', 'actor', 'actress', 'singer', 'album', 'politics', 'election',
  'parliament', 'party', 'minister', 'null', 'undefined',
];

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; DisasterLeadTracker/2.0)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
  timeout: 12000,
});

export interface ScrapeDebugInfo {
  sourceName: string;
  itemCount: number;
  error?: string;
  matchedCount: number;
}

export async function scrapeAllSources(): Promise<{ results: RawIncident[]; debug: ScrapeDebugInfo[] }> {
  const results: RawIncident[] = [];
  const debug: ScrapeDebugInfo[] = [];
  const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

  const responses = await Promise.all(
    NEWS_SOURCES.map(source =>
      parser.parseURL(source.url)
        .then(feed => ({ source, feed, error: null }))
        .catch(err => ({ source, feed: null, error: err.message as string }))
    )
  );

  for (const { source, feed, error } of responses) {
    const debugInfo: ScrapeDebugInfo = {
      sourceName: source.name,
      itemCount: feed?.items?.length || 0,
      error: error || undefined,
      matchedCount: 0,
    };

    if (!feed?.items) { debug.push(debugInfo); continue; }

    for (const item of feed.items) {
      const pubDate = new Date(item.pubDate || item.isoDate || item.date || '');
      if (isNaN(pubDate.getTime()) || pubDate < threeDaysAgo) continue;

      const title = item.title || '';
      const description = item.contentSnippet || item.content || item.summary || '';
      const text = `${title} ${description}`.toLowerCase();

      if (EXCLUDE_KEYWORDS.some(ex => text.includes(ex))) continue;
      if (!INCIDENT_KEYWORDS.some(kw => text.includes(kw))) continue;

      debugInfo.matchedCount++;

      const normalized = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().slice(0, 80);
      const dedupHash = crypto.createHash('sha256').update(normalized).digest('hex');

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
