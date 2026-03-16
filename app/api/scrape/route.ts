import { NextResponse } from 'next/server';
import { scrapeAllSources } from '@/lib/scraper';
import { extractLeadFromNews } from '@/lib/aiExtractor';
import { saveIncidentAndLead } from '@/lib/db';

export async function GET() {
  try {
    console.log(`[Manual Scrape] Starting job...`);
    const rawIncidents = await scrapeAllSources();
    console.log(`[Manual Scrape] Found ${rawIncidents.length} recent fire news items.`);

    let processedCount = 0;
    let savedCount = 0;

    for (const raw of rawIncidents) {
      processedCount++;
      const result = await extractLeadFromNews(raw.title, raw.description);
      if (!result) continue;

      // Extract each lead and find contacts
      const saveResult = await saveIncidentAndLead(raw, result);
      
      if (saveResult.status === 'success') {
        savedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      scraped: rawIncidents.length, 
      processed: processedCount,
      saved: savedCount,
      message: `Scrape complete. Saved ${savedCount} new incidents with multiple potential leads.` 
    });
  } catch (error: any) {
    console.error(`[Manual Scrape Error]:`, error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
