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
  fire:       '#B84D2C',
  earthquake: '#C97B3F',
  flood:      '#7A8C5C',
  explosion:  '#B89253',
  storm:      '#9C6B4A',
  collapse:   '#6B5544',
  chemical:   '#7A8C5C',
  other:      '#9C6B4A',
};

const TYPE_ICONS: Record<string, string> = {
  fire: '🔥', earthquake: '🌍', flood: '🌊', explosion: '💥',
  storm: '🌪️', collapse: '🏚️', chemical: '☣️', other: '⚠️',
};

const STATUS_COLORS: Record<string, string> = {
  New:        '#9C6B4A',
  Contacted:  '#B89253',
  Interested: '#C97B3F',
  Converted:  '#7A8C5C',
  Closed:     '#9A7F66',
};

export default function AnalyticsPanel({ stats, businesses, loading }: Props) {
  const byType   = stats?.by_type   || [];
  const byStatus = stats?.by_status || [];

  const maxType   = Math.max(...byType.map(d => d.count),   1);
  const maxStatus = Math.max(...byStatus.map(d => d.count), 1);

  const avgScore = businesses.length
    ? Math.round(businesses.reduce((s, b) => s + (b.lead_score || 0), 0) / businesses.length)
    : 0;

  const trackBg = 'rgba(216, 199, 181, 0.55)';

  return (
    <div className="card-luxe p-5 sm:p-7 flex flex-col h-full gap-5 sm:gap-6 overflow-y-auto scroll-warm">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-textSecondary">Analytics</p>
        <h3 className="font-display text-2xl font-semibold mt-1 tracking-tight">Snapshot</h3>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-textSecondary text-sm">Loading…</div>
      ) : (
        <>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-textSecondary mb-3 font-medium">Events by type</p>
            {byType.length === 0 ? (
              <p className="text-xs text-textSecondary">No data yet</p>
            ) : (
              <div className="space-y-3">
                {byType.map(({ disaster_type, count }) => (
                  <div key={disaster_type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground">
                        {TYPE_ICONS[disaster_type] || '⚠️'} {disaster_type.charAt(0).toUpperCase() + disaster_type.slice(1)}
                      </span>
                      <span className="text-textSecondary font-semibold tabular-nums">{count}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: trackBg }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(count / maxType) * 100}%`,
                          background: TYPE_COLORS[disaster_type] || '#9C6B4A',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-textSecondary mb-3 font-medium">Lead pipeline</p>
            {byStatus.length === 0 ? (
              <p className="text-xs text-textSecondary">No data yet</p>
            ) : (
              <div className="space-y-3">
                {byStatus.map(({ lead_status, count }) => (
                  <div key={lead_status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground">{lead_status}</span>
                      <span className="text-textSecondary font-semibold tabular-nums">{count}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: trackBg }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(count / maxStatus) * 100}%`,
                          background: STATUS_COLORS[lead_status] || '#9C6B4A',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {businesses.length > 0 && (
            <div
              className="rounded-2xl p-4 mt-auto"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs uppercase tracking-[0.16em] text-textSecondary">Average lead score</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: trackBg }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${avgScore}%`,
                      background: avgScore >= 80 ? '#B84D2C' : avgScore >= 60 ? '#C97B3F' : avgScore >= 40 ? '#B89253' : '#7A8C5C',
                    }}
                  />
                </div>
                <span className="font-display text-2xl font-semibold tabular-nums">{avgScore}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
