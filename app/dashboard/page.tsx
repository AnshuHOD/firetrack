'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import LeadTable from '@/components/LeadTable';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import IncidentMap from '@/components/IncidentMap';

export default function DashboardPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leads');
      const json = await res.json();
      if(json.success) {
        // Flatten the relationship since leads are one-to-one mapped with incidents
        // But the query actually fetched incidents with nested leads[]
        // Let's normalize it to an array of lead objects that include their incident data
        const normalizedLeads: any[] = [];
        
        json.data.forEach((incident: any) => {
          if (incident.leads && incident.leads.length > 0) {
            incident.leads.forEach((l: any) => {
              normalizedLeads.push({ ...l, incidents: incident });
            });
          } else {
            // Include incidents without leads just for the map
            normalizedLeads.push({ id: `no-lead-${incident.id}`, incidents: incident });
          }
        });
        
        setLeads(normalizedLeads);
      }
    } catch(err) {
      console.error("Failed to load leads", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const triggerManualScrape = async () => {
    try {
      setIsScraping(true);
      const res = await fetch('/api/scrape', { method: 'POST' });
      const json = await res.json();
      if(json.success) {
        let msg = `Scrape successful!\nItems Found: ${json.scraped}\nAI Extracted: ${json.extracted}\nSaved to DB: ${json.saved}`;
        if (json.lastError) msg += `\n\nLast Status: ${json.lastError}`;
        alert(msg);
        fetchLeads();
      } else {
        alert('Scrape failed: ' + json.error);
      }
    } catch(err) {
      console.error("Scrape network error:", err);
      alert('Network error while scraping');
    } finally {
      setIsScraping(false);
    }
  };

  const highImpactCount = leads.filter(l => l.incidents?.impact_level === 'High').length;
  const leadCount = leads.filter(l => l.business_name).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <button 
          onClick={triggerManualScrape}
          disabled={isScraping}
          className="flex items-center gap-2 bg-accentBlue text-white px-4 py-2 rounded-md font-semibold hover:bg-accentBlue/90 transition-colors disabled:opacity-50"
        >
          {isScraping ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scraping...</>
          ) : (
             <>🔥 Run Manual Scrape</>
          )}
        </button>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-textSecondary font-medium">Recorded Incidents</p>
            <h3 className="text-3xl font-bold mt-1">{loading ? '...' : leads.length}</h3>
          </div>
          <div className="h-12 w-12 bg-accentBlue/10 rounded-full flex items-center justify-center text-accentBlue font-bold text-xl">
            📊
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-textSecondary font-medium">Total Leads</p>
            <h3 className="text-3xl font-bold mt-1">{loading ? '...' : leadCount}</h3>
          </div>
          <div className="h-12 w-12 bg-accentOrange/10 rounded-full flex items-center justify-center text-accentOrange font-bold text-xl">
            🏢
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-textSecondary font-medium">High Impact</p>
            <h3 className="text-3xl font-bold mt-1 text-accentRed">{loading ? '...' : highImpactCount}</h3>
          </div>
          <div className="h-12 w-12 bg-accentRed/10 rounded-full flex items-center justify-center text-accentRed font-bold flex-col relative">
            🔥
            <div className="absolute top-0 right-0 w-3 h-3 bg-accentRed rounded-full animate-ping"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[400px]">
          <IncidentMap leads={leads} />
        </div>
        <div className="lg:col-span-1 h-[400px]">
          <AnalyticsPanel leads={leads} />
        </div>
      </div>
      
      <div className="h-[500px] w-full">
         <LeadTable leads={leads} />
      </div>
    </div>
  );
}
