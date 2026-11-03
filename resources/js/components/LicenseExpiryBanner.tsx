import { AlertTriangle, Crown, X } from 'lucide-react';
import { useState } from 'react';
import { router } from '@inertiajs/react';

interface LicenseExpiryBannerProps {
  daysRemaining: number;
  expiryDate?: string;
}

export default function LicenseExpiryBanner({ daysRemaining, expiryDate }: LicenseExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || daysRemaining > 7 || daysRemaining <= 0) return null;

  const isUrgent = daysRemaining <= 1;
  const isWarning = daysRemaining <= 3;

  const bgClass = isUrgent
    ? 'bg-destructive/10 border-destructive/20 text-destructive'
    : isWarning
    ? 'bg-warning/10 border-warning/20 text-warning'
    : 'bg-primary/10 border-primary/20 text-primary';

  const message = isUrgent
    ? `Your license expires tomorrow${expiryDate ? ` (${expiryDate})` : ''}! Renew now to avoid service interruption.`
    : daysRemaining <= 3
    ? `Your license expires in ${daysRemaining} days${expiryDate ? ` (${expiryDate})` : ''}. Please renew to avoid service interruption.`
    : `Your license will expire in ${daysRemaining} days${expiryDate ? ` (${expiryDate})` : ''}. Consider renewing soon.`;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 border rounded-2xl mb-2 sm:mb-4 shadow-sm relative overflow-hidden group transition-all ${bgClass}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
      
      <div className="flex items-center gap-4 flex-1 relative z-10">
         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isUrgent ? 'bg-destructive/20' : isWarning ? 'bg-warning/20' : 'bg-primary/20'
         }`}>
            <AlertTriangle size={20} />
         </div>
         <p className="text-sm font-bold flex-1">{message}</p>
      </div>

      <div className="flex items-center gap-3 relative z-10 pl-14 sm:pl-0">
         <button 
           onClick={() => router.visit('/upgrade')}
           className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
              isUrgent ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 
              isWarning ? 'bg-warning text-warning-foreground hover:bg-warning/90' : 
              'bg-primary text-primary-foreground hover:bg-primary/90'
           }`}
         >
            <Crown size={14} /> Renew License
         </button>
         
         <button 
           onClick={() => setDismissed(true)} 
           className="w-8 h-8 flex items-center justify-center rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 transition-all shrink-0"
           title="Dismiss"
         >
           <X size={16} />
         </button>
      </div>
    </div>
  );
}
