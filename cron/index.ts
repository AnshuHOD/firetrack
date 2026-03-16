import cron from 'node-cron';
import { scrapeAllSources } from '../lib/scraper';
import { extractLeadFromNews } from '../lib/aiExtractor';
import { saveIncidentAndLead } from '../lib/db';
import { sendIncidentReport } from '../lib/emailReport';
import { findBusinessContact } from '../lib/contactFinder';

console.log('🚀 FireLeadTracker Cron Server Started!');

cron.schedule('*/30 * * * *', async () => {
  console.log(`[${new Date().toISOString()}] Starting 30-min scrape job...`);
  
  try {
    const rawIncidents = await scrapeAllSources();
    console.log(`Found ${rawIncidents.length} fire news items`);

    for (const raw of rawIncidents) {
      const result = await extractLeadFromNews(raw.title, raw.description);
      if (!result) continue;

      await saveIncidentAndLead(raw, result);
    }

    console.log(`Scrape job complete.`);
  } catch (error) {
    console.error(`Cron Scrape Error:`, error);
  }
});

cron.schedule('0 */3 * * *', async () => {
  console.log(`[${new Date().toISOString()}] Sending 3-hour report...`);
  try {
    const result = await sendIncidentReport(3);
    console.log(`Report sent. Status: ${result.success ? 'Success' : 'Failed'}`);
  } catch (error) {
    console.error(`Cron Report Error:`, error);
  }
});

process.on('SIGINT', () => {
  console.log('Cron server shutting down.');
  process.exit();
});
