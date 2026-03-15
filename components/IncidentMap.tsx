'use client';

import dynamic from 'next/dynamic';

// Next.js needs dynamic import for leaflet to avoid SSR "window is not defined" error
const DynamicMap = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-card border border-border rounded-lg text-textSecondary h-[300px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accentBlue mb-4"></div>
      <p>Loading Interactive Map...</p>
    </div>
  )
});

export default function IncidentMap({ leads = [] }: { leads: any[] }) {
  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg shadow-sm p-4">
      <h2 className="font-semibold text-lg flex items-center justify-between">
        Live Incident Map
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accentRed opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-accentRed"></span>
        </span>
      </h2>
      <div className="flex-1 mt-2 min-h-[300px]">
        <DynamicMap leads={leads} />
      </div>
    </div>
  );
}
