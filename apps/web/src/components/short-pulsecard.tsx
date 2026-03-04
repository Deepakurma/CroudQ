import React from 'react';

export interface ShortPulseCardProps {
  label: string;
  value: number | string;
  color: 'green' | 'red' | 'orange' | 'indigo' | 'blue';
  icon: React.ElementType;
}

export default function ShortPulseCard({ label, value, color, icon: Icon }: ShortPulseCardProps) {
  const colors = {
    green: 'bg-emerald-50 text-emerald-600  ring-emerald-500/20',
    red: 'bg-rose-50 text-rose-600  ring-rose-500/20',
    orange: 'bg-orange-50 text-orange-600  ring-orange-500/20',
    indigo: 'bg-indigo-50 text-indigo-600  ring-indigo-500/20',
    blue: 'bg-blue-50 text-blue-600  ring-blue-500/20'
  };

  return (
    <div
      key={label}
      className={`bg-card flex flex-1 items-center gap-3 rounded-xl border px-4 py-3`}>
      <div className={`rounded-lg ${colors[color]} p-2`}>
        <Icon size={20} />
      </div>

      <div className="flex flex-col">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </span>
        <span className="text-xl font-bold">{value}</span>
      </div>
    </div>
  );
}
