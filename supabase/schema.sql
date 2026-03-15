-- Table: incidents
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  news_source TEXT,           -- "Hindustan Times", "NDTV", etc.
  source_url TEXT,
  published_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  dedup_hash TEXT UNIQUE,     -- SHA256 of (title + location) to prevent duplicates
  state TEXT,
  city TEXT,
  locality TEXT,              -- Mohalla/Area
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  impact_level TEXT CHECK (impact_level IN ('High', 'Medium', 'Low')),
  is_processed BOOLEAN DEFAULT FALSE
);

-- Table: leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  business_name TEXT,
  business_type TEXT,         -- "Textile Factory", "Warehouse", "Shop", etc.
  contact_phone TEXT,
  contact_email TEXT,
  address TEXT,
  google_maps_url TEXT,
  lead_source TEXT,           -- "AI Extracted" / "Web Search"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  emailed_in_report BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- Table: email_reports
CREATE TABLE email_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  recipient_email TEXT,
  incidents_count INTEGER,
  leads_count INTEGER,
  status TEXT CHECK (status IN ('sent', 'failed')),
  error_message TEXT
);
