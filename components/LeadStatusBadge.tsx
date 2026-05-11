export const LEAD_STATUSES = ['New', 'Contacted', 'Interested', 'Converted', 'Closed'] as const;
export type LeadStatus = typeof LEAD_STATUSES[number];

const STATUS_MAP: Record<LeadStatus, { bg: string; text: string; dot: string }> = {
  New:        { bg: 'rgba(156, 107, 74, 0.12)', text: '#7A4A2E', dot: '#9C6B4A' },
  Contacted:  { bg: 'rgba(184, 146, 83, 0.16)', text: '#8B6A2E', dot: '#B89253' },
  Interested: { bg: 'rgba(201, 123, 63, 0.16)', text: '#8A4E1C', dot: '#C97B3F' },
  Converted:  { bg: 'rgba(122, 140, 92, 0.18)', text: '#506235', dot: '#7A8C5C' },
  Closed:     { bg: 'rgba(107, 85, 68, 0.14)',  text: '#5A4636', dot: '#9A7F66' },
};

export default function LeadStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status as LeadStatus] || STATUS_MAP.New;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {status}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  let color = '#9A7F66';
  if (score >= 80) color = '#B84D2C';
  else if (score >= 60) color = '#C97B3F';
  else if (score >= 40) color = '#B89253';
  else if (score >= 20) color = '#7A8C5C';

  const trackBg = 'rgba(216, 199, 181, 0.6)';

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: trackBg }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(score, 100)}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>
        {score}
      </span>
    </div>
  );
}
