import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}

export default function StatCard({ label, value, icon: Icon, trend, trendUp, color = 'hsl(145,63%,42%)' }: StatCardProps) {
  return (
    <div className="bg-[hsl(220,20%,14%)] rounded-xl p-5 border border-[hsl(220,15%,18%)]">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trendUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-[hsl(220,10%,50%)] mt-1">{label}</p>
    </div>
  );
}
