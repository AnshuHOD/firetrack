import { NextResponse } from 'next/server';
import { fetchRecentLeadsWithIncidents, supabase } from '@/lib/db';
 
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await fetchRecentLeadsWithIncidents();
    // Direct count check to see if rows exist at all
    const { count } = await supabase.from('incidents').select('*', { count: 'exact', head: true });
    
    return NextResponse.json({ 
      success: true, 
      data, 
      dbCount: count,
      dbRef: process.env.SUPABASE_URL?.split('//')[1]?.split('.')[0]
    });
  } catch (err) {
    console.error("Failed to fetch leads", err);
    return NextResponse.json({ success: false, error: 'Failed to fetch leads' }, { status: 500 });
  }
}
