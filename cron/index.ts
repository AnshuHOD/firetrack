import cron from 'node-cron';
import { scrapeAllSources } from '../lib/scraper';
import { extractLeadFromNews } from '../lib/aiExtractor';
import { saveDisasterFromScrape } from '../lib/db';
import { sendIncidentReport } from '../lib/emailReport';

console.log('DisasterLeadTracker Cron Server Started!');

// Scrape every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log(`[${new Date().toISOString()}] Starting scrape job...`);
  try {
    const { results } = await scrapeAllSources();
    console.log(`Found ${results.length} raw items.`);
    for (const raw of results) {
      const extraction = await extractLeadFromNews(raw.title, raw.description);
      if (!extraction) continue;
      await saveDisasterFromScrape(raw, extraction);
    }
    console.log('Scrape job complete.');
  } catch (err) {
    console.error('Cron scrape error:', err);
  }
});

// Send email report every 3 hours
cron.schedule('0 */3 * * *', async () => {
  console.log(`[${new Date().toISOString()}] Sending report...`);
  try {
    const result = await sendIncidentReport(3);
    console.log(`Report status: ${result.success ? 'sent' : 'failed'}`);
  } catch (err) {
    console.error('Cron report error:', err);
  }
});

process.on('SIGINT', () => { console.log('Shutting down.'); process.exit(); });
