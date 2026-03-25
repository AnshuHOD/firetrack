interface StatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'orange' | 'red' | 'green' | 'purple';
  pulse?: boolean;
  loading?: boolean;
}

const COLOR_MAP = {
  blue:   { bg: 'bg-accentBlue/10',   text: 'text-accentBlue',   value: '' },
  orange: { bg: 'bg-accentOrange/10', text: 'text-accentOrange', value: '' },
  red:    { bg: 'bg-accentRed/10',    text: 'text-accentRed',    value: 'text-accentRed' },
  green:  { bg: 'bg-accentGreen/10',  text: 'text-accentGreen',  value: '' },
  purple: { bg: 'bg-purple-500/10',   text: 'text-purple-400',   value: '' },
};

export default function StatsCard({ label, value, icon, color, pulse, loading }: StatsCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-textSecondary font-medium">{label}</p>
        <h3 className={`text-3xl font-bold mt-1 ${c.value}`}>
          {loading ? <span className="text-textSecondary text-2xl">...</span> : value}
        </h3>
      </div>
      <div className={`h-12 w-12 ${c.bg} rounded-full flex items-center justify-center text-xl relative`}>
        {icon}
        {pulse && (
          <div className="absolute top-0 right-0 w-3 h-3 bg-accentRed rounded-full animate-ping" />
        )}
      </div>
    </div>
  );
}
