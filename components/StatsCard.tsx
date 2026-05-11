interface StatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'orange' | 'red' | 'green' | 'purple';
  pulse?: boolean;
  loading?: boolean;
  hint?: string;
}

const COLOR_MAP = {
  blue:   { tint: 'rgba(156, 107, 74, 0.12)' },
  orange: { tint: 'rgba(201, 123, 63, 0.12)' },
  red:    { tint: 'rgba(184, 77, 44, 0.12)'  },
  green:  { tint: 'rgba(122, 140, 92, 0.16)' },
  purple: { tint: 'rgba(156, 107, 74, 0.12)' },
};

export default function StatsCard({ label, value, icon, color, pulse, loading, hint }: StatsCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className="card-luxe p-5 sm:p-6 hover-lift relative overflow-hidden">
      <div
        className="absolute -top-10 -right-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full pointer-events-none"
        style={{ background: c.tint, filter: 'blur(8px)' }}
      />

      <div className="relative flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.18em] text-textSecondary font-medium">{label}</p>
          {/* clamp() scales number from mobile to desktop without media queries */}
          <h3
            className="font-display font-semibold mt-2 sm:mt-3 tabular-nums break-words"
            style={{ fontSize: 'clamp(1.75rem, 5.5vw, 2.75rem)', lineHeight: 1 }}
          >
            {loading ? <span className="text-textMuted">—</span> : value}
          </h3>
          {hint && <p className="text-xs text-textSecondary mt-2">{hint}</p>}
        </div>

        <div
          className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl relative"
          style={{ background: c.tint }}
        >
          <span aria-hidden>{icon}</span>
          {pulse && (
            <>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent-red)' }} />
              <span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                style={{ background: 'var(--accent-red)', animation: 'ping-soft 1.6s cubic-bezier(0,0,0.2,1) infinite' }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
