import { NextResponse } from 'next/server';
import { scrapeAllSources } from '@/lib/scraper';
import { extractLeadFromNews } from '@/lib/aiExtractor';
import { saveIncidentAndLead } from '@/lib/db';
 
export const dynamic = 'force-dynamic';
 
export async function GET() {
  try {
    console.log(`[Manual Scrape] Starting job...`);
    const { results: rawIncidents, debug } = await scrapeAllSources();
    let processedCount = 0;
    let extractedCount = 0;
    let savedCount = 0;
    let lastError = "";

    // MOCK NEWS for testing when real news is 0
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

    for (const raw of rawIncidents) {
      processedCount++;
      const result = await extractLeadFromNews(raw.title, raw.description);
      if (!result) {
          lastError = "AI Extraction failed for news: " + raw.title;
          continue;
      }
      extractedCount++;

      const saveResult = await saveIncidentAndLead(raw, result);
      
      if (saveResult.status === 'success') {
        savedCount++;
      } else {
        lastError = `DB Save failed (${saveResult.status}): ` + (saveResult.error || "Unknown error");
      }
    }

    return NextResponse.json({ 
      success: true, 
      scraped: rawIncidents.length, 
      processed: processedCount,
      extracted: extractedCount,
      saved: savedCount,
      debug,
      lastError,
      message: `Scrape complete. Scraped: ${rawIncidents.length}, Extracted: ${extractedCount}, Saved: ${savedCount}.` 
    });
  } catch (error: any) {
    console.error(`[Manual Scrape Error]:`, error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
