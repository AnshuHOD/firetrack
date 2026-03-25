import { NextRequest, NextResponse } from 'next/server';
import { fetchBusinesses } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = {
      disaster_id:   searchParams.get('disaster_id') || undefined,
      lead_status:   searchParams.get('lead_status') || undefined,
      disaster_type: searchParams.get('disaster_type') || undefined,
      min_score:     searchParams.get('min_score') ? parseInt(searchParams.get('min_score')!) : undefined,
      limit:         searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 200,
    };
    const businesses = await fetchBusinesses(filters);
    return NextResponse.json({ success: true, data: businesses });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
