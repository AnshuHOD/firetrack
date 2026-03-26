'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import BusinessLeadTable from '@/components/BusinessLeadTable';
import Toast from '@/components/Toast';

export default function LeadsPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [toast, setToast]           = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/businesses?limit=500');
      const data = await res.json();
      if (data.success) setBusinesses(data.data);
      else throw new Error(data.error || 'Failed to load leads');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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

  return (
    <div className="flex flex-col gap-6">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-sm text-textSecondary mt-0.5">
          All businesses identified near disaster zones — ranked by lead score
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 bg-accentRed/10 border border-accentRed/30 text-accentRed px-4 py-3 rounded-xl text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={load} className="ml-auto underline text-xs hover:no-underline">Retry</button>
        </div>
      )}

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Leads', val: total,     color: 'bg-card border border-border text-foreground' },
          { label: 'New',         val: newLeads,  color: 'bg-accentBlue/10 border border-accentBlue/20 text-accentBlue' },
          { label: 'Contacted',   val: contacted, color: 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' },
          { label: 'Converted',   val: converted, color: 'bg-accentGreen/10 border border-accentGreen/20 text-accentGreen' },
          { label: 'Score ≥ 70',  val: highScore, color: 'bg-accentRed/10 border border-accentRed/20 text-accentRed' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl px-4 py-3 ${c.color}`}>
            <p className="text-xs opacity-70">{c.label}</p>
            <p className="text-2xl font-bold mt-0.5">{loading ? '…' : c.val}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-textSecondary text-sm">
          Loading leads...
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
  );
}
