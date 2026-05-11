'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';
import DisasterBadge, { SeverityBadge } from '@/components/DisasterBadge';

const CONTAINER = 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10';

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

export default function MapPage() {
  const [disasters, setDisasters]   = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const loadMap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, b] = await Promise.all([
        fetch('/api/disasters', { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/businesses?limit=500', { cache: 'no-store' }).then(r => r.json()),
      ]);
      if (d.success) setDisasters(d.data);
      else throw new Error(d.error || 'Failed to load disasters');
      if (b.success) setBusinesses(b.data);
      else throw new Error(b.error || 'Failed to load businesses');
    } catch (err: any) {
      setError(err.message || 'Failed to load map data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMap();
    const onFocus = () => loadMap();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadMap]);

  const selected = disasters.find(d => d.id === selectedId);
  const filteredBusinesses = selectedId
    ? businesses.filter(b => b.disaster_id === selectedId)
    : businesses;

  return (
    <div className="flex flex-col w-full">
      <section className="bg-grid-fade">
        <div className={`${CONTAINER} pt-8 sm:pt-10 pb-5 sm:pb-6`}>
          <div className="flex items-end justify-between flex-wrap gap-3 sm:gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-medium uppercase tracking-[0.18em] mb-3 sm:mb-4"
                style={{ background: 'var(--bg-card)', color: 'var(--accent-brown)', border: '1px solid var(--border)' }}>
                <Sparkles className="w-3.5 h-3.5" />
                Geospatial
              </div>
              <h1 className="font-display font-semibold text-display-md tracking-tighter">
                Map your <span style={{ color: 'var(--accent-brown)' }}>territory</span>.
              </h1>
            </div>
            <div className="text-xs sm:text-sm text-textSecondary">
              {filteredBusinesses.length} pins · {disasters.length} events
            </div>
          </div>
        </div>
      </section>

      <div className={`${CONTAINER} pb-8 sm:pb-10 flex flex-col gap-4`}>
        {error && (
          <div className="flex items-start sm:items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl text-sm"
            style={{ background: 'rgba(184, 77, 44, 0.08)', border: '1px solid rgba(184, 77, 44, 0.25)', color: '#8A3618' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="flex-1 min-w-0 break-words">{error}</span>
          </div>
        )}

        {/* Mobile: event picker dropdown replaces sidebar */}
        <div className="md:hidden">
          <select
            value={selectedId ?? ''}
            onChange={e => setSelectedId(e.target.value || null)}
            className="w-full bg-card border border-border rounded-full px-5 py-3 text-sm text-foreground focus:outline-none focus:border-accentBrown transition-colors min-h-[44px]"
          >
            <option value="">All events ({businesses.length} leads)</option>
            {disasters.map(d => (
              <option key={d.id} value={d.id}>
                {d.title.slice(0, 50)} — {d.severity}
              </option>
            ))}
          </select>
        </div>

        {/* Map + sidebar — sidebar hidden on mobile, height shrinks on small screens */}
        <div className="flex flex-col md:flex-row gap-4 sm:gap-5 w-full" style={{ minHeight: 460 }}>
          <aside className="hidden md:flex md:w-72 lg:w-80 flex-shrink-0 card-luxe overflow-hidden flex-col" style={{ height: '72vh', minHeight: 620 }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <p className="text-[11px] font-semibold text-textSecondary uppercase tracking-[0.18em]">
                Events <span className="text-textMuted">· {disasters.length}</span>
              </p>
            </div>

            <div className="flex-1 overflow-y-auto scroll-warm">
              <button
                onClick={() => setSelectedId(null)}
                className="w-full text-left px-5 py-4 transition-colors"
                style={
                  !selectedId
                    ? { background: 'var(--bg-hover)', borderLeft: '3px solid var(--accent-brown)' }
                    : { borderBottom: '1px solid rgba(216, 199, 181, 0.4)' }
                }
              >
                <p className="text-sm font-semibold">All events</p>
                <p className="text-xs text-textSecondary mt-0.5">{businesses.length} total leads</p>
              </button>

              {loading ? (
                <div className="px-5 py-8 text-center text-textSecondary text-xs">Loading…</div>
              ) : disasters.map(d => {
                const bizCount  = businesses.filter(b => b.disaster_id === d.id).length;
                const isSelected = selectedId === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedId(isSelected ? null : d.id)}
                    className="w-full text-left px-5 py-4 transition-colors"
                    style={
                      isSelected
                        ? { background: 'var(--bg-hover)', borderLeft: '3px solid var(--accent-brown)' }
                        : { borderBottom: '1px solid rgba(216, 199, 181, 0.4)' }
                    }
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <DisasterBadge type={d.disaster_type} size="sm" />
                      <SeverityBadge severity={d.severity} />
                    </div>
                    <p className="text-xs font-semibold line-clamp-2 leading-snug">{d.title}</p>
                    <p className="text-xs text-textSecondary mt-1">{[d.city, d.state].filter(Boolean).join(', ')}</p>
                    <p className="text-xs text-textSecondary mt-0.5">
                      <span style={{ color: 'var(--accent-brown)' }}>●</span> {d.radius_km || 2} km · {bizCount} leads
                      {!d.latitude && <span className="ml-1.5" style={{ color: 'var(--accent-orange)' }}>· no coords</span>}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <p className="text-[11px] font-semibold text-textSecondary uppercase tracking-[0.18em] mb-2.5">Lead Score</p>
              <div className="space-y-1.5">
                {[
                  { label: '≥ 80 — Very High', color: '#B84D2C' },
                  { label: '60–79 — High',     color: '#C97B3F' },
                  { label: '40–59 — Medium',   color: '#B89253' },
                  { label: '< 40 — Low',       color: '#7A8C5C' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2 text-xs text-textSecondary">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Map — full width mobile, fills remaining desktop */}
          <div
            className="flex-1 min-w-0 relative"
            style={{ height: 'clamp(420px, 65vh, 720px)' }}
          >
            <div className="absolute inset-0">
              <MapView
                disasters={disasters}
                businesses={filteredBusinesses}
                selectedDisasterId={selectedId}
              />
            </div>
          </div>
        </div>

        {selected && (
          <div className="card-luxe px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 flex-wrap">
            <DisasterBadge type={selected.disaster_type} />
            <p className="text-sm font-semibold line-clamp-1 flex-1 min-w-0 break-words">{selected.title}</p>
            <SeverityBadge severity={selected.severity} />
            {selected.latitude && (
              <span className="text-xs text-textSecondary hidden sm:inline tabular-nums">
                {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
              </span>
            )}
            <span className="text-xs text-textSecondary w-full sm:w-auto sm:ml-auto">
              {filteredBusinesses.length} businesses · {selected.radius_km || 2} km radius
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
