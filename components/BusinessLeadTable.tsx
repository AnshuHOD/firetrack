'use client';

import { useState } from 'react';
import { Search, Download, Phone, Mail, Globe, MapPin, StickyNote, ChevronDown, Trash2 } from 'lucide-react';
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

export default function BusinessLeadTable({ businesses, onStatusChange, onNoteSave, onExport, onDelete }: Props) {
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

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(key);
      setTimeout(() => setCopiedId(null), 1500);
    }).catch(() => {});
  };
  const [noteText, setNoteText]       = useState('');
  const [showExport, setShowExport]   = useState(false);

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
      setTimeout(() => setConfirmDelete(false), 3000); // reset after 3s if not clicked
      return;
    }
    setConfirmDelete(false);
    setIsDeleting(true);
    onDelete(Array.from(selected));
    setSelected(new Set());
    setIsDeleting(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden relative">
      {/* Toolbar */}
      <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search businesses..."
            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-accentBlue" />
        </div>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accentBlue">
          <option value="all">All Status</option>
          {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accentBlue">
          <option value="all">All Types</option>
          {['fire','earthquake','flood','explosion','storm','collapse','chemical','other'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>

        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accentBlue">
          <option value="score">Sort: Score</option>
          <option value="distance">Sort: Distance</option>
          <option value="name">Sort: Name</option>
        </select>

        <div className="flex items-center gap-2 text-xs text-textSecondary">
          <span>Min Score:</span>
          <input type="range" min="0" max="80" step="10" value={minScore}
            onChange={e => setMinScore(parseInt(e.target.value))}
            className="w-20 accent-accentBlue" />
          <span className="text-accentBlue font-semibold w-6">{minScore}</span>
        </div>

        {/* Selection actions — appears inline when items selected */}
        {someSelected && onDelete ? (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-medium text-foreground">{selected.size} selected</span>
            <button onClick={() => { setSelected(new Set()); setConfirmDelete(false); }}
              className="text-xs text-textSecondary hover:text-foreground underline">Clear</button>
            <button onClick={handleBulkDelete} disabled={isDeleting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                confirmDelete
                  ? 'bg-red-600 text-white ring-2 ring-red-400/50 animate-pulse'
                  : 'bg-accentRed text-white hover:bg-red-600'
              }`}>
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? 'Deleting...' : confirmDelete ? 'Confirm Delete?' : `Delete (${selected.size})`}
            </button>
          </div>
        ) : (
          <span className="text-xs text-textSecondary ml-auto">{filtered.length} leads</span>
        )}

        {/* Export dropdown */}
        <div className="relative">
          <button onClick={() => setShowExport(!showExport)}
            className="flex items-center gap-1.5 bg-accentGreen/10 text-accentGreen px-3 py-2 rounded-lg text-sm font-medium hover:bg-accentGreen/20 transition-colors">
            <Download className="w-4 h-4" />
            Export
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {showExport && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-20 min-w-[130px] overflow-hidden">
              {(['csv','excel','json'] as const).map(fmt => (
                <button key={fmt} onClick={() => { onExport(fmt); setShowExport(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-background transition-colors">
                  {fmt === 'csv' ? '📄 CSV' : fmt === 'excel' ? '📊 Excel' : '📋 JSON'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-textSecondary text-xs uppercase tracking-wider">
              {onDelete && (
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="accent-accentBlue w-3.5 h-3.5 cursor-pointer"
                    title="Select all"
                  />
                </th>
              )}
              <th className="text-left px-4 py-3 font-medium">Business</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Disaster</th>
              <th className="text-left px-4 py-3 font-medium">Distance</th>
              <th className="text-left px-4 py-3 font-medium">Score</th>
              <th className="text-left px-4 py-3 font-medium">Contact</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={onDelete ? 9 : 8} className="text-center py-12 text-textSecondary">No leads found</td>
              </tr>
            ) : filtered.map(b => {
              const isSelected = selected.has(b.id);
              return (
                <tr key={b.id}
                  className={`border-b border-border/50 transition-colors group ${
                    isSelected
                      ? 'bg-accentBlue/5 hover:bg-accentBlue/10'
                      : 'hover:bg-background/40'
                  }`}
                >
                  {/* Checkbox */}
                  {onDelete && (
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(b.id)}
                        className="accent-accentBlue w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>
                  )}

                  {/* Business */}
                  <td className="px-4 py-3 max-w-[220px]">
                    <p className="font-semibold text-foreground line-clamp-1">{b.business_name}</p>
                    {b.address && (
                      <p className="text-xs text-textSecondary flex items-center gap-1 mt-0.5 line-clamp-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />{b.address}
                      </p>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 text-xs text-textSecondary max-w-[130px]">
                    <span className="line-clamp-2">{b.category || '—'}</span>
                  </td>

                  {/* Disaster */}
                  <td className="px-4 py-3">
                    {b.disasters ? (
                      <div>
                        <DisasterBadge type={b.disasters.disaster_type} size="sm" />
                        <p className="text-xs text-textSecondary mt-0.5 line-clamp-1">
                          {[b.disasters.city, b.disasters.state].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    ) : '—'}
                  </td>

                  {/* Distance */}
                  <td className="px-4 py-3 text-xs text-textSecondary whitespace-nowrap">
                    {b.distance_km != null ? `${b.distance_km} km` : '—'}
                  </td>

                  {/* Score */}
                  <td className="px-4 py-3"><ScoreBadge score={b.lead_score} /></td>

                  {/* Contact */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {b.phone && (
                        <button onClick={() => copyToClipboard(b.phone ?? '', `${b.id}-phone`)}
                          aria-label="Copy phone number"
                          className="flex items-center gap-1.5 text-xs text-accentGreen hover:text-green-400 transition-colors text-left">
                          <Phone className="w-3 h-3" />
                          {copiedId === `${b.id}-phone` ? <span className="text-accentGreen font-semibold">Copied!</span> : b.phone}
                        </button>
                      )}
                      {b.email && (
                        <button onClick={() => copyToClipboard(b.email ?? '', `${b.id}-email`)}
                          aria-label="Copy email address"
                          className="flex items-center gap-1.5 text-xs text-accentBlue hover:text-blue-400 transition-colors text-left">
                          <Mail className="w-3 h-3" />
                          {copiedId === `${b.id}-email` ? <span className="text-accentBlue font-semibold">Copied!</span> : `${b.email.slice(0, 22)}${b.email.length > 22 ? '…' : ''}`}
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

                  {/* Status */}
                  <td className="px-4 py-3">
                    <select
                      value={b.lead_status}
                      onChange={e => onStatusChange(b.id, e.target.value)}
                      className="bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-accentBlue cursor-pointer"
                    >
                      {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>

                  {/* Notes */}
                  <td className="px-4 py-3">
                    {editingNote === b.id ? (
                      <div className="flex flex-col gap-1">
                        <textarea
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                          rows={2}
                          className="w-36 bg-background border border-accentBlue rounded px-2 py-1 text-xs text-foreground resize-none focus:outline-none"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button onClick={() => { onNoteSave(b.id, noteText); setEditingNote(null); }}
                            className="text-xs bg-accentBlue text-white px-2 py-0.5 rounded">Save</button>
                          <button onClick={() => setEditingNote(null)}
                            className="text-xs text-textSecondary hover:text-foreground px-1">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingNote(b.id); setNoteText(b.notes || ''); }}
                        className="text-textSecondary hover:text-foreground transition-colors"
                        title={b.notes || 'Add note'}>
                        <StickyNote className="w-4 h-4" />
                        {b.notes && <span className="block text-xs text-accentOrange mt-0.5">Has note</span>}
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
