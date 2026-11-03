import { useApp } from '@/context/AppContext';
import { AlertTriangle, Crown } from 'lucide-react';
import { router } from '@inertiajs/react';

export default function TrialExpiryBanner() {
  const { licenseStatus } = useApp();
  const navigate = (url: string, options?: any) => router.visit(url, options);

  // Consider it a trial if the plan_name has 'trial' in it, or rely on existing logic
  if (!licenseStatus || licenseStatus.status !== 'active') return null;
  const days = licenseStatus.days_remaining;
  if (days === undefined || days > 7) return null;

  const urgency = days <= 1 ? 'bg-destructive/10 border-destructive/20 text-destructive' :
                  days <= 3 ? 'bg-warning/10 border-warning/20 text-warning' :
                  'bg-info/10 border-info/20 text-info';

  const iconBg = days <= 1 ? 'bg-destructive/20' :
                 days <= 3 ? 'bg-warning/20' :
                 'bg-info/20';

  const btnBg = days <= 1 ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' :
                days <= 3 ? 'bg-warning text-warning-foreground hover:bg-warning/90' :
                'bg-info text-info-foreground hover:bg-info/90';

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 border rounded-2xl mb-2 sm:mb-4 shadow-sm relative overflow-hidden group transition-all animate-in fade-in slide-in-from-top-4 ${urgency}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
      
      <div className="flex items-center gap-4 flex-1 relative z-10">
         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <AlertTriangle size={20} />
         </div>
         <div>
           <p className="text-sm font-bold">
             {days <= 0 ? 'Your trial has expired!' : `Your trial expires in ${days} day${days === 1 ? '' : 's'}`}
           </p>
           <p className="text-xs font-medium opacity-80 mt-0.5">Upgrade your plan to continue using the POS system.</p>
         </div>
      </div>
      
      <div className="flex items-center gap-3 relative z-10 pl-14 sm:pl-0">
         <button 
           onClick={() => navigate('/upgrade')}
           className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${btnBg}`}
         >
            <Crown size={14} /> Upgrade Plan
         </button>
      </div>
    </div>
  );
}
