import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Delete all leads first (foreign key constraint)
    const { error: leadsError } = await supabase.from('leads').delete().filter('id', 'neq', '00000000-0000-0000-0000-000000000000');
    if (leadsError) throw leadsError;

    // Delete all incidents
    const { error: incidentsError } = await supabase.from('incidents').delete().filter('id', 'neq', '00000000-0000-0000-0000-000000000000');
    if (incidentsError) throw incidentsError;

    return NextResponse.json({ success: true, message: "Database purged successfully. All noisy data cleared." });
  } catch (error: any) {
    console.error("Purge failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
