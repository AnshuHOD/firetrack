import { createClient } from '@supabase/supabase-js';
import { RawIncident } from './scraper';
import { ExtractedLead, ExtractionResult } from './aiExtractor';
import { findBusinessContact } from './contactFinder';

const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'mock-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface IncidentLeadData extends RawIncident, ExtractedLead {
  contactPhone?: string | null;
  contactEmail?: string | null;
}

export async function saveIncidentAndLead(data: RawIncident, extraction: ExtractionResult) {
  if (supabaseUrl.includes('mock')) {
    console.log("Mocking save logic since no real DB URL is provided.");
    return { status: 'success', incidentId: `mock-${Date.now()}` };
  }

  // Take location/impact from the first lead if available
  const firstLead = extraction.leads[0];
  
  // CLEANING: Convert string "null" to actual null
  const cleanLead = (l: any) => {
    const obj: any = {};
    for (const key in l) {
      obj[key] = (l[key] === 'null' || l[key] === 'N/A') ? null : l[key];
    }
    return obj;
  };

  const processedFirstLead = cleanLead(firstLead || {});
  
  // Ensure impact_level strictly matches DB constraint
  let finalImpact = 'Medium';
  if (processedFirstLead.impactLevel) {
    const levelStr = String(processedFirstLead.impactLevel).toLowerCase();
    if (levelStr.includes('high')) finalImpact = 'High';
    else if (levelStr.includes('low')) finalImpact = 'Low';
    else finalImpact = 'Medium';
  }

  // Save/Update incident (Self-healing logic using Upsert)
  const { data: incident, error: incidentError } = await supabase
    .from('incidents')
    .upsert({
      title: data.title,
      description: data.description,
      news_source: data.newsSource,
      source_url: data.sourceUrl,
      published_at: data.publishedAt.toISOString(),
      dedup_hash: data.dedupHash,
      incident_type: extraction.incidentType,
      state: processedFirstLead.state || null,
      city: processedFirstLead.city || null,
      locality: processedFirstLead.locality || null,
      impact_level: finalImpact,
      is_processed: true
    }, { onConflict: 'dedup_hash' })
    .select('id')
    .single();

  if (incidentError || !incident) {
    console.error("Failed to upsert incident:", incidentError);
    return { 
      status: 'error', 
      error: `DB Error: ${incidentError?.message}` 
    };
  }

  // Save multiple Leads
  let savedLeadsCount = 0;
  for (const lead of extraction.leads) {
    const pLead = cleanLead(lead);
    
      // FUZZY DE-DUPLICATION: Normalize name to find "Hidden" duplicates
      const normalizeName = (name: string) => {
        return name.toLowerCase()
          .replace(/private|limited|ltd|pvt|hospital|medical|center|inc|corp|co|company/g, '')
          .replace(/[^a-z0-9]/g, '')
          .trim();
      };

      const normalizedNew = normalizeName(pLead.businessName);

      // Get all existing leads to check for fuzzy match
      const { data: allLeads } = await supabase.from('leads').select('business_name');
      const isDuplicate = allLeads?.some(existing => {
        const normExisting = normalizeName(existing.business_name);
        return normExisting === normalizedNew || normalizedNew.includes(normExisting) || normExisting.includes(normalizedNew);
      });

      if (isDuplicate) {
         console.log(`Fuzzy Duplicate: ${pLead.businessName} looks too similar to an existing lead, skipping.`);
         continue;
      }

      // Filter out only truly generic/bad names (Ghost Leads)
      const nameLower = pLead.businessName.toLowerCase();
      const genericWords = ['hospital', 'unnamed', 'unidentified', 'unknown', 'business', 'unknown type', 'n/a', 'incident', 'property'];
      
      const isTooGeneric = 
        genericWords.some(gw => nameLower === gw) || 
        nameLower.includes('unnamed hospital') ||
        nameLower.includes('unidentified business') ||
        nameLower.length < 5; // Slightly longer minimum
      
      if (isTooGeneric) {
        console.log(`Skipping ghost lead: ${pLead.businessName}`);
        continue;
      }

      // Find contact info for this specific lead
      const contacts = await findBusinessContact(pLead.businessName, pLead.city || '');

      const { error: leadError } = await supabase
        .from('leads')
        .insert([{
          incident_id: incident.id,
          business_name: pLead.businessName,
          business_type: pLead.businessType,
          contact_phone: contacts.phones[0] || null,
          contact_email: contacts.emails[0] || null,
          lead_source: 'AI Extracted'
        }]);

      if (!leadError) savedLeadsCount++;
  }

  return { status: 'success', incidentId: incident.id, leadsSaved: savedLeadsCount };
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
