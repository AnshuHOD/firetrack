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
      const extracted = await extractLeadFromNews(raw.title, raw.description);
      
      const payload = {
        ...raw,
        ...(extracted ? extracted : {
            state: null, city: null, locality: null,
            businessName: null, businessType: null,
            impactLevel: null, impactReason: null
        }),
        contactPhone: null, // to be populated by SerpAPI later
        contactEmail: null,
      };

      const result = await saveIncidentAndLead(payload as any);
      if (result.status === 'success') {
        savedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      scraped: rawIncidents.length, 
      processed: processedCount,
      saved: savedCount,
      message: `Scrape complete. Saved ${savedCount} new incidents from ${rawIncidents.length} raw matches.` 
    });
  } catch (error: any) {
    console.error(`[Manual Scrape Error]:`, error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
