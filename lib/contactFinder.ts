export async function findBusinessContact(businessName: string, location: string) {
  if (!process.env.SERPAPI_KEY) {
    // If no key, skip actual API call to save dev errors
    return { phones: ['+91-9876543210'], emails: ['contact@' + businessName.replace(/\s/g, '').toLowerCase() + '.com'] };
  }

  const query = `"${businessName}" "${location}" contact phone number`;
  const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}&num=5`;

  try {
    const res = await fetch(serpUrl);
    const data = await res.json();

    // Strategy 1: Look in Knowledge Graph (Most accurate)
    let phones: string[] = [];
    if (data.knowledge_graph?.phone) {
        phones.push(data.knowledge_graph.phone);
    }

    // Strategy 2: Look in Local Results
    if (data.local_results?.[0]?.phone) {
        phones.push(data.local_results[0].phone);
    }

    // Strategy 3: Organic Text Matching (Fallback)
    const organicText = JSON.stringify(data.organic_results || '');
    const phoneRegex = /(\+91[\s-]?)?[6-9]\d{9}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    const matchedPhones = organicText.match(phoneRegex) || [];
    phones = [...phones, ...matchedPhones];

    const emails = Array.from(new Set(JSON.stringify(data).match(emailRegex) || [])).slice(0, 2);
    const uniquePhones = Array.from(new Set(phones)).slice(0, 3);

    return { phones: uniquePhones, emails };
  } catch (e) {
    console.error("SerpAPI failed:", e);
    return { phones: [], emails: [] };
  }
}
