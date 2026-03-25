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
      <label className="block text-xs text-textSecondary mb-1">{label}</label>
      <input
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accentBlue"
        {...props}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 id="modal-title" className="text-lg font-bold">Add New Disaster Event</h2>
          <button onClick={onClose} className="text-textSecondary hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {field('title', 'Incident Title *', { placeholder: 'e.g. Fire at Dhanbad Coal Mine' })}

          <div>
            <label className="block text-xs text-textSecondary mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accentBlue resize-none"
              placeholder="Brief description of the incident..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-textSecondary mb-1">Disaster Type *</label>
              <select
                value={form.disaster_type}
                onChange={e => setForm(f => ({ ...f, disaster_type: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accentBlue"
              >
                {DISASTER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-textSecondary mb-1">Severity *</label>
              <select
                value={form.severity}
                onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accentBlue"
              >
                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Location with geocoding */}
          <div>
            <label className="block text-xs text-textSecondary mb-1">Location (Area/City) *</label>
            <div className="flex gap-2">
              <input
                value={form.location_name}
                onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accentBlue"
                placeholder="e.g. Dharavi, Mumbai"
              />
              <button
                type="button"
                onClick={handleGeocode}
                disabled={geocoding || !form.location_name.trim()}
                className="flex items-center gap-1.5 px-3 py-2 bg-accentBlue/15 text-accentBlue rounded-lg text-xs font-medium hover:bg-accentBlue/25 disabled:opacity-40 transition-colors"
              >
                {geocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                {geocoding ? 'Finding...' : 'Geocode'}
              </button>
            </div>
            {geoResult && (
              <p className="text-xs text-accentGreen mt-1.5">
                ✓ {geoResult.lat.toFixed(4)}, {geoResult.lng.toFixed(4)} — {geoResult.display.length > 60 ? `${geoResult.display.slice(0, 60)}…` : geoResult.display}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('city', 'City', { placeholder: 'Mumbai' })}
            {field('state', 'State', { placeholder: 'Maharashtra' })}
          </div>

          <div>
            <label className="block text-xs text-textSecondary mb-1">Search Radius (km)</label>
            <input
              type="range" min="0.5" max="5" step="0.5"
              value={form.radius_km}
              onChange={e => setForm(f => ({ ...f, radius_km: e.target.value }))}
              className="w-full accent-accentBlue"
            />
            <div className="flex justify-between text-xs text-textSecondary mt-0.5">
              <span>0.5 km</span>
              <span className="text-accentBlue font-semibold">{form.radius_km} km</span>
              <span>5 km</span>
            </div>
          </div>

          {error && <p className="text-xs text-accentRed bg-accentRed/10 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-border text-textSecondary py-2.5 rounded-lg text-sm font-medium hover:border-foreground/30 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-accentBlue text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating...' : 'Create & Search Businesses'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
