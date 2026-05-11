'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import BusinessLeadTable from '@/components/BusinessLeadTable';
import Toast from '@/components/Toast';

const CONTAINER = 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10';

export default function LeadsPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [toast, setToast]           = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/businesses?limit=500', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setBusinesses(data.data);
      else throw new Error(data.error || 'Failed to load leads');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const handleStatusChange = async (id: string, status: string) => {
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, lead_status: status } : b));
    await fetch(`/api/businesses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_status: status }),
    });
  };

  const handleNoteSave = async (id: string, notes: string) => {
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, notes } : b));
    await fetch(`/api/businesses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
  };

  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    window.open(`/api/export?format=${format}`, '_blank');
  };

  const handleDelete = async (ids: string[]) => {
    try {
      const res = await fetch('/api/businesses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (data.success) {
        setBusinesses(prev => prev.filter(b => !ids.includes(b.id)));
        setToast({ type: 'success', message: `Deleted ${data.deleted} lead${data.deleted > 1 ? 's' : ''}.` });
      } else {
        setToast({ type: 'error', message: `Delete failed: ${data.error}` });
      }
    } catch {
      setToast({ type: 'error', message: 'Failed to delete leads.' });
    }
  };

  const total     = businesses.length;
  const newLeads  = businesses.filter(b => b.lead_status === 'New').length;
  const contacted = businesses.filter(b => b.lead_status === 'Contacted').length;
  const converted = businesses.filter(b => b.lead_status === 'Converted').length;
  const highScore = businesses.filter(b => b.lead_score >= 70).length;

  const pipeline = [
    { label: 'Total leads', val: total,     accent: 'var(--accent-brown)',  tint: 'rgba(156, 107, 74, 0.12)' },
    { label: 'New',         val: newLeads,  accent: '#9C6B4A',              tint: 'rgba(156, 107, 74, 0.12)' },
    { label: 'Contacted',   val: contacted, accent: '#B89253',              tint: 'rgba(184, 146, 83, 0.16)' },
    { label: 'Converted',   val: converted, accent: '#7A8C5C',              tint: 'rgba(122, 140, 92, 0.18)' },
    { label: 'Score ≥ 70',  val: highScore, accent: '#B84D2C',              tint: 'rgba(184, 77, 44, 0.12)' },
  ];

  return (
    <div className="flex flex-col w-full">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      {/* HERO */}
      <section className="bg-grid-fade">
        <div className={`${CONTAINER} pt-10 sm:pt-14 lg:pt-20 pb-8 sm:pb-10`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-end">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-medium uppercase tracking-[0.18em] mb-5 sm:mb-6"
                style={{ background: 'var(--bg-card)', color: 'var(--accent-brown)', border: '1px solid var(--border)' }}>
                <Sparkles className="w-3.5 h-3.5" />
                Lead Cards
              </div>
              <h1 className="font-display font-semibold text-display-lg tracking-tighter">
                Every lead.<br />
                <span style={{ color: 'var(--accent-brown)' }}>Ranked by impact.</span>
              </h1>
              <p className="mt-4 sm:mt-5 text-base sm:text-lg text-textSecondary max-w-2xl leading-relaxed">
                Businesses identified inside affected zones — sorted by lead score, contact readiness, and proximity to the incident.
              </p>
            </div>
            <div className="lg:col-span-5 text-sm text-textSecondary">
              <p>One workspace. Every workflow — score, segment, contact, convert.</p>
            </div>
          </div>
        </div>
      </section>

      <div className={`${CONTAINER} pb-12 sm:pb-16 flex flex-col gap-6 sm:gap-8`}>
        {error && (
          <div
            className="flex items-start sm:items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl text-sm"
            style={{ background: 'rgba(184, 77, 44, 0.08)', border: '1px solid rgba(184, 77, 44, 0.25)', color: '#8A3618' }}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="flex-1 min-w-0 break-words">{error}</span>
            <button onClick={load} className="underline text-xs hover:no-underline flex-shrink-0">Retry</button>
          </div>
        )}

        {/* Pipeline snapshot — 2 cols mobile, 3 cols sm, 5 cols xl */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {pipeline.map(c => (
            <div key={c.label} className="card-luxe p-4 sm:p-5 hover-lift relative overflow-hidden">
              <div
                className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none"
                style={{ background: c.tint, filter: 'blur(8px)' }}
              />
              <p className="text-[10px] uppercase tracking-[0.16em] sm:tracking-[0.18em] text-textSecondary font-medium relative">{c.label}</p>
              <p
                className="font-display font-semibold mt-2 tabular-nums relative"
                style={{ color: c.accent, fontSize: 'clamp(1.75rem, 5vw, 2.5rem)' }}
              >
                {loading ? '—' : c.val}
              </p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="card-luxe p-10 sm:p-16 text-center text-textSecondary text-sm">
            Loading leads…
          </div>
        ) : (
          <BusinessLeadTable
            businesses={businesses}
            onStatusChange={handleStatusChange}
            onNoteSave={handleNoteSave}
            onExport={handleExport}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
