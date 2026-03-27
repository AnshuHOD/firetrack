'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import StatsCard from '@/components/StatsCard';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import Toast from '@/components/Toast';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => (
  <div className="w-full h-full bg-card border border-border rounded-xl flex items-center justify-center text-textSecondary text-sm">
    Loading map...
  </div>
) });

interface Stats {
  total_disasters: number;
  total_businesses: number;
  active_disasters: number;
  high_severity: number;
  by_type: { disaster_type: string; count: number }[];
  by_status: { lead_status: string; count: number }[];
  recent_disasters: any[];
}

export default function DashboardPage() {
  const [stats, setStats]           = useState<Stats | null>(null);
  const [disasters, setDisasters]   = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, dRes, bRes] = await Promise.all([
        fetch('/api/stats', { cache: 'no-store' }),
        fetch('/api/disasters', { cache: 'no-store' }),
        fetch('/api/businesses?limit=200', { cache: 'no-store' }),
      ]);
      const [s, d, b] = await Promise.all([sRes.json(), dRes.json(), bRes.json()]);
      if (s.success) setStats(s.data); else throw new Error(s.error || 'Stats failed');
      if (d.success) setDisasters(d.data); else throw new Error(d.error || 'Disasters failed');
      if (b.success) setBusinesses(b.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadData]);

  const handleScrape = async () => {
    setIsScraping(true);
    try {
      const res  = await fetch('/api/scrape');
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: `Scrape complete!\nProcessed: ${data.processed} incidents\nLeads saved: ${data.leadsSaved}` });
        loadData();
      } else {
        setToast({ type: 'error', message: `Scrape failed: ${data.error}` });
      }
    } finally {
      setIsScraping(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Delete ALL data? This cannot be undone.')) return;
    const secret = process.env.NEXT_PUBLIC_CRON_SECRET || '';
    await fetch('/api/admin/purge', {
      method: 'POST',
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    });
    loadData();
  };

  return (
    <div className="flex flex-col gap-6">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-textSecondary mt-0.5">Disaster incident monitoring & business lead generation</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleReset}
            className="flex items-center gap-2 text-xs text-textSecondary hover:text-accentRed transition-colors border border-border px-3 py-2 rounded-lg">
            <Trash2 className="w-3.5 h-3.5" />
            Purge All
          </button>
          <button onClick={handleScrape} disabled={isScraping}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              isScraping ? 'bg-border text-textSecondary cursor-not-allowed' : 'bg-accentBlue text-white hover:bg-blue-500 shadow-lg shadow-accentBlue/20'
            }`}>
            <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
            {isScraping ? 'Scraping...' : 'Auto Scrape'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 bg-accentRed/10 border border-accentRed/30 text-accentRed px-4 py-3 rounded-xl text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={loadData} className="ml-auto underline text-xs hover:no-underline">Retry</button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Disasters"   value={stats?.total_disasters  ?? 0} icon="⚡" color="blue"   loading={loading} />
        <StatsCard label="Total Leads"       value={stats?.total_businesses ?? 0} icon="🏢" color="orange" loading={loading} />
        <StatsCard label="Active Incidents"  value={stats?.active_disasters ?? 0} icon="📡" color="red"    loading={loading} pulse />
        <StatsCard label="High Severity"     value={stats?.high_severity    ?? 0} icon="🔥" color="red"    loading={loading} />
      </div>

      {/* Map + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[420px]">
          <MapView disasters={disasters} businesses={businesses} />
        </div>
        <div className="lg:col-span-1 h-[420px]">
          <AnalyticsPanel stats={stats} businesses={businesses} loading={loading} />
        </div>
      </div>

      {/* Recent Disasters */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">Recent Incidents</h2>
        </div>
        <div className="divide-y divide-border/50">
          {loading ? (
            <div className="px-5 py-8 text-center text-textSecondary text-sm">Loading...</div>
          ) : (stats?.recent_disasters || []).length === 0 ? (
            <div className="px-5 py-8 text-center text-textSecondary text-sm">
              No incidents yet. Click &quot;Auto Scrape&quot; to fetch from news.
            </div>
          ) : (stats?.recent_disasters || []).map((d: any) => (
            <div key={d.id} className="px-5 py-3 flex items-center justify-between hover:bg-background/50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl flex-shrink-0">
                  {({'fire':'🔥','earthquake':'🌍','flood':'🌊','explosion':'💥','storm':'🌪️','collapse':'🏚️','chemical':'☣️','other':'⚠️'} as Record<string,string>)[d.disaster_type] ?? '⚠️'}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{d.title}</p>
                  <p className="text-xs text-textSecondary">{[d.city, d.state].filter(Boolean).join(', ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <span className="text-xs text-textSecondary hidden sm:block">
                  {d.published_at ? new Date(d.published_at).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  }) : ''}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  d.severity === 'Critical' ? 'bg-red-500/20 text-red-400' :
                  d.severity === 'High'     ? 'bg-orange-500/20 text-orange-400' :
                  d.severity === 'Medium'   ? 'bg-yellow-500/20 text-yellow-400' :
                                             'bg-green-500/20 text-green-400'
                }`}>{d.severity}</span>
                <span className="text-xs text-textSecondary">{d.leads_count ?? 0} leads</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
