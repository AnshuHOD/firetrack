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

const STATUS_COLORS: Record<string, string> = {
  active:     'text-accentRed',
  monitoring: 'text-accentOrange',
  resolved:   'text-accentGreen',
};

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
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search incidents..."
            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-accentBlue"
          />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accentBlue">
          <option value="all">All Types</option>
          {['fire','earthquake','flood','explosion','storm','collapse','chemical','tsunami','landslide','other'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accentBlue">
          <option value="all">All Severities</option>
          {['Critical','High','Medium','Low'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs text-textSecondary ml-auto">{filtered.length} events</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-textSecondary text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-medium">Incident</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Severity</th>
              <th className="text-left px-4 py-3 font-medium">Location</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Leads</th>
              <th className="text-left px-4 py-3 font-medium">Time</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-textSecondary">
                  No disasters found
                </td>
              </tr>
            ) : filtered.map(d => (
              <tr key={d.id} className="border-b border-border/50 hover:bg-background/50 transition-colors">
                <td className="px-4 py-3 max-w-[280px]">
                  <p className="font-medium text-foreground line-clamp-2 leading-snug">{d.title}</p>
                  {d.is_manual && (
                    <span className="text-xs bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded mt-1 inline-block">Manual</span>
                  )}
                </td>
                <td className="px-4 py-3"><DisasterBadge type={d.disaster_type} size="sm" /></td>
                <td className="px-4 py-3"><SeverityBadge severity={d.severity} /></td>
                <td className="px-4 py-3 text-textSecondary text-xs">
                  {[d.city, d.state].filter(Boolean).join(', ') || '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium capitalize ${STATUS_COLORS[d.status] || 'text-textSecondary'}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-xs">
                    <Building2 className="w-3.5 h-3.5 text-textSecondary" />
                    {d.leads_count ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-textSecondary text-xs whitespace-nowrap">
                  {d.published_at ? new Date(d.published_at).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  }) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {!d.businesses_searched && (
                      <button
                        onClick={() => onSearchBusinesses(d.id)}
                        disabled={searching === d.id}
                        title="Search nearby businesses"
                        className="p-1.5 rounded-lg bg-accentBlue/10 text-accentBlue hover:bg-accentBlue/20 disabled:opacity-40 transition-colors"
                      >
                        {searching === d.id
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <Building2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {d.source_url && d.source_url !== '#' && (
                      <a href={d.source_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-border/50 text-textSecondary hover:text-foreground transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => onDelete(d.id)}
                      className="p-1.5 rounded-lg bg-accentRed/10 text-accentRed hover:bg-accentRed/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
