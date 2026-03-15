import { createClient } from '@supabase/supabase-js';
import { RawIncident } from './scraper';
import { ExtractedLead } from './aiExtractor';

const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'mock-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface IncidentLeadData extends RawIncident, ExtractedLead {
  contactPhone?: string | null;
  contactEmail?: string | null;
}

export async function saveIncidentAndLead(data: IncidentLeadData) {
  if (supabaseUrl.includes('mock')) {
    console.log("Mocking save logic since no real DB URL is provided.");
    return { status: 'success', incidentId: `mock-${Date.now()}` };
  }

  // Save incident
  const { data: incident, error: incidentError } = await supabase
    .from('incidents')
    .insert([{
      title: data.title,
      description: data.description,
      news_source: data.newsSource,
      source_url: data.sourceUrl,
      published_at: data.publishedAt.toISOString(),
      dedup_hash: data.dedupHash,
      state: data.state,
      city: data.city,
      locality: data.locality,
      impact_level: data.impactLevel,
      is_processed: true
    }])
    .select('id')
    .single();

  // If duplicate, it fails or returns error due to unique constraint on dedup_hash
  if (incidentError || !incident) {
    if (incidentError?.code === '23505') { // Unique violation
      return { status: 'duplicate' };
    }
    console.error("Failed to insert incident:", incidentError);
    return { status: 'error', error: incidentError };
  }

  // Save Lead if applicable business was extracted
  if (data.businessName || data.businessType) {
    const { error: leadError } = await supabase
      .from('leads')
      .insert([{
        incident_id: incident.id,
        business_name: data.businessName,
        business_type: data.businessType,
        contact_phone: data.contactPhone,
        contact_email: data.contactEmail,
        lead_source: 'AI Extracted'
      }]);

    if (leadError) {
      console.error("Failed to insert lead:", leadError);
      return { status: 'error', error: leadError };
    }
  }

  return { status: 'success', incidentId: incident.id };
}

export async function fetchRecentLeadsWithIncidents() {
  if (supabaseUrl.includes('mock')) {
    return [
      {
        id: 'mock-1',
        title: 'Massive Fire Breaks Out in Industrial Area',
        description: 'A major fire incident was reported early morning...',
        news_source: 'Dummy News',
        source_url: '#',
        published_at: new Date().toISOString(),
        state: 'Maharashtra',
        city: 'Mumbai',
        impact_level: 'High',
        latitude: 19.0760,
        longitude: 72.8777,
        leads: [
          {
            id: 'lead-mock-1',
            business_name: 'Acme Chemicals Mfg',
            business_type: 'Factory',
            contact_phone: '+91 99999 00000',
            contact_email: 'contact@acme.example.com',
          }
        ]
      },
      {
        id: 'mock-2',
        title: 'Small shop catches fire in market',
        description: 'A minor fire broke out in a local bakery...',
        news_source: 'Local News',
        source_url: '#',
        published_at: new Date().toISOString(),
        state: 'Delhi',
        city: 'Delhi',
        impact_level: 'Low',
        latitude: 28.7041,
        longitude: 77.1025,
        leads: [
          {
            id: 'lead-mock-2',
            business_name: 'Delhi Bakers Delight',
            business_type: 'Bakery',
            contact_phone: '+91 88888 11111',
            contact_email: 'hello@delhibakers.com',
          }
        ]
      }
    ];
  }

  try {
    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        leads (*)
      `)
      .order('published_at', { ascending: false })
      .limit(50);
      
    if (error) {
      console.error("Error fetching leads:", error);
      return [];
    }
    return data;
  } catch (err) {
    console.error("Supabase network error:", err);
    return [];
  }
}
