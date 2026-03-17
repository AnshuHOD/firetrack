import { NextResponse } from 'next/server';
import { scrapeAllSources } from '@/lib/scraper';
import { extractLeadFromNews } from '@/lib/aiExtractor';
import { saveIncidentAndLead } from '@/lib/db';
 
export const dynamic = 'force-dynamic';
 
export async function GET() {
  try {
    console.log(`[Manual Scrape] Starting job...`);
    const { results: rawIncidents, debug } = await scrapeAllSources();
    
    // LIMIT TO TOP 5 for reliability during manual/cron trigger
    const targets = rawIncidents.slice(0, 5);
    
    console.log(`[Manual Scrape] Processing top ${targets.length} incidents in parallel...`);

    const results = await Promise.all(targets.map(async (raw) => {
      try {
        const extraction = await extractLeadFromNews(raw.title, raw.description);
        if (!extraction) return { status: 'failed', title: raw.title };
        
        const saveResult = await saveIncidentAndLead(raw, extraction);
        return { status: saveResult.status, title: raw.title };
      } catch (e: any) {
        return { status: 'error', error: e.message, title: raw.title };
      }
    }));

    const savedCount = results.filter(r => r.status === 'success').length;
    const extractedCount = results.filter(r => r.status !== 'failed').length;

    return NextResponse.json({ 
      success: true, 
      scraped: rawIncidents.length, 
      processed: targets.length,
      extracted: extractedCount,
      saved: savedCount,
      debug,
      message: `Scrape complete. Processed: ${targets.length}, Saved: ${savedCount}.` 
    });
  } catch (error: any) {
    console.error(`[Manual Scrape Error]:`, error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
