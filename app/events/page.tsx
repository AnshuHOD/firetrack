'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, RefreshCw, AlertTriangle, Sparkles } from 'lucide-react';
import AddDisasterModal from '@/components/AddDisasterModal';
import DisasterTable from '@/components/DisasterTable';
import Toast from '@/components/Toast';

const CONTAINER = 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10';

export default function EventsPage() {
  const [disasters, setDisasters]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [showModal, setShowModal]   = useState(false);
  const [searching, setSearching]   = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/disasters', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setDisasters(data.data);
      else throw new Error(data.error || 'Failed to load incidents');
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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event and all its leads?')) return;
    await fetch(`/api/disasters/${id}`, { method: 'DELETE' });
    setDisasters(prev => prev.filter(d => d.id !== id));
    setToast({ type: 'info', message: 'Event deleted.' });
  };

  const handleSearchBusinesses = async (id: string) => {
    setSearching(id);
    try {
      const res  = await fetch(`/api/disasters/${id}/search-businesses`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: `Found ${data.businessesSaved} businesses near this event.` });
        load();
      } else {
        setToast({ type: 'error', message: `Search failed: ${data.error}` });
      }
    } finally {
      setSearching(null);
    }
  };

  const handleScrape = async () => {
    setIsScraping(true);
    try {
      const res  = await fetch('/api/scrape');
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: `Scrape complete!\nProcessed: ${data.processed} incidents\nLeads saved: ${data.leadsSaved}` });
        load();
      } else {
        setToast({ type: 'error', message: `Scrape failed: ${data.error}` });
      }
    } finally {
      setIsScraping(false);
    }
  };

  const chips = [
    { label: 'Total',     val: disasters.length,                                        color: '#5A4636', bg: 'var(--bg-card)' },
    { label: 'Active',    val: disasters.filter(d => d.status === 'active').length,     color: '#8A3618', bg: 'rgba(184, 77, 44, 0.12)' },
    { label: 'Monitored', val: disasters.filter(d => d.status === 'monitoring').length, color: '#8A4E1C', bg: 'rgba(201, 123, 63, 0.14)' },
    { label: 'Resolved',  val: disasters.filter(d => d.status === 'resolved').length,   color: '#506235', bg: 'rgba(122, 140, 92, 0.16)' },
    { label: 'Manual',    val: disasters.filter(d => d.is_manual).length,               color: '#7A4A2E', bg: 'rgba(156, 107, 74, 0.14)' },
  ];

  return (
    <div className="flex flex-col w-full">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <section className="bg-grid-fade">
        <div className={`${CONTAINER} pt-10 sm:pt-14 lg:pt-20 pb-8 sm:pb-10`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-end">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-medium uppercase tracking-[0.18em] mb-5 sm:mb-6"
                style={{ background: 'var(--bg-card)', color: 'var(--accent-brown)', border: '1px solid var(--border)' }}>
                <Sparkles className="w-3.5 h-3.5" />
                Lead Pipeline
              </div>
              <h1 className="font-display font-semibold text-display-lg tracking-tighter">
                Manage events.<br />
                <span style={{ color: 'var(--accent-brown)' }}>Generate leads.</span>
              </h1>
              <p className="mt-4 sm:mt-5 text-base sm:text-lg text-textSecondary max-w-2xl leading-relaxed">
                Add incidents by hand or let the auto-scraper ingest from the news. Each event becomes a search ring for nearby business leads.
              </p>
            </div>
            <div className="lg:col-span-5 flex flex-wrap items-center gap-2.5 sm:gap-3 lg:justify-end">
              <button onClick={handleScrape} disabled={isScraping} className="btn-pill btn-secondary disabled:opacity-50 flex-1 sm:flex-initial">
                <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
                {isScraping ? 'Scraping…' : 'Auto Scrape'}
              </button>
              <button onClick={() => setShowModal(true)} className="btn-pill btn-primary flex-1 sm:flex-initial">
                <Plus className="w-4 h-4" />
                Add Event
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className={`${CONTAINER} pb-12 sm:pb-16 flex flex-col gap-6 sm:gap-8`}>
        {error && (
          <div className="flex items-start sm:items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl text-sm"
            style={{ background: 'rgba(184, 77, 44, 0.08)', border: '1px solid rgba(184, 77, 44, 0.25)', color: '#8A3618' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="flex-1 min-w-0 break-words">{error}</span>
            <button onClick={load} className="underline text-xs hover:no-underline flex-shrink-0">Retry</button>
          </div>
        )}

        {/* Chips — wrap freely on mobile */}
        <div className="flex gap-2 sm:gap-2.5 flex-wrap">
          {chips.map(c => (
            <span
              key={c.label}
              className="text-xs font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full inline-flex items-center gap-2"
              style={{ background: c.bg, color: c.color, border: '1px solid var(--border)' }}
            >
              {c.label}
              <span
                className="px-2 py-0.5 rounded-full tabular-nums text-[11px]"
                style={{ background: 'rgba(255,255,255,0.55)' }}
              >
                {c.val}
              </span>
            </span>
          ))}
        </div>

        {loading ? (
          <div className="card-luxe p-10 sm:p-16 text-center text-textSecondary text-sm">
            Loading events…
          </div>
        ) : (
          <DisasterTable
            disasters={disasters}
            onDelete={handleDelete}
            onSearchBusinesses={handleSearchBusinesses}
            searching={searching}
          />
        )}

        {showModal && (
          <AddDisasterModal
            onClose={() => setShowModal(false)}
            onCreated={() => { load(); }}
          />
        )}
      </div>
    </div>
  );
}
