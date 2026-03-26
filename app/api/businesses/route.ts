import { NextRequest, NextResponse } from 'next/server';
import { fetchBusinesses, deleteBusinesses } from '@/lib/db';

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

export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json({ success: false, error: 'ids array is required' }, { status: 400 });
    }
    await deleteBusinesses(ids);
    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
