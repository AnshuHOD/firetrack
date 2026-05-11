'use client';

import { useState } from 'react';
import {
  Search, Download, Phone, Mail, Globe, MapPin, StickyNote,
  ChevronDown, Trash2, SlidersHorizontal,
} from 'lucide-react';
import LeadStatusBadge, { ScoreBadge, LEAD_STATUSES } from './LeadStatusBadge';
import DisasterBadge from './DisasterBadge';

interface Business {
  id: string;
  business_name: string;
  category: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  distance_km?: number;
  lead_score: number;
  lead_status: string;
  notes?: string;
  disasters?: {
    title: string;
    disaster_type: string;
    city?: string;
    state?: string;
  };
}

interface Props {
  businesses: Business[];
  onStatusChange: (id: string, status: string) => void;
  onNoteSave: (id: string, note: string) => void;
  onExport: (format: 'csv' | 'excel' | 'json') => void;
  onDelete?: (ids: string[]) => void;
}

const SELECT_CLASS =
  'bg-background border border-border rounded-full px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-accentBrown transition-colors min-h-[44px]';

export default function BusinessLeadTable({
  businesses, onStatusChange, onNoteSave, onExport, onDelete,
}: Props) {
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType]   = useState('all');
  const [minScore, setMinScore]       = useState(0);
  const [sortBy, setSortBy]           = useState<'score' | 'distance' | 'name'>('score');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [copiedId, setCopiedId]       = useState<string | null>(null);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [noteText, setNoteText]       = useState('');
  const [showExport, setShowExport]   = useState(false);
  // Mobile: filters live behind a toggle to keep the toolbar tidy
  const [filtersOpen, setFiltersOpen] = useState(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(key);
      setTimeout(() => setCopiedId(null), 1500);
    }).catch(() => {});
  };

  const filtered = businesses
    .filter(b => {
      const q = search.toLowerCase();
      const matchQ = !q || b.business_name.toLowerCase().includes(q)
        || (b.category || '').toLowerCase().includes(q)
        || (b.address || '').toLowerCase().includes(q)
        || (b.disasters?.city || '').toLowerCase().includes(q);
      const matchStatus = filterStatus === 'all' || b.lead_status === filterStatus;
      const matchType   = filterType === 'all' || b.disasters?.disaster_type === filterType;
      const matchScore  = b.lead_score >= minScore;
      return matchQ && matchStatus && matchType && matchScore;
    })
    .sort((a, b) => {
      if (sortBy === 'score')    return b.lead_score - a.lead_score;
      if (sortBy === 'distance') return (a.distance_km ?? 99) - (b.distance_km ?? 99);
      return a.business_name.localeCompare(b.business_name);
    });

  const filteredIds = filtered.map(b => b.id);
  const allSelected = filtered.length > 0 && filtered.every(b => selected.has(b.id));
  const someSelected = selected.size > 0;

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!onDelete || selected.size === 0) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setConfirmDelete(false);
    setIsDeleting(true);
    onDelete(Array.from(selected));
    setSelected(new Set());
    setIsDeleting(false);
  };

  return (
    <div className="card-luxe overflow-hidden">
      {/* TOOLBAR — search + (mobile filter toggle) on top row, filters wrap below */}
      <div
        className="p-3 sm:p-5 flex flex-col gap-3"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
      >
        <div className="flex gap-2 sm:gap-3 items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search leads…"
              className="w-full bg-background border border-border rounded-full pl-11 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-accentBrown transition-colors min-h-[44px]"
            />
          </div>

          {/* Mobile filter toggle */}
          <button
            type="button"
            onClick={() => setFiltersOpen(v => !v)}
            aria-expanded={filtersOpen}
            aria-controls="lead-filters"
            className="sm:hidden touch-icon-btn flex-shrink-0"
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Desktop count */}
          <span className="hidden sm:inline text-xs text-textSecondary whitespace-nowrap">
            {filtered.length} leads
          </span>
        </div>

        {/* Filters row — always shown sm+; toggleable on mobile */}
        <div
          id="lead-filters"
          className={`${filtersOpen ? 'flex' : 'hidden'} sm:flex flex-wrap gap-2 sm:gap-3 items-stretch`}
        >
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`${SELECT_CLASS} flex-1 sm:flex-initial min-w-[140px]`}>
            <option value="all">All status</option>
            {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={filterType} onChange={e => setFilterType(e.target.value)} className={`${SELECT_CLASS} flex-1 sm:flex-initial min-w-[160px]`}>
            <option value="all">All event types</option>
            {['fire','earthquake','flood','explosion','storm','collapse','chemical','other'].map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>

          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className={`${SELECT_CLASS} flex-1 sm:flex-initial min-w-[140px]`}>
            <option value="score">Sort: Score</option>
            <option value="distance">Sort: Distance</option>
            <option value="name">Sort: Name</option>
          </select>

          <div className="flex items-center gap-2 text-xs text-textSecondary px-3 py-2 rounded-full w-full sm:w-auto"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', minHeight: 44 }}>
            <span className="whitespace-nowrap">Min score</span>
            <input type="range" min="0" max="80" step="10" value={minScore}
              onChange={e => setMinScore(parseInt(e.target.value))}
              className="flex-1 min-w-[80px]" style={{ accentColor: 'var(--accent-brown)' }}
            />
            <span className="font-semibold w-6 tabular-nums text-right" style={{ color: 'var(--accent-brown)' }}>{minScore}</span>
          </div>

          {/* Mobile count + export */}
          <span className="sm:hidden text-xs text-textSecondary self-center">
            {filtered.length} leads
          </span>
        </div>

        {/* Action row: bulk delete + export */}
        {(someSelected && onDelete) || true ? (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {someSelected && onDelete && (
              <>
                <span className="text-xs font-semibold">{selected.size} selected</span>
                <button onClick={() => { setSelected(new Set()); setConfirmDelete(false); }}
                  className="text-xs text-textSecondary hover:text-foreground underline">Clear</button>
                <button onClick={handleBulkDelete} disabled={isDeleting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all disabled:opacity-50 min-h-[40px]"
                  style={
                    confirmDelete
                      ? { background: '#8A3618', color: '#F5EFE6', boxShadow: '0 0 0 4px rgba(184, 77, 44, 0.25)' }
                      : { background: '#B84D2C', color: '#F5EFE6' }
                  }
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeleting ? 'Deleting…' : confirmDelete ? 'Confirm?' : `Delete (${selected.size})`}
                </button>
              </>
            )}

            <div className="relative ml-auto">
              <button onClick={() => setShowExport(!showExport)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[40px]"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
              >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showExport && (
                <div className="absolute right-0 top-full mt-2 rounded-2xl z-20 min-w-[150px] overflow-hidden shadow-soft-lg card-luxe">
                  {(['csv','excel','json'] as const).map(fmt => (
                    <button key={fmt} onClick={() => { onExport(fmt); setShowExport(false); }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-hoverBg transition-colors">
                      {fmt === 'csv' ? '📄 CSV' : fmt === 'excel' ? '📊 Excel' : '📋 JSON'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* MOBILE — card list (md:hidden) */}
      <div className="md:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center text-textSecondary text-sm">No leads found</div>
        ) : filtered.map(b => {
          const isSelected = selected.has(b.id);
          return (
            <article
              key={b.id}
              className="p-4 sm:p-5 transition-colors"
              style={{ background: isSelected ? 'rgba(156, 107, 74, 0.07)' : 'transparent' }}
            >
              <div className="flex items-start gap-3">
                {onDelete && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(b.id)}
                    className="mt-1 w-4 h-4 cursor-pointer flex-shrink-0"
                    style={{ accentColor: 'var(--accent-brown)' }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground break-words leading-snug">{b.business_name}</h3>
                  {b.address && (
                    <p className="text-xs text-textSecondary flex items-start gap-1 mt-1 break-words">
                      <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{b.address}</span>
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <ScoreBadge score={b.lead_score} />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-textSecondary">
                {b.disasters && <DisasterBadge type={b.disasters.disaster_type} size="sm" />}
                {b.distance_km != null && <span>· {b.distance_km} km</span>}
                {b.category && <span className="truncate">· {b.category}</span>}
              </div>

              {(b.phone || b.email || b.website) && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {b.phone && (
                    <button onClick={() => copyToClipboard(b.phone ?? '', `${b.id}-phone`)}
                      className="flex items-center gap-1.5 text-xs" style={{ color: '#506235' }}>
                      <Phone className="w-3.5 h-3.5" />
                      {copiedId === `${b.id}-phone` ? <span className="font-semibold">Copied!</span> : b.phone}
                    </button>
                  )}
                  {b.email && (
                    <button onClick={() => copyToClipboard(b.email ?? '', `${b.id}-email`)}
                      className="flex items-center gap-1.5 text-xs min-w-0" style={{ color: '#7A4A2E' }}>
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      {copiedId === `${b.id}-email` ? <span className="font-semibold">Copied!</span> : <span className="truncate">{b.email}</span>}
                    </button>
                  )}
                  {b.website && (
                    <a href={b.website.startsWith('http') ? b.website : `https://${b.website}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-textSecondary">
                      <Globe className="w-3.5 h-3.5" />Website
                    </a>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <select
                  value={b.lead_status}
                  onChange={e => onStatusChange(b.id, e.target.value)}
                  className="flex-1 bg-background border border-border rounded-full px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accentBrown cursor-pointer transition-colors min-h-[40px]"
                >
                  {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                {editingNote === b.id ? (
                  <div className="flex-1 flex flex-col gap-1.5">
                    <textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      rows={2}
                      className="w-full bg-background rounded-xl px-2.5 py-1.5 text-xs text-foreground resize-none focus:outline-none"
                      style={{ border: '1px solid var(--accent-brown)' }}
                      autoFocus
                    />
                    <div className="flex gap-1.5">
                      <button onClick={() => { onNoteSave(b.id, noteText); setEditingNote(null); }}
                        className="text-xs px-3 py-1.5 rounded-full font-medium"
                        style={{ background: 'var(--btn-bg)', color: '#F5EFE6' }}>Save</button>
                      <button onClick={() => setEditingNote(null)}
                        className="text-xs text-textSecondary px-2">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setEditingNote(b.id); setNoteText(b.notes || ''); }}
                    className="touch-icon-btn flex-shrink-0"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                    aria-label="Note"
                  >
                    <StickyNote className="w-4 h-4" />
                    {b.notes && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: '#C97B3F' }} />
                    )}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* DESKTOP — table (md+) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-textSecondary text-[11px] uppercase tracking-[0.14em]" style={{ borderBottom: '1px solid var(--border)' }}>
              {onDelete && (
                <th className="px-4 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 cursor-pointer"
                    style={{ accentColor: 'var(--accent-brown)' }}
                    title="Select all"
                  />
                </th>
              )}
              <th className="text-left px-5 py-4 font-semibold">Business</th>
              <th className="text-left px-5 py-4 font-semibold">Category</th>
              <th className="text-left px-5 py-4 font-semibold">Event</th>
              <th className="text-left px-5 py-4 font-semibold">Distance</th>
              <th className="text-left px-5 py-4 font-semibold">Score</th>
              <th className="text-left px-5 py-4 font-semibold">Contact</th>
              <th className="text-left px-5 py-4 font-semibold">Status</th>
              <th className="text-left px-5 py-4 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={onDelete ? 9 : 8} className="text-center py-16 text-textSecondary">No leads found</td>
              </tr>
            ) : filtered.map(b => {
              const isSelected = selected.has(b.id);
              return (
                <tr key={b.id}
                  className="transition-colors group"
                  style={{
                    borderBottom: '1px solid rgba(216, 199, 181, 0.5)',
                    background: isSelected ? 'rgba(156, 107, 74, 0.07)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  {onDelete && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(b.id)}
                        className="w-3.5 h-3.5 cursor-pointer"
                        style={{ accentColor: 'var(--accent-brown)' }}
                      />
                    </td>
                  )}

                  <td className="px-5 py-4 max-w-[240px]">
                    <p className="font-semibold text-foreground line-clamp-1">{b.business_name}</p>
                    {b.address && (
                      <p className="text-xs text-textSecondary flex items-center gap-1 mt-0.5 line-clamp-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />{b.address}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4 text-xs text-textSecondary max-w-[140px]">
                    <span className="line-clamp-2">{b.category || '—'}</span>
                  </td>

                  <td className="px-5 py-4">
                    {b.disasters ? (
                      <div>
                        <DisasterBadge type={b.disasters.disaster_type} size="sm" />
                        <p className="text-xs text-textSecondary mt-1 line-clamp-1">
                          {[b.disasters.city, b.disasters.state].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    ) : '—'}
                  </td>

                  <td className="px-5 py-4 text-xs text-textSecondary whitespace-nowrap">
                    {b.distance_km != null ? `${b.distance_km} km` : '—'}
                  </td>

                  <td className="px-5 py-4"><ScoreBadge score={b.lead_score} /></td>

                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      {b.phone && (
                        <button onClick={() => copyToClipboard(b.phone ?? '', `${b.id}-phone`)}
                          aria-label="Copy phone number"
                          className="flex items-center gap-1.5 text-xs transition-colors text-left"
                          style={{ color: '#506235' }}
                        >
                          <Phone className="w-3 h-3" />
                          {copiedId === `${b.id}-phone` ? <span className="font-semibold">Copied!</span> : b.phone}
                        </button>
                      )}
                      {b.email && (
                        <button onClick={() => copyToClipboard(b.email ?? '', `${b.id}-email`)}
                          aria-label="Copy email address"
                          className="flex items-center gap-1.5 text-xs transition-colors text-left"
                          style={{ color: '#7A4A2E' }}
                        >
                          <Mail className="w-3 h-3" />
                          {copiedId === `${b.id}-email` ? <span className="font-semibold">Copied!</span> : `${b.email.slice(0, 22)}${b.email.length > 22 ? '…' : ''}`}
                        </button>
                      )}
                      {b.website && (
                        <a href={b.website.startsWith('http') ? b.website : `https://${b.website}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-textSecondary hover:text-foreground transition-colors">
                          <Globe className="w-3 h-3" />Website
                        </a>
                      )}
                      {!b.phone && !b.email && !b.website && <span className="text-xs text-textSecondary">—</span>}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <select
                      value={b.lead_status}
                      onChange={e => onStatusChange(b.id, e.target.value)}
                      className="bg-background border border-border rounded-full px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-accentBrown cursor-pointer transition-colors"
                    >
                      {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>

                  <td className="px-5 py-4">
                    {editingNote === b.id ? (
                      <div className="flex flex-col gap-1.5">
                        <textarea
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                          rows={2}
                          className="w-40 bg-background rounded-xl px-2.5 py-1.5 text-xs text-foreground resize-none focus:outline-none"
                          style={{ border: '1px solid var(--accent-brown)' }}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button onClick={() => { onNoteSave(b.id, noteText); setEditingNote(null); }}
                            className="text-xs px-3 py-1 rounded-full font-medium"
                            style={{ background: 'var(--btn-bg)', color: '#F5EFE6' }}>Save</button>
                          <button onClick={() => setEditingNote(null)}
                            className="text-xs text-textSecondary hover:text-foreground px-2">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingNote(b.id); setNoteText(b.notes || ''); }}
                        className="text-textSecondary hover:text-foreground transition-colors flex flex-col items-start"
                        title={b.notes || 'Add note'}>
                        <StickyNote className="w-4 h-4" />
                        {b.notes && (
                          <span className="text-[10px] mt-0.5 uppercase tracking-wider" style={{ color: '#C97B3F' }}>
                            Has note
                          </span>
                        )}
                      </button>
                    )}
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
