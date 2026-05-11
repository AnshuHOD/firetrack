'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Trash2, AlertTriangle, ArrowUpRight, Sparkles, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';
import StatsCard from '@/components/StatsCard';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import Toast from '@/components/Toast';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full rounded-3xl flex items-center justify-center text-textSecondary text-sm"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      Loading map…
    </div>
  ),
});

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
    <div className="flex flex-col">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      {/* HERO — editorial, large display headline */}
      <section className="relative bg-grid-fade">
        <div className="max-w-[1600px] mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium uppercase tracking-[0.18em] mb-6"
                style={{ background: 'var(--bg-card)', color: 'var(--accent-brown)', border: '1px solid var(--border)' }}>
                <Sparkles className="w-3.5 h-3.5" />
                Lead Studio · Today
              </div>
              <h1 className="font-display font-semibold text-display-xl tracking-tighter">
                Run your entire<br />
                <span style={{ color: 'var(--accent-brown)' }}>Lead pipeline.</span><br />
                In one place.
              </h1>
              <p className="mt-6 text-lg md:text-xl text-textSecondary max-w-2xl leading-relaxed">
                Live disaster monitoring, nearby-business discovery, AI-scored leads, geo intelligence and exports — one beautifully crafted portal built for ambitious Indian businesses.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleScrape}
                  disabled={isScraping}
                  className="btn-pill btn-primary disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
                  {isScraping ? 'Scraping…' : 'Auto Scrape'}
                </button>
                <button
                  onClick={handleReset}
                  className="btn-pill btn-secondary"
                  style={{ color: 'var(--accent-red)', borderColor: 'rgba(184, 77, 44, 0.30)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Purge All
                </button>
                <button
                  onClick={loadData}
                  className="btn-pill btn-secondary"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Right side: floating KPI summary card */}
            <div className="lg:col-span-5">
              <div className="card-luxe p-7 shadow-soft-lg hover-lift relative overflow-hidden">
                <div
                  className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
                  style={{ background: 'rgba(156, 107, 74, 0.10)', filter: 'blur(12px)' }}
                />
                <div className="relative">
                  <p className="text-xs uppercase tracking-[0.22em] text-textSecondary">Live coverage</p>
                  <div className="mt-3 flex items-baseline gap-3">
                    <span className="font-display text-6xl font-semibold tracking-tighter tabular-nums">
                      {loading ? '—' : stats?.total_businesses ?? 0}
                    </span>
                    <span className="text-textSecondary text-sm">leads tracked</span>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-4 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-textSecondary">Events</p>
                      <p className="font-display text-2xl font-semibold mt-1 tabular-nums">{loading ? '—' : stats?.total_disasters ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-textSecondary">Active</p>
                      <p className="font-display text-2xl font-semibold mt-1 tabular-nums" style={{ color: 'var(--accent-red)' }}>
                        {loading ? '—' : stats?.active_disasters ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-textSecondary">Critical</p>
                      <p className="font-display text-2xl font-semibold mt-1 tabular-nums" style={{ color: 'var(--accent-orange)' }}>
                        {loading ? '—' : stats?.high_severity ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Error banner */}
      {error && (
        <section className="max-w-[1600px] mx-auto px-6 md:px-10 mt-4">
          <div
            className="flex items-center gap-3 px-5 py-4 rounded-2xl text-sm"
            style={{ background: 'rgba(184, 77, 44, 0.08)', border: '1px solid rgba(184, 77, 44, 0.25)', color: '#8A3618' }}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={loadData} className="ml-auto underline text-xs hover:no-underline">Retry</button>
          </div>
        </section>
      )}

      {/* STATS — editorial KPI row */}
      <section className="max-w-[1600px] mx-auto px-6 md:px-10 mt-10 md:mt-16">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-textSecondary">Section 01</p>
            <h2 className="font-display text-display-md font-semibold mt-1 tracking-tight">At a glance</h2>
          </div>
          <p className="text-sm text-textSecondary max-w-md">
            A live read of every event, lead, and high-priority signal across your pipeline.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard label="Total events"     value={stats?.total_disasters  ?? 0} icon="⚡" color="blue"   loading={loading} hint="All time" />
          <StatsCard label="Total leads"      value={stats?.total_businesses ?? 0} icon="🏢" color="orange" loading={loading} hint="Across pipeline" />
          <StatsCard label="Active incidents" value={stats?.active_disasters ?? 0} icon="📡" color="red"    loading={loading} pulse hint="Live now" />
          <StatsCard label="High severity"    value={stats?.high_severity    ?? 0} icon="🔥" color="red"    loading={loading} hint="Needs review" />
        </div>
      </section>

      {/* MAP + ANALYTICS — left/right composition */}
      <section
        className="mt-16 py-16"
        style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-[1600px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4">
              <p className="text-xs uppercase tracking-[0.22em] text-textSecondary">Section 02</p>
              <h2 className="font-display text-display-md font-semibold mt-1 tracking-tight">
                Geo&shy;intelligence,<br />in one view.
              </h2>
              <p className="mt-5 text-textSecondary leading-relaxed">
                Every incident geo-tagged. Every nearby business scored. The map and analytics work as one layer — built for fast decisions.
              </p>
              <div className="mt-7 flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" style={{ color: 'var(--accent-brown)' }} />
                <span className="text-textSecondary">{businesses.length} mapped leads</span>
              </div>
            </div>

            <div className="lg:col-span-5 h-[460px]">
              <MapView disasters={disasters} businesses={businesses} />
            </div>

            <div className="lg:col-span-3 h-[460px]">
              <AnalyticsPanel stats={stats} businesses={businesses} loading={loading} />
            </div>
          </div>
        </div>
      </section>

      {/* RECENT INCIDENTS — editorial list */}
      <section className="max-w-[1600px] mx-auto px-6 md:px-10 mt-16 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <p className="text-xs uppercase tracking-[0.22em] text-textSecondary">Section 03</p>
            <h2 className="font-display text-display-md font-semibold mt-1 tracking-tight">Recent activity</h2>
            <p className="mt-5 text-textSecondary leading-relaxed">
              Newest events ingested by the scraper, ready for triage. Click an incident to open it in the pipeline.
            </p>
          </div>

          <div className="lg:col-span-8 card-luxe overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <p className="font-display text-lg font-semibold tracking-tight">Latest events</p>
              <span className="text-xs text-textSecondary">{(stats?.recent_disasters || []).length} shown</span>
            </div>
            <div>
              {loading ? (
                <div className="px-6 py-12 text-center text-textSecondary text-sm">Loading…</div>
              ) : (stats?.recent_disasters || []).length === 0 ? (
                <div className="px-6 py-12 text-center text-textSecondary text-sm">
                  No incidents yet. Press &quot;Auto Scrape&quot; to fetch from news.
                </div>
              ) : (stats?.recent_disasters || []).map((d: any) => (
                <div
                  key={d.id}
                  className="px-6 py-4 flex items-center justify-between transition-colors group"
                  style={{ borderBottom: '1px solid rgba(216, 199, 181, 0.5)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-2xl flex-shrink-0">
                      {({'fire':'🔥','earthquake':'🌍','flood':'🌊','explosion':'💥','storm':'🌪️','collapse':'🏚️','chemical':'☣️','other':'⚠️'} as Record<string,string>)[d.disaster_type] ?? '⚠️'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold line-clamp-1">{d.title}</p>
                      <p className="text-xs text-textSecondary mt-0.5">{[d.city, d.state].filter(Boolean).join(', ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className="text-xs text-textSecondary hidden sm:block">
                      {d.published_at ? new Date(d.published_at).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      }) : ''}
                    </span>
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                      style={
                        d.severity === 'Critical' ? { background: 'rgba(184, 77, 44, 0.14)', color: '#8A3618' } :
                        d.severity === 'High'     ? { background: 'rgba(201, 123, 63, 0.16)', color: '#8A4E1C' } :
                        d.severity === 'Medium'   ? { background: 'rgba(184, 146, 83, 0.18)', color: '#8B6A2E' } :
                                                    { background: 'rgba(122, 140, 92, 0.18)', color: '#506235' }
                      }
                    >
                      {d.severity}
                    </span>
                    <span className="text-xs text-textSecondary tabular-nums hidden md:inline">{d.leads_count ?? 0} leads</span>
                    <ArrowUpRight className="w-4 h-4 text-textMuted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
