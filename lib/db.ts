import { createClient } from '@supabase/supabase-js';
import { RawIncident } from './scraper';
import { ExtractionResult } from './aiExtractor';
import { findBusinessesNearby } from './businessFinder';
import { calculateLeadScore, DisasterType, Severity } from './leadScorer';
import { geocodeLocation } from './geocoder';
import { findBusinessContact } from './contactFinder';

const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'mock-key';
export const supabase = createClient(supabaseUrl, supabaseKey);

const isMock = supabaseUrl.includes('mock');

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const MOCK_DISASTERS = [
  {
    id: 'mock-d1',
    title: 'Massive Fire at Dharavi Industrial Zone',
    description: 'A large-scale fire broke out at a textile factory in Dharavi, destroying machinery and raw materials.',
    disaster_type: 'fire', severity: 'High', status: 'active',
    news_source: 'Times of India', source_url: '#',
    published_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    city: 'Mumbai', state: 'Maharashtra', locality: 'Dharavi',
    latitude: 19.0400, longitude: 72.8550, radius_km: 2,
    is_manual: false, businesses_searched: true, leads_count: 3,
  },
  {
    id: 'mock-d2',
    title: 'Earthquake 4.5 Magnitude Near Bhuj',
    description: 'A 4.5 magnitude earthquake struck near Bhuj city causing structural damage to several buildings.',
    disaster_type: 'earthquake', severity: 'Medium', status: 'monitoring',
    news_source: 'NDTV', source_url: '#',
    published_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    city: 'Bhuj', state: 'Gujarat', locality: 'Bhuj City',
    latitude: 23.2500, longitude: 69.6669, radius_km: 3,
    is_manual: false, businesses_searched: true, leads_count: 5,
  },
  {
    id: 'mock-d3',
    title: 'Flash Floods in Chennai Low-Lying Areas',
    description: 'Heavy rains caused flash flooding in several low-lying areas of Chennai, affecting warehouses and shops.',
    disaster_type: 'flood', severity: 'High', status: 'active',
    news_source: 'Hindustan Times', source_url: '#',
    published_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    city: 'Chennai', state: 'Tamil Nadu', locality: 'Tambaram',
    latitude: 12.9249, longitude: 80.1000, radius_km: 2,
    is_manual: false, businesses_searched: true, leads_count: 4,
  },
];

const MOCK_BUSINESSES = [
  { id: 'mock-b1', disaster_id: 'mock-d1', business_name: 'Rathi Textile Mills', category: 'Industrial / Factory', address: 'Plot 12, Dharavi Industrial Estate, Mumbai', phone: '+91 98200 11234', email: 'info@rathitextiles.com', website: '', distance_km: 0.3, lead_score: 88, lead_status: 'New', lead_source: 'OpenStreetMap', notes: '', latitude: 19.0412, longitude: 72.8562, created_at: new Date().toISOString(), disasters: MOCK_DISASTERS[0] },
  { id: 'mock-b2', disaster_id: 'mock-d1', business_name: 'Sai Chemical Traders', category: 'Chemical', address: 'Shop 4, Dharavi Road, Mumbai', phone: '+91 98200 22345', email: '', website: '', distance_km: 0.7, lead_score: 75, lead_status: 'Contacted', lead_source: 'OpenStreetMap', notes: 'Called once, call back tomorrow.', latitude: 19.0420, longitude: 72.8540, created_at: new Date().toISOString(), disasters: MOCK_DISASTERS[0] },
  { id: 'mock-b3', disaster_id: 'mock-d1', business_name: 'Krishna Plastics Mfg', category: 'Industrial / Factory', address: 'Unit 7, Dharavi Industrial Area', phone: '+91 97690 33456', email: '', website: 'krishnaplastics.in', distance_km: 1.1, lead_score: 70, lead_status: 'New', lead_source: 'OpenStreetMap', notes: '', latitude: 19.0390, longitude: 72.8530, created_at: new Date().toISOString(), disasters: MOCK_DISASTERS[0] },
  { id: 'mock-b4', disaster_id: 'mock-d2', business_name: 'Kutch Salt Works Ltd', category: 'Industrial / Factory', address: 'GIDC Industrial Area, Bhuj', phone: '+91 97270 44567', email: 'info@kutchsalt.com', website: '', distance_km: 0.8, lead_score: 72, lead_status: 'Interested', lead_source: 'OpenStreetMap', notes: 'Interested in structural assessment.', latitude: 23.2510, longitude: 69.6680, created_at: new Date().toISOString(), disasters: MOCK_DISASTERS[1] },
  { id: 'mock-b5', disaster_id: 'mock-d2', business_name: 'Gujarat Handicrafts Emporium', category: 'Retail', address: 'Station Road, Bhuj', phone: '+91 97270 55678', email: '', website: '', distance_km: 1.2, lead_score: 50, lead_status: 'New', lead_source: 'OpenStreetMap', notes: '', latitude: 23.2520, longitude: 69.6660, created_at: new Date().toISOString(), disasters: MOCK_DISASTERS[1] },
  { id: 'mock-b6', disaster_id: 'mock-d3', business_name: 'Chennai Logistics Hub', category: 'Warehouse', address: 'GST Road, Tambaram, Chennai', phone: '+91 94440 66789', email: 'ops@chennaihub.com', website: 'chennaihub.com', distance_km: 0.4, lead_score: 82, lead_status: 'New', lead_source: 'OpenStreetMap', notes: '', latitude: 12.9259, longitude: 80.1010, created_at: new Date().toISOString(), disasters: MOCK_DISASTERS[2] },
];

// ─── DISASTER OPERATIONS ──────────────────────────────────────────────────────

export async function saveDisasterFromScrape(data: RawIncident, extraction: ExtractionResult) {
  if (isMock) {
    console.log('[Mock] saveDisasterFromScrape called');
    return { status: 'success', disasterId: `mock-${Date.now()}`, leadsSaved: 0 };
  }

  const firstLead = extraction.leads[0];
  const clean = (v: any) => (v === 'null' || v === 'N/A' || v === '') ? null : v;

  // Use top-level location from AI, fall back to first lead's location
  const city  = clean(extraction.city  || firstLead?.city);
  const state = clean(extraction.state || firstLead?.state);
  const locality = clean(extraction.locality || firstLead?.locality);
  const locationText = [city, state].filter(Boolean).join(', ');

  let latitude: number | null = null;
  let longitude: number | null = null;

  if (locationText) {
    const geo = await geocodeLocation(locationText);
    if (geo) { latitude = geo.lat; longitude = geo.lng; }
  }

  const { data: disaster, error: dErr } = await supabase
    .from('disasters')
    .upsert({
      title:          data.title,
      description:    data.description,
      disaster_type:  extraction.disasterCategory || 'other',
      severity:       firstLead?.impactLevel || 'Medium',
      news_source:    data.newsSource,
      source_url:     data.sourceUrl,
      published_at:   data.publishedAt.toISOString(),
      dedup_hash:     data.dedupHash,
      state,
      city,
      locality,
      location_name:  locationText || null,
      latitude,
      longitude,
      is_processed:   true,
    }, { onConflict: 'dedup_hash' })
    .select('id')
    .single();

  if (dErr || !disaster) {
    console.error('Failed to upsert disaster:', dErr);
    return { status: 'error', error: dErr?.message };
  }

  // If we have coordinates, search for nearby businesses
  let leadsSaved = 0;
  if (latitude && longitude) {
    leadsSaved = await searchAndSaveBusinesses(disaster.id, latitude, longitude, 2.0, extraction.disasterCategory as DisasterType, (firstLead?.impactLevel || 'Medium') as Severity);
  }

  return { status: 'success', disasterId: disaster.id, leadsSaved };
}

export async function searchAndSaveBusinesses(
  disasterId: string,
  lat: number,
  lng: number,
  radiusKm: number,
  disasterType: DisasterType,
  severity: Severity
): Promise<number> {
  const businesses = await findBusinessesNearby(lat, lng, radiusKm);
  if (!businesses.length) return 0;

  // Fetch ALL existing business names globally to avoid cross-disaster duplicates
  // (e.g. two nearby disasters finding the same shops via Overpass)
  const { data: existing } = await supabase
    .from('businesses')
    .select('business_name');

  const existingKeys = new Set(
    (existing || []).map((b: any) =>
      b.business_name.toLowerCase().replace(/[^a-z0-9]/g, '')
    )
  );

  // Enrich with SerpAPI contacts if key is available (for businesses missing phone/email)
  const enrichedBusinesses = await Promise.all(
    businesses.map(async (b) => {
      if (process.env.SERPAPI_KEY && !b.phone && !b.email) {
        const contact = await findBusinessContact(b.name, b.address || `${lat},${lng}`);
        return {
          ...b,
          phone: contact.phones[0] || b.phone || null,
          email: contact.emails[0] || b.email || null,
        };
      }
      return b;
    })
  );

  // Only insert businesses not already saved for this disaster
  const toInsert = enrichedBusinesses
    .filter(b => !existingKeys.has(b.name.toLowerCase().replace(/[^a-z0-9]/g, '')))
    .map(b => ({
      disaster_id:   disasterId,
      business_name: b.name,
      category:      b.category,
      address:       b.address,
      phone:         b.phone || null,
      email:         b.email || null,
      website:       b.website || null,
      latitude:      b.lat,
      longitude:     b.lng,
      distance_km:   b.distance_km,
      lead_score:    calculateLeadScore({ distanceKm: b.distance_km, category: b.category, disasterType, severity }),
      lead_source:   'OpenStreetMap',
    }));

  if (!toInsert.length) return 0; // all already exist, nothing new to insert

  const { data, error } = await supabase.from('businesses').insert(toInsert).select('id');
  if (!error && data) {
    const saved = data.length;
    // Increment leads_count rather than overwrite, so repeated searches accumulate correctly
    const { data: dis } = await supabase.from('disasters').select('leads_count').eq('id', disasterId).single();
    const currentCount = dis?.leads_count || 0;
    await supabase.from('disasters').update({ businesses_searched: true, leads_count: currentCount + saved }).eq('id', disasterId);
    return saved;
  }
  return 0;
}

export async function fetchAllDisasters(limit = 100) {
  if (isMock) return MOCK_DISASTERS;
  const { data, error } = await supabase
    .from('disasters')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('fetchAllDisasters:', error); return []; }
  return data || [];
}

export async function fetchDisasterById(id: string) {
  if (isMock) return MOCK_DISASTERS.find(d => d.id === id) || null;
  const { data, error } = await supabase.from('disasters').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function createManualDisaster(payload: {
  title: string; description?: string;
  disaster_type: string; severity: string;
  location_name: string; radius_km: number;
  latitude?: number; longitude?: number;
  city?: string; state?: string;
}) {
  if (isMock) return { id: `mock-manual-${Date.now()}`, ...payload };
  const { data, error } = await supabase
    .from('disasters')
    .insert({ ...payload, is_manual: true, is_processed: true, status: 'active' })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateDisaster(id: string, payload: Partial<{
  title: string; severity: string; status: string; radius_km: number; description: string;
}>) {
  if (isMock) return;
  const { error } = await supabase.from('disasters').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteDisaster(id: string) {
  if (isMock) return;
  const { error } = await supabase.from('disasters').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── BUSINESS OPERATIONS ──────────────────────────────────────────────────────

export async function fetchBusinesses(filters: {
  disaster_id?: string;
  lead_status?: string;
  disaster_type?: string;
  min_score?: number;
  limit?: number;
} = {}) {
  if (isMock) {
    let results = [...MOCK_BUSINESSES];
    if (filters.disaster_id) results = results.filter(b => b.disaster_id === filters.disaster_id);
    if (filters.lead_status) results = results.filter(b => b.lead_status === filters.lead_status);
    return results;
  }

  let query = supabase
    .from('businesses')
    .select('*')
    .order('lead_score', { ascending: false })
    .limit(filters.limit || 200);

  if (filters.disaster_id) query = query.eq('disaster_id', filters.disaster_id);
  if (filters.lead_status) query = query.eq('lead_status', filters.lead_status);
  if (filters.min_score)   query = query.gte('lead_score', filters.min_score);

  const { data: bizData, error } = await query;
  if (error) { console.error('fetchBusinesses:', error); throw new Error(error.message); }
  if (!bizData?.length) return [];

  // Fetch related disasters separately (avoids PostgREST FK cache issues)
  const disasterIds = Array.from(new Set(bizData.map((b: any) => b.disaster_id).filter(Boolean)));
  const { data: disasterData } = await supabase
    .from('disasters')
    .select('id, title, disaster_type, city, state, severity, source_url, published_at')
    .in('id', disasterIds);

  const disasterMap: Record<string, any> = {};
  (disasterData || []).forEach((d: any) => { disasterMap[d.id] = d; });

  const businesses = bizData.map((b: any) => ({ ...b, disasters: disasterMap[b.disaster_id] || null }));

  // Filter by disaster_type after merging (since it's on the related table)
  if (filters.disaster_type && filters.disaster_type !== 'all') {
    return businesses.filter((b: any) => b.disasters?.disaster_type === filters.disaster_type);
  }

  return businesses;
}

export async function updateBusiness(id: string, payload: Partial<{
  lead_status: string; notes: string; phone: string; email: string;
}>) {
  if (isMock) return;
  const { error } = await supabase
    .from('businesses')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteBusinesses(ids: string[]) {
  if (isMock || !ids.length) return;
  const { error } = await supabase.from('businesses').delete().in('id', ids);
  if (error) throw new Error(error.message);
}

// ─── STATS ────────────────────────────────────────────────────────────────────

export async function fetchDashboardStats() {
  if (isMock) {
    return {
      total_disasters: MOCK_DISASTERS.length,
      total_businesses: MOCK_BUSINESSES.length,
      active_disasters: MOCK_DISASTERS.filter(d => d.status === 'active').length,
      high_severity: MOCK_DISASTERS.filter(d => d.severity === 'High' || d.severity === 'Critical').length,
      by_type: [
        { disaster_type: 'fire', count: 1 },
        { disaster_type: 'earthquake', count: 1 },
        { disaster_type: 'flood', count: 1 },
      ],
      by_status: [
        { lead_status: 'New', count: 4 },
        { lead_status: 'Contacted', count: 1 },
        { lead_status: 'Interested', count: 1 },
      ],
      recent_disasters: MOCK_DISASTERS.slice(0, 5),
    };
  }

  const [disasterRes, businessRes] = await Promise.all([
    supabase.from('disasters').select('id, disaster_type, severity, status, title, city, state, published_at, leads_count'),
    supabase.from('businesses').select('id, lead_status, lead_score'),
  ]);

  const disasters = disasterRes.data || [];
  const businesses = businessRes.data || [];

  const byType: Record<string, number> = {};
  disasters.forEach(d => { byType[d.disaster_type] = (byType[d.disaster_type] || 0) + 1; });

  const byStatus: Record<string, number> = {};
  businesses.forEach(b => { byStatus[b.lead_status] = (byStatus[b.lead_status] || 0) + 1; });

  return {
    total_disasters:  disasters.length,
    total_businesses: businesses.length,
    active_disasters: disasters.filter(d => d.status === 'active').length,
    high_severity:    disasters.filter(d => d.severity === 'High' || d.severity === 'Critical').length,
    by_type:    Object.entries(byType).map(([disaster_type, count]) => ({ disaster_type, count })),
    by_status:  Object.entries(byStatus).map(([lead_status, count]) => ({ lead_status, count })),
    recent_disasters: disasters.slice(0, 10),
  };
}

// ─── PURGE ────────────────────────────────────────────────────────────────────

export async function purgeAll() {
  if (isMock) return;
  await supabase.from('disasters').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}
