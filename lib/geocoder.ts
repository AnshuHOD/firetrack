// Nominatim (OpenStreetMap) geocoding — free, no API key required

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  city?: string;
  state?: string;
  country?: string;
}

export async function geocodeLocation(location: string): Promise<GeocodingResult | null> {
  const query = encodeURIComponent(`${location}, India`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=in&addressdetails=1`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'DisasterLeadTracker/1.0 (contact@disasterleadtracker.in)',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;

    const r = data[0];
    const addr = r.address || {};

    return {
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      displayName: r.display_name,
      city: addr.city || addr.town || addr.village || addr.county || undefined,
      state: addr.state || undefined,
      country: addr.country || 'India',
    };
  } catch (err) {
    console.error('Geocoding failed:', err);
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DisasterLeadTracker/1.0' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const r = await res.json();
    const addr = r.address || {};

    return {
      lat,
      lng,
      displayName: r.display_name,
      city: addr.city || addr.town || addr.village || undefined,
      state: addr.state || undefined,
      country: addr.country || 'India',
    };
  } catch {
    return null;
  }
}

// Haversine distance formula (returns km)
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
