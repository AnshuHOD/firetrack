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

export async function extractLeadFromNews(newsTitle: string, newsDescription: string): Promise<ExtractedLead | null> {
  if (!openai) {
    console.warn("OPENAI_API_KEY is not set. Skipping AI extraction.");
    // Return mock data for UI building purposes if API key missing
    return {
      state: "Mock State",
      city: "Mock City",
      locality: "Mock Area",
      businessName: "Mock Business from: " + newsTitle.slice(0, 15),
      businessType: "Factory",
      impactLevel: "Medium",
      impactReason: "Mocked locally without OpenAI API Key"
    };
  }

  const prompt = `
You are an expert data extractor. Analyze this Indian fire incident news and extract structured data.

NEWS TITLE: ${newsTitle}
NEWS DESCRIPTION: ${newsDescription}

Extract and return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "state": "state name or null",
  "city": "city name or null",
  "locality": "area/mohalla/locality or null",
  "businessName": "name of affected shop/factory/warehouse or null",
  "businessType": "type like Textile Factory / Godown / Market / Residential / null",
  "impactLevel": "High" or "Medium" or "Low",
  "impactReason": "brief reason for impact level in 1 sentence"
}

Rules:
- impactLevel = High if factory/warehouse/industrial unit burned
- impactLevel = Medium if shop/commercial establishment burned
- impactLevel = Low if residential/vehicle/minor fire
- If info not available, use null
- Return ONLY the JSON, nothing else
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
    });

    const text = response.choices[0].message.content || '{}';
    // Clean up potential markdown formatting block
    const cleanText = text.replace(/```json|```/gi, '').trim();
    return JSON.parse(cleanText) as ExtractedLead;
  } catch (err) {
    console.error("AI Extraction failed:", err);
    return null;
  }
}
