const DISASTER_CONFIG: Record<string, { icon: string; label: string; bg: string; text: string }> = {
  fire:       { icon: '🔥', label: 'Fire',       bg: 'rgba(184, 77, 44, 0.14)',  text: '#8A3618' },
  earthquake: { icon: '🌍', label: 'Earthquake', bg: 'rgba(201, 123, 63, 0.16)', text: '#8A4E1C' },
  flood:      { icon: '🌊', label: 'Flood',      bg: 'rgba(122, 140, 92, 0.18)', text: '#506235' },
  explosion:  { icon: '💥', label: 'Explosion',  bg: 'rgba(184, 146, 83, 0.18)', text: '#8B6A2E' },
  storm:      { icon: '🌪️', label: 'Storm',      bg: 'rgba(122, 140, 92, 0.18)', text: '#506235' },
  collapse:   { icon: '🏚️', label: 'Collapse',   bg: 'rgba(107, 85, 68, 0.16)',  text: '#5A4636' },
  chemical:   { icon: '☣️', label: 'Chemical',   bg: 'rgba(122, 140, 92, 0.18)', text: '#506235' },
  tsunami:    { icon: '🌊', label: 'Tsunami',    bg: 'rgba(122, 140, 92, 0.18)', text: '#506235' },
  landslide:  { icon: '⛰️', label: 'Landslide',  bg: 'rgba(201, 123, 63, 0.16)', text: '#8A4E1C' },
  other:      { icon: '⚠️', label: 'Other',      bg: 'rgba(154, 127, 102, 0.16)', text: '#5A4636' },
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
  const sizeClass = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-xs px-3 py-1';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClass}`}
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const MAP: Record<string, { bg: string; text: string; border: string }> = {
    Critical: { bg: 'rgba(184, 77, 44, 0.14)',  text: '#8A3618', border: 'rgba(184, 77, 44, 0.30)' },
    High:     { bg: 'rgba(201, 123, 63, 0.16)', text: '#8A4E1C', border: 'rgba(201, 123, 63, 0.30)' },
    Medium:   { bg: 'rgba(184, 146, 83, 0.18)', text: '#8B6A2E', border: 'rgba(184, 146, 83, 0.30)' },
    Low:      { bg: 'rgba(122, 140, 92, 0.18)', text: '#506235', border: 'rgba(122, 140, 92, 0.30)' },
  };
  const cfg = MAP[severity] || MAP.Medium;
  return (
    <span
      className="text-xs px-2.5 py-0.5 rounded-full font-medium"
      style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
    >
      {severity}
    </span>
  );
}
