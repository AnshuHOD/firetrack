const DISASTER_CONFIG: Record<string, { icon: string; label: string; bg: string; text: string }> = {
  fire:       { icon: '🔥', label: 'Fire',       bg: 'bg-red-500/15',    text: 'text-red-400' },
  earthquake: { icon: '🌍', label: 'Earthquake',  bg: 'bg-orange-500/15', text: 'text-orange-400' },
  flood:      { icon: '🌊', label: 'Flood',       bg: 'bg-blue-500/15',   text: 'text-blue-400' },
  explosion:  { icon: '💥', label: 'Explosion',   bg: 'bg-yellow-500/15', text: 'text-yellow-400' },
  storm:      { icon: '🌪️', label: 'Storm',       bg: 'bg-sky-500/15',    text: 'text-sky-400' },
  collapse:   { icon: '🏚️', label: 'Collapse',    bg: 'bg-stone-500/15',  text: 'text-stone-400' },
  chemical:   { icon: '☣️', label: 'Chemical',    bg: 'bg-green-500/15',  text: 'text-green-400' },
  tsunami:    { icon: '🌊', label: 'Tsunami',     bg: 'bg-cyan-500/15',   text: 'text-cyan-400' },
  landslide:  { icon: '⛰️', label: 'Landslide',   bg: 'bg-amber-500/15',  text: 'text-amber-400' },
  other:      { icon: '⚠️', label: 'Other',       bg: 'bg-gray-500/15',   text: 'text-gray-400' },
};

export function getDisasterConfig(type: string) {
  return DISASTER_CONFIG[type?.toLowerCase()] || DISASTER_CONFIG.other;
}

interface DisasterBadgeProps {
  type: string;
  size?: 'sm' | 'md';
}

export default function DisasterBadge({ type, size = 'md' }: DisasterBadgeProps) {
  const cfg = getDisasterConfig(type);
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${cfg.bg} ${cfg.text} ${sizeClass}`}>
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const MAP: Record<string, string> = {
    Critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
    High:     'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    Medium:   'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    Low:      'bg-green-500/20 text-green-400 border border-green-500/30',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MAP[severity] || MAP.Medium}`}>
      {severity}
    </span>
  );
}
