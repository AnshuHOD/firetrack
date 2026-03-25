import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface ExtractedLead {
  state: string | null;
  city: string | null;
  locality: string | null;
  businessName: string | null;
  businessType: string | null;
  impactLevel: 'High' | 'Medium' | 'Low' | null;
  impactReason: string | null;
}

export interface ExtractionResult {
  incidentType: string;
  disasterCategory: 'fire' | 'earthquake' | 'flood' | 'explosion' | 'storm' | 'collapse' | 'chemical' | 'tsunami' | 'landslide' | 'other';
  city: string | null;
  state: string | null;
  locality: string | null;
  leads: ExtractedLead[];
}

export async function extractLeadFromNews(
  newsTitle: string,
  newsDescription: string
): Promise<ExtractionResult | null> {
  if (!openai) {
    return {
      incidentType: 'Fire',
      disasterCategory: 'fire',
      city: 'Mock City', state: 'Mock State', locality: 'Mock Area',
      leads: [{
        state: 'Mock State', city: 'Mock City', locality: 'Mock Area',
        businessName: 'Mock Business', businessType: 'Factory',
        impactLevel: 'Medium', impactReason: 'Mocked locally',
      }],
    };
  }

  const prompt = `
You are a DISASTER INTELLIGENCE ANALYST for India. Extract structured data from this news article.

TITLE: ${newsTitle}
DESCRIPTION: ${newsDescription}

TASK:
1. Identify the disaster type (fire, earthquake, flood, explosion, storm, collapse, chemical, tsunami, landslide, other).
2. Find specific Indian city + state where the incident happened (ALWAYS required).
3. Extract affected NAMED businesses (factory, warehouse, hotel, shop, etc.) — max 2.

CRITICAL RULES:
- If news is about Sports, Entertainment, or Politics → return empty leads array.
- NEVER use "Unknown", "Unidentified", "A factory", "N/A" as businessName.
- If no specific business name is mentioned → empty leads array (but still populate city/state/locality).
- businessName must be the actual name of the establishment.
- impactLevel: "High" = major destruction, "Medium" = significant damage, "Low" = minor damage.

OUTPUT FORMAT (JSON only, no markdown):
{
  "incidentType": "Descriptive type e.g. Industrial Fire, Flash Flood, Building Collapse",
  "disasterCategory": "fire|earthquake|flood|explosion|storm|collapse|chemical|tsunami|landslide|other",
  "city": "City/Town Name where incident happened",
  "state": "Indian State Name",
  "locality": "Specific area/neighbourhood if mentioned, else null",
  "leads": [
    {
      "state": "Indian State Name",
      "city": "City/Town Name",
      "locality": "Specific area/mohalla if mentioned",
      "businessName": "Exact Name of Affected Business",
      "businessType": "e.g. Textile Factory, Hotel, Chemical Plant",
      "impactLevel": "High|Medium|Low",
      "impactReason": "Brief damage description"
    }
  ]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 800,
    });

    const raw = response.choices[0].message.content || '{}';
    const cleaned = raw.replace(/```json|```/gi, '').trim();
    return JSON.parse(cleaned) as ExtractionResult;
  } catch (err) {
    console.error('AI extraction failed:', err);
    return {
      incidentType: 'General Incident',
      disasterCategory: 'other',
      city: null, state: null, locality: null,
      leads: [],
    };
  }
}
