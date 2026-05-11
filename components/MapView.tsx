'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Disaster {
  id: string;
  title: string;
  disaster_type: string;
  severity: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  city?: string;
  state?: string;
}

interface Business {
  id: string;
  business_name: string;
  category: string;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
  lead_score: number;
  lead_status: string;
  phone?: string;
}

interface Props {
  disasters: Disaster[];
  businesses: Business[];
  selectedDisasterId?: string | null;
}

const DISASTER_COLORS: Record<string, string> = {
  fire:       '#B84D2C',
  earthquake: '#C97B3F',
  flood:      '#7A8C5C',
  explosion:  '#B89253',
  storm:      '#9C6B4A',
  collapse:   '#6B5544',
  chemical:   '#7A8C5C',
  tsunami:    '#7A8C5C',
  landslide:  '#C97B3F',
  other:      '#9C6B4A',
};

const DISASTER_ICONS: Record<string, string> = {
  fire: '🔥', earthquake: '🌍', flood: '🌊', explosion: '💥',
  storm: '🌪️', collapse: '🏚️', chemical: '☣️', tsunami: '🌊',
  landslide: '⛰️', other: '⚠️',
};

function getScoreColor(score: number): string {
  if (score >= 80) return '#B84D2C';
  if (score >= 60) return '#C97B3F';
  if (score >= 40) return '#B89253';
  if (score >= 20) return '#7A8C5C';
  return '#9A7F66';
}

function makeDisasterIcon(type: string, severity: string): L.DivIcon {
  const color = DISASTER_COLORS[type] || '#8b5cf6';
  const emoji = DISASTER_ICONS[type] || '⚠️';
  const size = severity === 'Critical' ? 44 : severity === 'High' ? 38 : 32;
  const pulse = severity === 'Critical' || severity === 'High';
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${pulse ? `<div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.3;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
        <div style="position:absolute;inset:0;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:${size * 0.45}px;box-shadow:0 0 0 3px rgba(0,0,0,0.4),0 4px 12px ${color}60;border:2px solid rgba(255,255,255,0.3);">
          ${emoji}
        </div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function makeBusinessIcon(score: number): L.DivIcon {
  const color = getScoreColor(score);
  return L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.6);box-shadow:0 0 6px ${color}80;"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
    popupAnchor: [0, -8],
  });
}

export default function MapView({ disasters, businesses, selectedDisasterId }: Props) {
  const mapRef    = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      className: 'map-tiles-warm',
    }).addTo(map);

    mapRef.current = map;

    // Recompute tile sizing after the container settles (fixes blank map when
    // parent height resolves post-mount).
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);
    const t = setTimeout(() => map.invalidateSize(), 200);

    return () => {
      ro.disconnect();
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old layers except tile layer
    map.eachLayer(layer => {
      if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
    });

    const bounds: [number, number][] = [];

    // Draw disasters
    disasters.forEach(d => {
      if (!d.latitude || !d.longitude) return;
      const lat = d.latitude, lng = d.longitude;
      bounds.push([lat, lng]);

      const color = DISASTER_COLORS[d.disaster_type] || '#8b5cf6';
      const isSelected = selectedDisasterId === d.id || !selectedDisasterId;

      if (!isSelected) return;

      // Radius circle
      const radius = (d.radius_km || 2) * 1000;
      L.circle([lat, lng], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.06,
        weight: 1.5,
        dashArray: '6 4',
      }).addTo(map);

      // Risk zone rings
      [0.33, 0.66, 1.0].forEach((factor, i) => {
        L.circle([lat, lng], {
          radius: radius * factor,
          color,
          fillColor: color,
          fillOpacity: 0.04,
          weight: 0.5,
        }).addTo(map);
      });

      // Marker
      L.marker([lat, lng], { icon: makeDisasterIcon(d.disaster_type, d.severity) })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:200px;">
            <div style="font-weight:700;font-size:13px;margin-bottom:6px;">${DISASTER_ICONS[d.disaster_type] || '⚠️'} ${d.title}</div>
            <div style="font-size:11px;color:#888;margin-bottom:4px;">
              ${d.disaster_type.toUpperCase()} · ${d.severity} Severity
            </div>
            ${d.city || d.state ? `<div style="font-size:12px;">${[d.city, d.state].filter(Boolean).join(', ')}</div>` : ''}
            <div style="font-size:11px;color:#aaa;margin-top:4px;">Radius: ${d.radius_km || 2} km</div>
          </div>
        `);
    });

    // Draw businesses
    const relevantBusinesses = selectedDisasterId
      ? businesses.filter(b => {
          const d = disasters.find(x => x.id === selectedDisasterId);
          if (!d?.latitude || !d?.longitude || !b.latitude || !b.longitude) return false;
          return true;
        })
      : businesses;

    relevantBusinesses.forEach(b => {
      if (!b.latitude || !b.longitude) return;
      bounds.push([b.latitude, b.longitude]);

      L.marker([b.latitude, b.longitude], { icon: makeBusinessIcon(b.lead_score) })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:180px;">
            <div style="font-weight:700;font-size:12px;margin-bottom:4px;">${b.business_name}</div>
            <div style="font-size:11px;color:#888;margin-bottom:4px;">${b.category || ''}</div>
            ${b.distance_km != null ? `<div style="font-size:11px;">📍 ${b.distance_km} km from incident</div>` : ''}
            ${b.phone ? `<div style="font-size:11px;">📞 ${b.phone}</div>` : ''}
            <div style="margin-top:6px;display:flex;align-items:center;gap:6px;">
              <div style="font-size:11px;color:#888;">Score:</div>
              <div style="font-weight:700;color:${getScoreColor(b.lead_score)};">${b.lead_score}</div>
            </div>
          </div>
        `);
    });

    // Fit bounds
    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 12);
      } else {
        map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [40, 40] });
      }
    }
  }, [disasters, businesses, selectedDisasterId]);

  return (
    <>
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
      <div
        ref={containerRef}
        className="w-full h-full rounded-3xl overflow-hidden border"
        style={{ borderColor: 'var(--border)' }}
      />
    </>
  );
}
