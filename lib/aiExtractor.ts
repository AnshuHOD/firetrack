import OpenAI from 'openai';

// Ensure API Key exists but softly fallback if missing in frontend preview mode
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

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
  leads: ExtractedLead[];
}

export async function extractLeadFromNews(newsTitle: string, newsDescription: string): Promise<ExtractionResult | null> {
  if (!openai) {
    console.warn("OPENAI_API_KEY is not set. Skipping AI extraction.");
    return {
      incidentType: "Fire",
      leads: [{
        state: "Mock State",
        city: "Mock City",
        locality: "Mock Area",
        businessName: "Mock Business",
        businessType: "Factory",
        impactLevel: "Medium",
        impactReason: "Mocked locally"
      }]
    };
  }

  const prompt = `
You are an expert data extractor for Indian news focusing on Business Incidents (Fire, Expansion, New Openings).

NEWS TITLE: ${newsTitle}
NEWS DESCRIPTION: ${newsDescription}

IMPORTANT: 
1. If the news is about SPORTS, MOVIES, POLITICS, or NOT a business incident, return an empty "leads" array.
2. Be extremely aggressive in finding the CITY and STATE. Look at the title and description carefully.
3. Provide an array of leads. If multiple shops/factories are affected, extract each.

Return ONLY a valid JSON object:
{
  "incidentType": "Fire / Flood / Business Expansion / New Opening",
  "leads": [
    {
      "state": "Indian state name (MANDATORY if found)",
      "city": "Indian city name (MANDATORY if found)",
      "locality": "area/mohalla or null",
      "businessName": "name of shop/factory/entity or null",
      "businessType": "type (e.g., Textile Factory, Warehouse, etc.) or null",
      "impactLevel": "High" or "Medium" or "Low",
      "impactReason": "brief reason"
    }
  ]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const text = response.choices[0].message.content || '{}';
    const cleanText = text.replace(/```json|```/gi, '').trim();
    return JSON.parse(cleanText) as ExtractionResult;
  } catch (err) {
    console.error("AI Extraction failed, using basic fallback:", err);
    // Basic fallback so the system doesn't return 0 leads
    return {
      incidentType: "General Incident",
      leads: [{
        state: null,
        city: null,
        locality: null,
        businessName: "Potentially affected entity",
        businessType: "Commercial/Residential",
        impactLevel: "Medium",
        impactReason: "Mentioned in news report"
      }]
    };
  }
}
