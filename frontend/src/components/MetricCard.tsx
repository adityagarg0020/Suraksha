import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  description: string;
  trend?: string;
  status?: 'normal' | 'warning' | 'danger' | 'success';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  icon: Icon,
  description,
  trend,
  status = 'normal',
}) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'success':
        return 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20';
      case 'warning':
        return 'text-amber-400 border-amber-500/20 bg-amber-950/20';
      case 'danger':
        return 'text-red-400 border-red-500/20 bg-red-950/20';
      default:
        return 'text-cyan-400 border-cyan-500/20 bg-cyan-950/20';
    }
  };

  return (
    <div className="bg-navy-900/80 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {label}
        </span>
        <div className={`p-2 rounded-lg border ${getStatusClasses()}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 mb-1.5">
        <span className="text-2xl font-black tracking-tight text-white font-mono">
          {value}
        </span>
        {unit && <span className="text-xs font-medium text-slate-400">{unit}</span>}
      </div>

      <p className="text-xs text-slate-400 leading-snug">{description}</p>

      {trend && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] font-medium text-cyan-300 flex items-center gap-1">
          {trend}
        </div>
      )}
    </div>
  );
};
