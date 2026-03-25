// Overpass API (OpenStreetMap) — free, no API key required
// Finds real businesses within a configurable radius of a disaster

import { haversineDistance } from './geocoder';

export interface FoundBusiness {
  osm_id: string;
  name: string;
  category: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  lat: number;
  lng: number;
  distance_km: number;
  raw_tags: Record<string, string>;
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

function buildOverpassQuery(lat: number, lng: number, radiusMeters: number): string {
  return `
[out:json][timeout:30];
(
  node["name"]["shop"](around:${radiusMeters},${lat},${lng});
  node["name"]["amenity"~"restaurant|cafe|bank|hotel|hospital|clinic|pharmacy|school|college|university|fuel|marketplace"](around:${radiusMeters},${lat},${lng});
  node["name"]["office"](around:${radiusMeters},${lat},${lng});
  node["name"]["craft"](around:${radiusMeters},${lat},${lng});
  node["name"]["industrial"](around:${radiusMeters},${lat},${lng});
  node["name"]["tourism"~"hotel|motel|hostel|guest_house"](around:${radiusMeters},${lat},${lng});
  node["name"]["building"~"commercial|industrial|warehouse|retail|office"](around:${radiusMeters},${lat},${lng});
  way["name"]["shop"](around:${radiusMeters},${lat},${lng});
  way["name"]["amenity"~"restaurant|cafe|bank|hotel|hospital|clinic|fuel|marketplace"](around:${radiusMeters},${lat},${lng});
  way["name"]["office"](around:${radiusMeters},${lat},${lng});
  way["name"]["building"~"commercial|industrial|warehouse|retail"](around:${radiusMeters},${lat},${lng});
  way["name"]["landuse"~"industrial|commercial|retail"](around:${radiusMeters},${lat},${lng});
);
out body center;
  `.trim();
}

function deriveCategoryFromTags(tags: Record<string, string>): string {
  const shop = tags['shop'];
  const amenity = tags['amenity'];
  const office = tags['office'];
  const craft = tags['craft'];
  const industrial = tags['industrial'];
  const tourism = tags['tourism'];
  const building = tags['building'];
  const landuse = tags['landuse'];

  if (industrial || landuse === 'industrial') return 'Industrial / Factory';
  if (building === 'warehouse') return 'Warehouse';
  if (craft) return `Craft / ${capitalize(craft)}`;
  if (shop) return `Retail / ${capitalize(shop)}`;
  if (amenity === 'restaurant' || amenity === 'cafe') return 'Restaurant / Cafe';
  if (amenity === 'hotel' || tourism === 'hotel') return 'Hotel';
  if (amenity === 'hospital' || amenity === 'clinic') return 'Hospital / Clinic';
  if (amenity === 'bank') return 'Bank';
  if (amenity === 'school' || amenity === 'college' || amenity === 'university') return 'Educational';
  if (amenity === 'fuel') return 'Fuel Station';
  if (amenity === 'marketplace') return 'Market';
  if (office) return `Office / ${capitalize(office)}`;
  if (building === 'commercial' || landuse === 'commercial') return 'Commercial Building';
  if (building === 'retail' || landuse === 'retail') return 'Retail Store';
  return 'Business';
}

function buildAddress(tags: Record<string, string>): string {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'],
    tags['addr:state'],
    tags['addr:postcode'],
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : (tags['addr:full'] || '');
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

export async function findBusinessesNearby(
  lat: number,
  lng: number,
  radiusKm: number,
  limit = 50
): Promise<FoundBusiness[]> {
  const radiusMeters = Math.min(radiusKm * 1000, 5000); // cap at 5km
  const query = buildOverpassQuery(lat, lng, radiusMeters);

  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(35000),
    });

    if (!res.ok) {
      console.error('Overpass API error:', res.status);
      return [];
    }

    const json = await res.json();
    const elements: any[] = json.elements || [];

    const seen = new Set<string>();
    const businesses: FoundBusiness[] = [];

    for (const el of elements) {
      const tags: Record<string, string> = el.tags || {};
      const name: string = tags['name'] || '';
      if (!name || name.length < 3) continue;

      // De-duplicate by normalized name
      const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) continue;
      seen.add(key);

      // Get coordinates (nodes have lat/lon directly, ways have center)
      const elLat: number = el.lat ?? el.center?.lat;
      const elLng: number = el.lon ?? el.center?.lon;
      if (!elLat || !elLng) continue;

      const distance_km = haversineDistance(lat, lng, elLat, elLng);

      businesses.push({
        osm_id: `${el.type}/${el.id}`,
        name,
        category: deriveCategoryFromTags(tags),
        address: buildAddress(tags),
        phone: tags['phone'] || tags['contact:phone'] || undefined,
        email: tags['email'] || tags['contact:email'] || undefined,
        website: tags['website'] || tags['contact:website'] || undefined,
        lat: elLat,
        lng: elLng,
        distance_km: Math.round(distance_km * 100) / 100,
        raw_tags: tags,
      });

      if (businesses.length >= limit) break;
    }

    // Sort by distance ascending
    businesses.sort((a, b) => a.distance_km - b.distance_km);
    return businesses;
  } catch (err) {
    console.error('findBusinessesNearby error:', err);
    return [];
  }
}
