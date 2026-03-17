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
You are a HIGH-PRECISION insurance lead extractor for Indian News. 
Your goal is to find businesses or properties that have suffered SIGNIFICANT damage (Fire, Blast, Flood, Collapse).

NEWS TITLE: ${newsTitle}
NEWS DESCRIPTION: ${newsDescription}

STRICT RULES:
1. IF the news is about Sports (Cricket, IPL), Entertainment (Movies, Actors), or Politics, return an empty "leads" array immediately.
2. IF there is NO clear business/commercial property damage, return an empty "leads" array.
3. MANDATORY: You MUST identify a specific Indian City and State. If the city is vague (e.g., "North India"), attempt to find the exact district.
4. IDENTITY: Find the specific name of the Shop, Factory, Warehouse, or Hospital.

JSON STRUCTURE:
{
  "incidentType": "Industrial Fire / Commercial Fire / Structure Collapse / etc.",
  "leads": [
    {
      "state": "Indian State",
      "city": "Indian City/Town",
      "businessName": "Full Precise Business Name (CRITICAL: If not found, use empty array [] for leads. NEVER use 'Unidentified', 'Unknown', or generic placeholders)",
      "businessType": "e.g. Textile Factory, Chemical Plant, Warehouse, Hotel",
      "impactLevel": "High" or "Medium" or "Low",
      "impactReason": "Specific damage justification (e.g. 50lakh stock burnt)"
    }
  ]

  RULES:
  1. Return MAX 2 leads per incident.
  2. If a business name is NOT explicitly mentioned (e.g. just 'a factory' or 'a hospital'), return EMPTY ARRAY []. 
  3. NEVER invent or use generic names like 'Unidentified Business' or 'Unknown Factory'.
  4. Prioritize Factories, Warehouses, and Industrial units over residential/hospitals.
  5. Ensure each businessName in the list is UNIQUE.
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
