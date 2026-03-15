'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

// A custom pulsing red icon for High impact fires
const dangerIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-white shadow-lg"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Component to dynamically adjust map bounds
function AdjustBounds({ leads }: { leads: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (leads.length > 0) {
      const bounds = L.latLngBounds(leads.map(l => [l.incidents?.latitude || 20.5937, l.incidents?.longitude || 78.9629]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [leads, map]);
  return null;
}

export default function MapComponent({ leads = [] }: { leads: any[] }) {
  // Center of India roughly
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  
  // Filter leads that actually have coordinates (for now we might not have lat/lng mapped, 
  // so we will show a default pan to India until Google geocoding is added)
  const mapLeads = leads.filter(l => l.incidents?.latitude && l.incidents?.longitude);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border mt-2 relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={5} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        
        {mapLeads.map((lead, idx) => (
          <Marker 
            key={idx} 
            position={[lead.incidents.latitude, lead.incidents.longitude]}
            icon={lead.incidents.impact_level === 'High' ? dangerIcon : icon}
          >
            <Popup className="custom-popup">
              <div className="font-sans">
                <h3 className="font-bold text-sm mb-1">{lead.business_name || 'Incident Location'}</h3>
                <p className="text-xs text-gray-600 mb-1">{lead.incidents.city}, {lead.incidents.state}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                    {lead.incidents.impact_level} Impact
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {mapLeads.length > 0 && <AdjustBounds leads={mapLeads} />}
      </MapContainer>
      
      {/* Dark mode overlay for tiles since OSM doesn't have a native dark theme without an API key */}
      <style jsx global>{`
        .dark .map-tiles {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
        }
        .leaflet-container {
          background: #0f0f0f !important;
        }
      `}</style>
    </div>
  );
}
