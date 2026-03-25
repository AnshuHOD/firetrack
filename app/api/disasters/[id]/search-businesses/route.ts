import { NextRequest, NextResponse } from 'next/server';
import { fetchDisasterById, searchAndSaveBusinesses } from '@/lib/db';
import { DisasterType, Severity } from '@/lib/leadScorer';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const disaster = await fetchDisasterById(params.id);
    if (!disaster) return NextResponse.json({ success: false, error: 'Disaster not found' }, { status: 404 });

    if (!disaster.latitude || !disaster.longitude) {
      return NextResponse.json({ success: false, error: 'Disaster has no coordinates. Set location first.' }, { status: 400 });
    }

    const saved = await searchAndSaveBusinesses(
      disaster.id,
      disaster.latitude,
      disaster.longitude,
      disaster.radius_km || 2.0,
      disaster.disaster_type as DisasterType,
      disaster.severity as Severity
    );

    return NextResponse.json({ success: true, businessesSaved: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
