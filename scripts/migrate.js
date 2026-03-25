const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load DATABASE_URL from .env manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/^DATABASE_URL=(.+)$/m);
if (!match) { console.error('DATABASE_URL not found in .env'); process.exit(1); }
const DATABASE_URL = match[1].trim();

const MIGRATION_SQL = `
-- Drop old tables (cascade removes dependent objects)
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS email_reports CASCADE;

-- Table: disasters
CREATE TABLE disasters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  disaster_type TEXT NOT NULL DEFAULT 'fire'
    CHECK (disaster_type IN ('fire','earthquake','flood','explosion','storm','collapse','chemical','tsunami','landslide','other')),
  severity TEXT NOT NULL DEFAULT 'Medium'
    CHECK (severity IN ('Critical','High','Medium','Low')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','resolved','monitoring')),
  news_source TEXT,
  source_url TEXT,
  published_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  dedup_hash TEXT UNIQUE,
  is_manual BOOLEAN DEFAULT FALSE,
  location_name TEXT,
  state TEXT,
  city TEXT,
  locality TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 2.0,
  is_processed BOOLEAN DEFAULT FALSE,
  businesses_searched BOOLEAN DEFAULT FALSE,
  leads_count INT DEFAULT 0
);

-- Table: businesses
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  category TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  google_maps_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION,
  lead_score INT DEFAULT 50 CHECK (lead_score BETWEEN 0 AND 100),
  lead_status TEXT DEFAULT 'New'
    CHECK (lead_status IN ('New','Contacted','Interested','Converted','Closed')),
  lead_source TEXT DEFAULT 'OpenStreetMap',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  emailed_in_report BOOLEAN DEFAULT FALSE
);

-- Table: email_reports
CREATE TABLE email_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  recipient_email TEXT,
  disasters_count INTEGER,
  leads_count INTEGER,
  status TEXT CHECK (status IN ('sent','failed')),
  error_message TEXT
);

-- Indexes
CREATE INDEX idx_disasters_type      ON disasters(disaster_type);
CREATE INDEX idx_disasters_severity  ON disasters(severity);
CREATE INDEX idx_disasters_status    ON disasters(status);
CREATE INDEX idx_disasters_published ON disasters(published_at DESC);
CREATE INDEX idx_businesses_disaster ON businesses(disaster_id);
CREATE INDEX idx_businesses_status   ON businesses(lead_status);
CREATE INDEX idx_businesses_score    ON businesses(lead_score DESC);
CREATE INDEX idx_businesses_created  ON businesses(created_at DESC);
`;

async function migrate() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected. Running migration...\n');

    await client.query(MIGRATION_SQL);

    console.log('Migration complete. Tables created:');
    const { rows } = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    rows.forEach(r => console.log(' ✓', r.tablename));
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
