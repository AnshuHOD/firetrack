'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import AddDisasterModal from '@/components/AddDisasterModal';
import DisasterTable from '@/components/DisasterTable';
import Toast from '@/components/Toast';

export default function EventsPage() {
  const [disasters, setDisasters]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [showModal, setShowModal]   = useState(false);
  const [searching, setSearching]   = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/disasters');
      const data = await res.json();
      if (data.success) setDisasters(data.data);
      else throw new Error(data.error || 'Failed to load incidents');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this disaster and all its leads?')) return;
    await fetch(`/api/disasters/${id}`, { method: 'DELETE' });
    setDisasters(prev => prev.filter(d => d.id !== id));
    setToast({ type: 'info', message: 'Incident deleted.' });
  };

  const handleSearchBusinesses = async (id: string) => {
    setSearching(id);
    try {
      const res  = await fetch(`/api/disasters/${id}/search-businesses`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: `Found ${data.businessesSaved} businesses near this incident.` });
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

  return (
    <div className="flex flex-col gap-6">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Event Management</h1>
          <p className="text-sm text-textSecondary mt-0.5">Manage disaster incidents — add manually or auto-scrape from news</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleScrape} disabled={isScraping}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border transition-all ${
              isScraping ? 'text-textSecondary cursor-not-allowed' : 'text-foreground hover:bg-background'
            }`}>
            <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
            {isScraping ? 'Scraping...' : 'Auto Scrape'}
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-accentBlue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors shadow-lg shadow-accentBlue/20">
            <Plus className="w-4 h-4" />
            Add Incident
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 bg-accentRed/10 border border-accentRed/30 text-accentRed px-4 py-3 rounded-xl text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={load} className="ml-auto underline text-xs hover:no-underline">Retry</button>
        </div>
      )}

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Total',     val: disasters.length,                                           color: 'bg-border text-foreground' },
          { label: 'Active',    val: disasters.filter(d => d.status === 'active').length,        color: 'bg-accentRed/15 text-accentRed' },
          { label: 'Monitored', val: disasters.filter(d => d.status === 'monitoring').length,    color: 'bg-accentOrange/15 text-accentOrange' },
          { label: 'Resolved',  val: disasters.filter(d => d.status === 'resolved').length,      color: 'bg-accentGreen/15 text-accentGreen' },
          { label: 'Manual',    val: disasters.filter(d => d.is_manual).length,                  color: 'bg-purple-500/15 text-purple-400' },
        ].map(c => (
          <span key={c.label} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${c.color}`}>
            {c.label}: {c.val}
          </span>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-textSecondary text-sm">
          Loading incidents...
        </div>
      ) : (
        <DisasterTable
          disasters={disasters}
          onDelete={handleDelete}
          onSearchBusinesses={handleSearchBusinesses}
          searching={searching}
        />
      )}

      {/* Modal */}
      {showModal && (
        <AddDisasterModal
          onClose={() => setShowModal(false)}
          onCreated={() => { load(); }}
        />
      )}
    </div>
  );
}
