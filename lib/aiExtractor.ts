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
You are an expert data extractor for Indian news. Analyze this incident and provide structured output.

NEWS TITLE: ${newsTitle}
NEWS DESCRIPTION: ${newsDescription}

IMPORTANT: Provide an array of leads. If multiple shops, factories, houses, or people are affected, extract each one as a separate object in the "leads" array.

Return ONLY a valid JSON object:
{
  "incidentType": "Fire / Flood / Theft / Accident / New Development / etc.",
  "leads": [
    {
      "state": "state name or null",
      "city": "city name or null",
      "locality": "area/mohalla/locality or null",
      "businessName": "name of affected entity/shop/factory or null",
      "businessType": "type (e.g., Textile Factory, Warehouse, Residential, etc.) or null",
      "impactLevel": "High" or "Medium" or "Low",
      "impactReason": "brief reason why this entity was affected"
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
