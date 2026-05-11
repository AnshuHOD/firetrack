'use client';

import { useState } from 'react';
import { X, MapPin, Loader2 } from 'lucide-react';

const DISASTER_TYPES = [
  { value: 'fire',       label: '🔥 Fire' },
  { value: 'earthquake', label: '🌍 Earthquake' },
  { value: 'flood',      label: '🌊 Flood' },
  { value: 'explosion',  label: '💥 Explosion' },
  { value: 'storm',      label: '🌪️ Storm' },
  { value: 'collapse',   label: '🏚️ Building Collapse' },
  { value: 'chemical',   label: '☣️ Chemical Leak' },
  { value: 'tsunami',    label: '🌊 Tsunami' },
  { value: 'landslide',  label: '⛰️ Landslide' },
  { value: 'other',      label: '⚠️ Other' },
];

const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const baseInput = 'w-full bg-background border border-border rounded-2xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-accentBrown transition-colors';

export default function AddDisasterModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    title: '', description: '',
    disaster_type: 'fire', severity: 'High',
    location_name: '', city: '', state: '',
    radius_km: '2',
  });
  const [loading, setLoading]   = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoResult, setGeoResult] = useState<{ lat: number; lng: number; display: string } | null>(null);
  const [error, setError] = useState('');

  const handleGeocode = async () => {
    if (!form.location_name.trim()) return;
    setGeocoding(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(form.location_name)}`);
      const data = await res.json();
      if (data.success) {
        setGeoResult({ lat: data.data.lat, lng: data.data.lng, display: data.data.displayName });
        if (data.data.city  && !form.city)  setForm(f => ({ ...f, city: data.data.city }));
        if (data.data.state && !form.state) setForm(f => ({ ...f, state: data.data.state }));
      } else {
        setError('Location not found. Try a more specific name.');
      }
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.location_name.trim()) {
      setError('Title and Location are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const body = {
        ...form,
        radius_km: parseFloat(form.radius_km) || 2,
        latitude:  geoResult?.lat,
        longitude: geoResult?.lng,
      };
      const res = await fetch('/api/disasters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { onCreated(); onClose(); }
      else setError(data.error || 'Failed to create disaster.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, label: string, props?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className="block text-xs uppercase tracking-[0.14em] text-textSecondary mb-1.5">{label}</label>
      <input
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className={baseInput}
        {...props}
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(46, 27, 18, 0.45)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="card-luxe w-full max-w-lg shadow-soft-lg overflow-hidden">
        <div className="flex items-center justify-between px-7 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 id="modal-title" className="font-display text-2xl font-semibold tracking-tight">
            Add new event
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-textSecondary hover:text-foreground transition-colors"
            style={{ background: 'var(--bg-primary)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
          {field('title', 'Incident title *', { placeholder: 'e.g. Fire at Dhanbad Coal Mine' })}

          <div>
            <label className="block text-xs uppercase tracking-[0.14em] text-textSecondary mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className={`${baseInput} resize-none`}
              placeholder="Brief description of the incident..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.14em] text-textSecondary mb-1.5">Type *</label>
              <select
                value={form.disaster_type}
                onChange={e => setForm(f => ({ ...f, disaster_type: e.target.value }))}
                className={baseInput}
              >
                {DISASTER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.14em] text-textSecondary mb-1.5">Severity *</label>
              <select
                value={form.severity}
                onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                className={baseInput}
              >
                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.14em] text-textSecondary mb-1.5">Location *</label>
            <div className="flex gap-2">
              <input
                value={form.location_name}
                onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))}
                className={`${baseInput} flex-1`}
                placeholder="e.g. Dharavi, Mumbai"
              />
              <button
                type="button"
                onClick={handleGeocode}
                disabled={geocoding || !form.location_name.trim()}
                className="btn-pill btn-secondary disabled:opacity-40 whitespace-nowrap"
              >
                {geocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                {geocoding ? 'Finding…' : 'Geocode'}
              </button>
            </div>
            {geoResult && (
              <p className="text-xs mt-2" style={{ color: '#506235' }}>
                ✓ {geoResult.lat.toFixed(4)}, {geoResult.lng.toFixed(4)} — {geoResult.display.length > 60 ? `${geoResult.display.slice(0, 60)}…` : geoResult.display}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field('city', 'City', { placeholder: 'Mumbai' })}
            {field('state', 'State', { placeholder: 'Maharashtra' })}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.14em] text-textSecondary mb-1.5">Search radius (km)</label>
            <input
              type="range" min="0.5" max="5" step="0.5"
              value={form.radius_km}
              onChange={e => setForm(f => ({ ...f, radius_km: e.target.value }))}
              className="w-full"
              style={{ accentColor: 'var(--accent-brown)' }}
            />
            <div className="flex justify-between text-xs text-textSecondary mt-1">
              <span>0.5 km</span>
              <span className="font-semibold" style={{ color: 'var(--accent-brown)' }}>{form.radius_km} km</span>
              <span>5 km</span>
            </div>
          </div>

          {error && (
            <p
              className="text-xs px-4 py-2.5 rounded-2xl"
              style={{ color: '#8A3618', background: 'rgba(184, 77, 44, 0.10)' }}
            >
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-pill btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-pill btn-primary flex-1 disabled:opacity-50">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating…' : 'Create & search'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
