import { NextRequest, NextResponse } from 'next/server';
import { fetchAllDisasters, createManualDisaster } from '@/lib/db';
import { geocodeLocation } from '@/lib/geocoder';
import { searchAndSaveBusinesses } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const disasters = await fetchAllDisasters();
    return NextResponse.json({ success: true, data: disasters });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      title, description, disaster_type, severity,
      location_name, radius_km, city, state, latitude, longitude,
    } = body;

    if (!title || !disaster_type || !severity) {
      return NextResponse.json({ success: false, error: 'title, disaster_type and severity are required' }, { status: 400 });
    }

    let lat = latitude ? parseFloat(latitude) : null;
    let lng = longitude ? parseFloat(longitude) : null;
    let resolvedCity = city;
    let resolvedState = state;

    // Auto-geocode if coordinates not provided but location name is
    if ((!lat || !lng) && location_name) {
      const geo = await geocodeLocation(location_name);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
        if (!resolvedCity) resolvedCity = geo.city;
        if (!resolvedState) resolvedState = geo.state;
      }
    }

    const disaster = await createManualDisaster({
      title,
      description: description || '',
      disaster_type,
      severity,
      location_name: location_name || [city, state].filter(Boolean).join(', '),
      radius_km: parseFloat(radius_km) || 2.0,
      latitude: lat || undefined,
      longitude: lng || undefined,
      city: resolvedCity,
      state: resolvedState,
    });

    // Automatically search for businesses if we have coordinates
    if (lat && lng) {
      searchAndSaveBusinesses(
        disaster.id, lat, lng,
        parseFloat(radius_km) || 2.0,
        disaster_type, severity
      ).catch(console.error); // fire and forget
    }

    return NextResponse.json({ success: true, data: disaster });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
