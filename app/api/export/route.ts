import { NextRequest, NextResponse } from 'next/server';
import { fetchBusinesses } from '@/lib/db';
import { exportToCSV, exportToExcel, exportToJSON } from '@/lib/exporter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format      = searchParams.get('format') || 'csv';   // csv | excel | json
    const disaster_id = searchParams.get('disaster_id') || undefined;
    const lead_status = searchParams.get('lead_status') || undefined;

    const businesses = await fetchBusinesses({ disaster_id, lead_status, limit: 5000 });

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (format === 'excel') {
      const buffer = exportToExcel(businesses);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="leads-${ts}.xlsx"`,
        },
      });
    }

    if (format === 'json') {
      const json = exportToJSON(businesses);
      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="leads-${ts}.json"`,
        },
      });
    }

    // Default: CSV
    const csv = exportToCSV(businesses);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-${ts}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
