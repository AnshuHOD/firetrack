import { NextResponse } from 'next/server';
import { scrapeAllSources } from '@/lib/scraper';
import { extractLeadFromNews } from '@/lib/aiExtractor';
import { saveDisasterFromScrape } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { results, debug } = await scrapeAllSources();

    if (!results.length) {
      return NextResponse.json({
        success: true, processed: 0, leadsSaved: 0, debug,
        message: 'No new incidents found.',
      });
    }

    const toProcess = results.slice(0, 5);
    let totalLeads = 0;
    let lastError: string | null = null;

    const processResults = await Promise.allSettled(
      toProcess.map(async incident => {
        const extraction = await extractLeadFromNews(incident.title, incident.description);
        if (!extraction) return { leadsSaved: 0 };
        const result = await saveDisasterFromScrape(incident, extraction);
        if (result.status === 'error') { lastError = result.error || 'Unknown'; return { leadsSaved: 0 }; }
        return { leadsSaved: result.leadsSaved || 0 };
      })
    );

    processResults.forEach(r => { if (r.status === 'fulfilled') totalLeads += r.value.leadsSaved; });

    return NextResponse.json({
      success: true,
      scraped: results.length,
      processed: toProcess.length,
      leadsSaved: totalLeads,
      debug,
      lastError,
      message: `Processed ${toProcess.length} incidents, saved ${totalLeads} leads.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
