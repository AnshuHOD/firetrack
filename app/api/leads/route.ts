import { NextResponse } from 'next/server';
import { fetchRecentLeadsWithIncidents } from '@/lib/db';
 
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await fetchRecentLeadsWithIncidents();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Failed to fetch leads", err);
    return NextResponse.json({ success: false, error: 'Failed to fetch leads' }, { status: 500 });
  }
}
