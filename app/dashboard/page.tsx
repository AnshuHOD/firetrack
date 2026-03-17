'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
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
      const res = await fetch(`/api/leads?t=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      const json = await res.json();
      
      console.log("[Dashboard] Raw API Response:", json);

      if(json.success) {
        if (!json.data || json.data.length === 0) {
          console.warn("[Dashboard] API returned SUCCESS but empty array. Check Supabase RLS or DB counts.");
          setLeads([]);
          return;
        }

        const normalizedLeads: any[] = [];
        json.data.forEach((incident: any) => {
          if (incident.leads && incident.leads.length > 0) {
            incident.leads.forEach((l: any) => {
              normalizedLeads.push({ ...l, incidents: incident });
            });
          } else {
            normalizedLeads.push({ 
              id: `no-lead-${incident.id}`, 
              is_incident_only: true,
              incidents: incident 
            });
          }
        });
        
        console.log("[Dashboard] Normalized leads count:", normalizedLeads.length);
        setLeads(normalizedLeads);
      } else {
        alert(`Dashboard Fetch Failed: ${json.error}`);
      }
    } catch(err: any) {
      console.error("Failed to load leads", err);
      alert(`Critical Load Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleManualScrape = async () => {
    setIsScraping(true);
    try {
      const res = await fetch('/api/scrape');
      const data = await res.json();
      if (data.success) {
        let msg = `Scrape successful!\nItems Found: ${data.processed}\nExtracted: ${data.extracted}\nSaved: ${data.saved}`;
        if (data.lastError) msg += `\n\nERROR: ${data.lastError}`;
        alert(msg);
        window.location.reload();
      } else {
        alert(`Scrape Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert("Network Error: Could not trigger scrape.");
    } finally {
      setIsScraping(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure? This will delete all current noisy leads and start fresh.")) return;
    try {
      const res = await fetch('/api/admin/purge', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert("Dashboard Reset Successfully!");
        window.location.reload();
      }
    } catch (err) {
      alert("Failed to reset dashboard.");
    }
  };

  // Correct stats based on normalized structure
  const uniqueIncidentIds = new Set(leads.map(l => l.incidents?.id).filter(Boolean));
  const incidentCount = uniqueIncidentIds.size;
  const leadCount = leads.filter(l => l.business_name && !l.is_incident_only).length;
  const highImpactCount = leads.filter(l => l.incidents?.impact_level === 'High').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleReset}
                className="text-xs text-textSecondary hover:text-accentRed transition-colors border border-border px-3 py-1.5 rounded-md"
              >
                Reset Noise
              </button>
              <button 
                onClick={handleManualScrape}
                disabled={isScraping}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isScraping 
                    ? 'bg-border text-textSecondary cursor-not-allowed' 
                    : 'bg-accentBlue text-white hover:bg-blue-600 shadow-lg shadow-accentBlue/20'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
                {isScraping ? 'Scraping...' : 'Manual Scrape'}
              </button>
            </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-textSecondary font-medium">Recorded Incidents</p>
            <h3 className="text-3xl font-bold mt-1">{loading ? '...' : incidentCount}</h3>
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
