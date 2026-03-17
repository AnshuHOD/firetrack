import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Delete all incidents. Because of ON DELETE CASCADE, leads will be deleted automatically.
    // Using .not('id', 'is', null) covers all rows since ID is the primary key.
    const { error: incidentsError } = await supabase
      .from('incidents')
      .delete()
      .not('id', 'is', null);
    
    if (incidentsError) throw incidentsError;

    return NextResponse.json({ success: true, message: "Database purged successfully. All noisy data cleared." });
  } catch (error: any) {
    console.error("Purge failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
