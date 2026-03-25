// Lead scoring algorithm (0–100)
// Factors: proximity, business type relevance, disaster type match, severity

export type DisasterType = 'fire' | 'earthquake' | 'flood' | 'explosion' | 'storm' | 'collapse' | 'chemical' | 'tsunami' | 'landslide' | 'other';
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

// Which business categories are high-value for each disaster type
const DISASTER_RELEVANCE: Record<DisasterType, string[]> = {
  fire:       ['factory', 'industrial', 'warehouse', 'chemical', 'textile', 'hotel', 'restaurant', 'retail', 'fuel'],
  earthquake: ['industrial', 'warehouse', 'construction', 'hotel', 'hospital', 'office', 'commercial'],
  flood:      ['warehouse', 'industrial', 'retail', 'farm', 'storage', 'ground floor', 'basement'],
  explosion:  ['chemical', 'industrial', 'factory', 'fuel', 'gas', 'warehouse'],
  storm:      ['retail', 'hotel', 'office', 'commercial', 'signage', 'outdoor'],
  collapse:   ['industrial', 'warehouse', 'commercial', 'construction', 'office'],
  chemical:   ['factory', 'chemical', 'pharmaceutical', 'industrial', 'agricultural'],
  tsunami:    ['hotel', 'retail', 'industrial', 'port', 'warehouse', 'restaurant'],
  landslide:  ['industrial', 'agricultural', 'warehouse', 'construction'],
  other:      ['industrial', 'commercial', 'retail'],
};

// Base value of business category for any disaster
const CATEGORY_BASE_SCORE: Record<string, number> = {
  'Industrial / Factory': 30,
  'Warehouse': 28,
  'Chemical': 28,
  'Craft': 20,
  'Hotel': 22,
  'Retail': 18,
  'Restaurant / Cafe': 16,
  'Bank': 14,
  'Office': 14,
  'Hospital / Clinic': 12,
  'Educational': 10,
  'Fuel Station': 20,
  'Market': 16,
  'Commercial Building': 14,
  'Business': 10,
};

function getBaseScore(category: string): number {
  for (const [key, score] of Object.entries(CATEGORY_BASE_SCORE)) {
    if (category.toLowerCase().includes(key.toLowerCase())) return score;
  }
  return 10;
}

function getRelevanceBonus(category: string, disasterType: DisasterType): number {
  const relevant = DISASTER_RELEVANCE[disasterType] || [];
  const catLower = category.toLowerCase();
  if (relevant.some(r => catLower.includes(r))) return 20;
  return 0;
}

function getDistanceScore(distanceKm: number): number {
  if (distanceKm <= 0.25) return 40;
  if (distanceKm <= 0.5)  return 36;
  if (distanceKm <= 1.0)  return 30;
  if (distanceKm <= 1.5)  return 24;
  if (distanceKm <= 2.0)  return 18;
  if (distanceKm <= 3.0)  return 12;
  if (distanceKm <= 4.0)  return 7;
  return 4;
}

function getSeverityBonus(severity: Severity): number {
  switch (severity) {
    case 'Critical': return 10;
    case 'High':     return 7;
    case 'Medium':   return 4;
    case 'Low':      return 1;
  }
}

export function calculateLeadScore(params: {
  distanceKm: number;
  category: string;
  disasterType: DisasterType;
  severity: Severity;
}): number {
  const distScore    = getDistanceScore(params.distanceKm);        // max 40
  const baseScore    = getBaseScore(params.category);              // max 30
  const relevBonus   = getRelevanceBonus(params.category, params.disasterType); // max 20
  const sevBonus     = getSeverityBonus(params.severity);          // max 10

  return Math.min(100, distScore + baseScore + relevBonus + sevBonus);
}

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Very High', color: '#ef4444' };
  if (score >= 60) return { label: 'High',      color: '#f97316' };
  if (score >= 40) return { label: 'Medium',    color: '#eab308' };
  if (score >= 20) return { label: 'Low',       color: '#22c55e' };
  return                  { label: 'Minimal',   color: '#6b7280' };
}
