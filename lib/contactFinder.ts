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

    const allText = JSON.stringify(data.organic_results || '');
    const phoneRegex = /(\+91[\s-]?)?[6-9]\d{9}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    const phones = Array.from(new Set(allText.match(phoneRegex) || [])).slice(0, 3);
    const emails = Array.from(new Set(allText.match(emailRegex) || [])).slice(0, 2);

    return { phones, emails };
  } catch (e) {
    console.error("SerpAPI failed:", e);
    return { phones: [], emails: [] };
  }
}
