import { NextRequest, NextResponse } from 'next/server';
import { geocodeLocation } from '@/lib/geocoder';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('q');
    if (!location) return NextResponse.json({ success: false, error: 'q param required' }, { status: 400 });

    const result = await geocodeLocation(location);
    if (!result) return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
