'use client';

interface Stats {
  by_type?: { disaster_type: string; count: number }[];
  by_status?: { lead_status: string; count: number }[];
}

interface Props {
  stats: Stats | null;
  businesses: any[];
  loading?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  fire:       'bg-red-500',
  earthquake: 'bg-orange-500',
  flood:      'bg-blue-500',
  explosion:  'bg-yellow-500',
  storm:      'bg-sky-400',
  collapse:   'bg-stone-400',
  chemical:   'bg-green-500',
  other:      'bg-purple-500',
};

const TYPE_ICONS: Record<string, string> = {
  fire: '🔥', earthquake: '🌍', flood: '🌊', explosion: '💥',
  storm: '🌪️', collapse: '🏚️', chemical: '☣️', other: '⚠️',
};

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-accentBlue', Contacted: 'bg-yellow-500',
  Interested: 'bg-purple-500', Converted: 'bg-accentGreen', Closed: 'bg-gray-500',
};

export default function AnalyticsPanel({ stats, businesses, loading }: Props) {
  const byType   = stats?.by_type   || [];
  const byStatus = stats?.by_status || [];

  const maxType   = Math.max(...byType.map(d => d.count),   1);
  const maxStatus = Math.max(...byStatus.map(d => d.count), 1);

  const avgScore = businesses.length
    ? Math.round(businesses.reduce((s, b) => s + (b.lead_score || 0), 0) / businesses.length)
    : 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col h-full gap-5 overflow-y-auto">
      <h2 className="font-semibold text-base">Analytics</h2>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-textSecondary text-sm">Loading...</div>
      ) : (
        <>
          {/* Disasters by type */}
          <div>
            <p className="text-xs text-textSecondary mb-2 font-medium uppercase tracking-wider">Disasters by Type</p>
            {byType.length === 0 ? (
              <p className="text-xs text-textSecondary">No data</p>
            ) : (
              <div className="space-y-2">
                {byType.map(({ disaster_type, count }) => (
                  <div key={disaster_type}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span>{TYPE_ICONS[disaster_type] || '⚠️'} {disaster_type.charAt(0).toUpperCase() + disaster_type.slice(1)}</span>
                      <span className="text-textSecondary font-medium">{count}</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${TYPE_COLORS[disaster_type] || 'bg-purple-500'} transition-all duration-700`}
                        style={{ width: `${(count / maxType) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lead status breakdown */}
          <div>
            <p className="text-xs text-textSecondary mb-2 font-medium uppercase tracking-wider">Lead Status</p>
            {byStatus.length === 0 ? (
              <p className="text-xs text-textSecondary">No data</p>
            ) : (
              <div className="space-y-2">
                {byStatus.map(({ lead_status, count }) => (
                  <div key={lead_status}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span>{lead_status}</span>
                      <span className="text-textSecondary font-medium">{count}</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${STATUS_COLORS[lead_status] || 'bg-accentBlue'} transition-all duration-700`}
                        style={{ width: `${(count / maxStatus) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Avg lead score */}
          {businesses.length > 0 && (
            <div className="bg-background rounded-lg p-3 mt-auto">
              <p className="text-xs text-textSecondary mb-1">Avg Lead Score</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      avgScore >= 80 ? 'bg-red-500' : avgScore >= 60 ? 'bg-accentOrange' : avgScore >= 40 ? 'bg-yellow-500' : 'bg-accentGreen'
                    }`}
                    style={{ width: `${avgScore}%` }}
                  />
                </div>
                <span className="text-sm font-bold">{avgScore}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
