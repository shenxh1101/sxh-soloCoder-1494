import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  accent?: 'gold' | 'rose' | 'ink' | 'emerald';
  trend?: { value: string; up: boolean };
}

const accentMap = {
  gold: 'from-champagne-50 to-white border-champagne-100 text-champagne-600',
  rose: 'from-rosegold-50 to-white border-rosegold-100 text-rosegold-500',
  ink: 'from-ink-50 to-white border-ink-100 text-ink-600',
  emerald: 'from-emerald-50 to-white border-emerald-100 text-emerald-600',
};

export default function StatCard({ title, value, subtitle, icon, accent = 'gold', trend }: StatCardProps) {
  return (
    <div className={`card card-hover p-5 bg-gradient-to-br ${accentMap[accent]}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-ink-500 uppercase tracking-wider">{title}</p>
          <p className="font-display text-2xl font-bold text-ink-800 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-ink-400 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl bg-white shadow-card flex items-center justify-center border border-ink-50`}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${trend.up ? 'text-emerald-600' : 'text-rosegold-600'}`}>
          <span>{trend.up ? '▲' : '▼'}</span>
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
}
