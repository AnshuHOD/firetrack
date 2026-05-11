'use client';

import { useState } from 'react';
import { Trash2, Search as SearchIcon, RefreshCw, ExternalLink, Building2 } from 'lucide-react';
import DisasterBadge, { SeverityBadge } from './DisasterBadge';

interface Disaster {
  id: string;
  title: string;
  disaster_type: string;
  severity: string;
  status: string;
  city?: string;
  state?: string;
  published_at?: string;
  radius_km?: number;
  leads_count?: number;
  is_manual?: boolean;
  source_url?: string;
  businesses_searched?: boolean;
}

interface Props {
  disasters: Disaster[];
  onDelete: (id: string) => void;
  onSearchBusinesses: (id: string) => void;
  searching?: string | null;
}

const STATUS_STYLE: Record<string, { dot: string; text: string }> = {
  active:     { dot: '#B84D2C', text: '#8A3618' },
  monitoring: { dot: '#C97B3F', text: '#8A4E1C' },
  resolved:   { dot: '#7A8C5C', text: '#506235' },
};

const SELECT_CLASS =
  'bg-background border border-border rounded-full px-4 py-2 text-sm text-foreground focus:outline-none focus:border-accentBrown transition-colors';

export default function DisasterTable({ disasters, onDelete, onSearchBusinesses, searching }: Props) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const filtered = disasters.filter(d => {
    const q = search.toLowerCase();
    const matchQ = !q || d.title.toLowerCase().includes(q) || (d.city || '').toLowerCase().includes(q) || (d.state || '').toLowerCase().includes(q);
    const matchType = filterType === 'all' || d.disaster_type === filterType;
    const matchSev  = filterSeverity === 'all' || d.severity === filterSeverity;
    return matchQ && matchType && matchSev;
  });

  return (
    <div className="card-luxe overflow-hidden">
      <div
        className="p-5 flex flex-wrap gap-3 items-center"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
      >
        <div className="relative flex-1 min-w-[220px]">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search incidents…"
            className="w-full bg-background border border-border rounded-full pl-11 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-accentBrown transition-colors"
          />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className={SELECT_CLASS}>
          <option value="all">All types</option>
          {['fire','earthquake','flood','explosion','storm','collapse','chemical','tsunami','landslide','other'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className={SELECT_CLASS}>
          <option value="all">All severities</option>
          {['Critical','High','Medium','Low'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs text-textSecondary ml-auto">{filtered.length} events</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-textSecondary text-[11px] uppercase tracking-[0.14em]" style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left px-5 py-4 font-semibold">Incident</th>
              <th className="text-left px-5 py-4 font-semibold">Type</th>
              <th className="text-left px-5 py-4 font-semibold">Severity</th>
              <th className="text-left px-5 py-4 font-semibold">Location</th>
              <th className="text-left px-5 py-4 font-semibold">Status</th>
              <th className="text-left px-5 py-4 font-semibold">Leads</th>
              <th className="text-left px-5 py-4 font-semibold">Time</th>
              <th className="text-left px-5 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16 text-textSecondary">No events found</td>
              </tr>
            ) : filtered.map(d => {
              const sc = STATUS_STYLE[d.status];
              return (
                <tr
                  key={d.id}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid rgba(216, 199, 181, 0.5)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <td className="px-5 py-4 max-w-[300px]">
                    <p className="font-semibold text-foreground line-clamp-2 leading-snug">{d.title}</p>
                    {d.is_manual && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full mt-1.5 inline-block uppercase tracking-wider font-medium"
                        style={{ background: 'rgba(156, 107, 74, 0.14)', color: '#7A4A2E' }}
                      >
                        Manual
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4"><DisasterBadge type={d.disaster_type} size="sm" /></td>
                  <td className="px-5 py-4"><SeverityBadge severity={d.severity} /></td>
                  <td className="px-5 py-4 text-textSecondary text-xs">
                    {[d.city, d.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium capitalize" style={{ color: sc?.text || 'var(--text-secondary)' }}>
                      {sc && <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />}
                      {d.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 text-xs">
                      <Building2 className="w-3.5 h-3.5 text-textSecondary" />
                      <span className="tabular-nums font-medium">{d.leads_count ?? 0}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-textSecondary text-xs whitespace-nowrap">
                    {d.published_at ? new Date(d.published_at).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    }) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {!d.businesses_searched && (
                        <button
                          onClick={() => onSearchBusinesses(d.id)}
                          disabled={searching === d.id}
                          title="Search nearby businesses"
                          className="p-2 rounded-full transition-colors disabled:opacity-40"
                          style={{ background: 'rgba(156, 107, 74, 0.14)', color: '#7A4A2E' }}
                        >
                          {searching === d.id
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : <Building2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {d.source_url && d.source_url !== '#' && (
                        <a href={d.source_url} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-full transition-colors text-textSecondary hover:text-foreground"
                          style={{ background: 'var(--bg-primary)' }}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => onDelete(d.id)}
                        className="p-2 rounded-full transition-colors"
                        style={{ background: 'rgba(184, 77, 44, 0.10)', color: '#8A3618' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
