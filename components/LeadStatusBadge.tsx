export const LEAD_STATUSES = ['New', 'Contacted', 'Interested', 'Converted', 'Closed'] as const;
export type LeadStatus = typeof LEAD_STATUSES[number];

const STATUS_MAP: Record<LeadStatus, { bg: string; text: string; dot: string }> = {
  New:        { bg: 'bg-blue-500/15',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  Contacted:  { bg: 'bg-yellow-500/15', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  Interested: { bg: 'bg-purple-500/15', text: 'text-purple-400', dot: 'bg-purple-400' },
  Converted:  { bg: 'bg-green-500/15',  text: 'text-green-400',  dot: 'bg-green-400' },
  Closed:     { bg: 'bg-gray-500/15',   text: 'text-gray-400',   dot: 'bg-gray-400' },
};

export default function LeadStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status as LeadStatus] || STATUS_MAP.New;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  let color = 'text-gray-400';
  if (score >= 80) color = 'text-red-400';
  else if (score >= 60) color = 'text-orange-400';
  else if (score >= 40) color = 'text-yellow-400';
  else if (score >= 20) color = 'text-green-400';

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            score >= 80 ? 'bg-red-400' : score >= 60 ? 'bg-orange-400' : score >= 40 ? 'bg-yellow-400' : 'bg-green-400'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums ${color}`}>{score}</span>
    </div>
  );
}
