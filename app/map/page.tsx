'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import DisasterBadge, { SeverityBadge } from '@/components/DisasterBadge';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-card border border-border rounded-xl flex items-center justify-center text-textSecondary text-sm">
      Loading map...
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
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 96px)' }}>
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Map View</h1>
        <p className="text-sm text-textSecondary mt-0.5">Visualize disaster zones and nearby business leads</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 bg-accentRed/10 border border-accentRed/30 text-accentRed px-4 py-3 rounded-xl text-sm flex-shrink-0">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mobile: compact disaster select */}
      <div className="md:hidden flex-shrink-0">
        <select
          value={selectedId ?? ''}
          onChange={e => setSelectedId(e.target.value || null)}
          className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-accentBlue"
        >
          <option value="">All Incidents ({businesses.length} leads)</option>
          {disasters.map(d => (
            <option key={d.id} value={d.id}>
              {d.title.slice(0, 50)} — {d.severity}
            </option>
          ))}
        </select>
      </div>

      {/* Main layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Sidebar — hidden on mobile */}
        <div className="hidden md:flex w-72 flex-shrink-0 bg-card border border-border rounded-xl overflow-hidden flex-col">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider">
              Incidents ({disasters.length})
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            <button
              onClick={() => setSelectedId(null)}
              className={`w-full text-left px-4 py-3 hover:bg-background/60 transition-colors ${!selectedId ? 'bg-accentBlue/10 border-l-2 border-accentBlue' : ''}`}
            >
              <p className="text-sm font-medium">All Incidents</p>
              <p className="text-xs text-textSecondary">{businesses.length} total leads</p>
            </button>

            {loading ? (
              <div className="px-4 py-6 text-center text-textSecondary text-xs">Loading...</div>
            ) : disasters.map(d => {
              const bizCount  = businesses.filter(b => b.disaster_id === d.id).length;
              const isSelected = selectedId === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(isSelected ? null : d.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-background/60 transition-colors ${isSelected ? 'bg-accentBlue/10 border-l-2 border-accentBlue' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <DisasterBadge type={d.disaster_type} size="sm" />
                    <SeverityBadge severity={d.severity} />
                  </div>
                  <p className="text-xs font-medium line-clamp-2 leading-snug mb-1">{d.title}</p>
                  <p className="text-xs text-textSecondary">{[d.city, d.state].filter(Boolean).join(', ')}</p>
                  <p className="text-xs text-textSecondary mt-0.5">
                    📍 {d.radius_km || 2} km · {bizCount} leads
                    {!d.latitude && <span className="text-accentOrange ml-1">· no coords</span>}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-4 py-3 border-t border-border flex-shrink-0">
            <p className="text-xs font-semibold text-textSecondary mb-2">Lead Score</p>
            <div className="space-y-1.5">
              {[
                { label: '≥80 — Very High', color: 'bg-red-400' },
                { label: '60–79 — High',    color: 'bg-orange-400' },
                { label: '40–59 — Medium',  color: 'bg-yellow-400' },
                { label: '<40 — Low',       color: 'bg-green-400' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2 text-xs text-textSecondary">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${l.color}`} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 min-w-0 min-h-0">
          <MapView
            disasters={disasters}
            businesses={filteredBusinesses}
            selectedDisasterId={selectedId}
          />
        </div>
      </div>

      {/* Selected info bar */}
      {selected && (
        <div className="bg-card border border-border rounded-xl px-5 py-3 flex items-center gap-4 flex-wrap flex-shrink-0">
          <DisasterBadge type={selected.disaster_type} />
          <p className="text-sm font-medium line-clamp-1">{selected.title}</p>
          <SeverityBadge severity={selected.severity} />
          {selected.latitude && (
            <span className="text-xs text-textSecondary hidden sm:inline">
              {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
            </span>
          )}
          <span className="text-xs text-textSecondary ml-auto">
            {filteredBusinesses.length} businesses · {selected.radius_km || 2} km radius
          </span>
        </div>
      )}
    </div>
  );
}
