import { NextResponse } from 'next/server';
import { scrapeAllSources } from '@/lib/scraper';
import { extractLeadFromNews } from '@/lib/aiExtractor';
import { saveIncidentAndLead } from '@/lib/db';

export async function GET() {
  try {
    console.log(`[Manual Scrape] Starting job...`);
    const { results: rawIncidents, debug } = await scrapeAllSources();
    console.log(`[Manual Scrape] Found ${rawIncidents.length} raw news items.`);

    // FOR TESTING: If still 0, add a mock to verify the pipeline
    if (rawIncidents.length === 0) {
        rawIncidents.push({
            title: "Test: Minor short circuit in Delhi factory",
            description: "A minor short circuit was reported in an Okhla textile factory today.",
            sourceUrl: "http://example.com/test",
            publishedAt: new Date(),
            newsSource: "Debug System",
            dedupHash: "debug-hash-" + Date.now()
        });
    }

    let processedCount = 0;
    let savedCount = 0;

    for (const raw of rawIncidents) {
      processedCount++;
      const result = await extractLeadFromNews(raw.title, raw.description);
      if (!result) continue;

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
      debug,
      message: `Scrape complete. Saved ${savedCount} new incidents.` 
    });
  } catch (error: any) {
    console.error(`[Manual Scrape Error]:`, error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
