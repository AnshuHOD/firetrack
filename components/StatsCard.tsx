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
  blue:   { ring: 'ring-accentBlue/20',   tint: 'rgba(156, 107, 74, 0.12)', text: 'var(--accent-brown)' },
  orange: { ring: 'ring-accentOrange/20', tint: 'rgba(201, 123, 63, 0.12)', text: 'var(--accent-orange)' },
  red:    { ring: 'ring-accentRed/20',    tint: 'rgba(184, 77, 44, 0.12)',  text: 'var(--accent-red)' },
  green:  { ring: 'ring-accentGreen/20',  tint: 'rgba(122, 140, 92, 0.16)', text: 'var(--accent-green)' },
  purple: { ring: 'ring-accentBlue/20',   tint: 'rgba(156, 107, 74, 0.12)', text: 'var(--accent-brown)' },
};

export default function StatsCard({ label, value, icon, color, pulse, loading, hint }: StatsCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className="card-luxe p-6 hover-lift relative overflow-hidden">
      {/* Subtle corner blob */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: c.tint, filter: 'blur(8px)' }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-textSecondary font-medium">{label}</p>
          <h3
            className="font-display font-semibold mt-3 tabular-nums"
            style={{ fontSize: 'clamp(2rem, 3vw, 2.75rem)', lineHeight: 1, color: 'var(--text-primary)' }}
          >
            {loading ? <span className="text-textMuted">—</span> : value}
          </h3>
          {hint && <p className="text-xs text-textSecondary mt-2">{hint}</p>}
        </div>

        <div
          className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl relative"
          style={{ background: c.tint }}
        >
          <span>{icon}</span>
          {pulse && (
            <>
              <span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                style={{ background: 'var(--accent-red)' }}
              />
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
