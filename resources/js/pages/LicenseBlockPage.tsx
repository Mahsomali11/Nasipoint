import { useApp } from '@/context/AppContext';
import { router } from '@inertiajs/react';
import { AlertTriangle, Shield, RefreshCw, Crown, MessageCircle, LogOut } from 'lucide-react';

export default function LicenseBlockPage() {
  const { currentStore, licenseStatus, logout } = useApp();
  const navigate = (url: string, options?: any) => router.visit(url, options);

  const statusMessages: Record<string, { title: string; message: string; color: string; bg: string }> = {
    expired: {
      title: 'License Expired',
      message: 'Your license has expired. Renew your subscription to continue using Maaldhis.',
      color: 'hsl(35,90%,50%)',
      bg: 'hsl(35,90%,50%, 0.1)',
    },
    suspended: {
      title: 'License Suspended',
      message: 'Your store license has been suspended by the platform administrator. Please contact support.',
      color: 'hsl(0,72%,51%)',
      bg: 'hsl(0,72%,51%, 0.1)',
    },
    cancelled: {
      title: 'License Cancelled',
      message: 'Your store license has been cancelled. Please contact support for assistance.',
      color: 'hsl(0,72%,51%)',
      bg: 'hsl(0,72%,51%, 0.1)',
    },
    inactive: {
      title: 'License Inactive',
      message: 'Your license is inactive. Please renew your subscription to continue using the system.',
      color: 'hsl(35,90%,50%)',
      bg: 'hsl(35,90%,50%, 0.1)',
    },
  };

  const status = licenseStatus?.status || 'expired';
  const info = statusMessages[status] || statusMessages.expired;

  // Check if expired by days_remaining
  const isExpired = status === 'expired' || (licenseStatus?.days_remaining !== undefined && licenseStatus.days_remaining < 0);
  const displayInfo = isExpired ? statusMessages.expired : info;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background abstract elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-3xl opacity-50" style={{ backgroundColor: displayInfo.bg }}></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-3xl opacity-50" style={{ backgroundColor: displayInfo.bg }}></div>
      </div>

      <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl p-8 sm:p-10 text-center relative z-10 animate-in zoom-in-95 duration-500">
        
        <div className="w-20 h-20 rounded-2xl mx-auto mb-8 flex items-center justify-center border-2 ring-8" style={{ backgroundColor: displayInfo.bg, borderColor: displayInfo.color, ringColor: displayInfo.bg }}>
          {status === 'suspended' ? (
            <Shield size={36} style={{ color: displayInfo.color }} />
          ) : (
            <AlertTriangle size={36} style={{ color: displayInfo.color }} />
          )}
        </div>

        <h1 className="text-3xl font-black text-foreground mb-3 tracking-tight capitalize">{displayInfo.title}</h1>
        <p className="text-sm font-medium text-muted-foreground mb-8 max-w-xs mx-auto leading-relaxed">{displayInfo.message}</p>

        {currentStore && (
          <div className="bg-muted/30 rounded-2xl border border-border/50 p-5 mb-8 text-left space-y-4 shadow-inner">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-muted-foreground  capitalize tracking-widest">Store</span>
              <span className="text-sm font-black text-foreground">{currentStore.store_name}</span>
            </div>
            <div className="flex justify-between items-center border-t border-border/50 pt-4">
              <span className="text-[10px] font-bold text-muted-foreground  capitalize tracking-widest">Status</span>
              <span className="text-[10px] font-black  capitalize tracking-widest px-2.5 py-1 rounded-lg border shadow-sm" style={{ color: displayInfo.color, backgroundColor: displayInfo.bg, borderColor: displayInfo.color }}>
                {isExpired ? 'Expired' : status}
              </span>
            </div>
            {licenseStatus?.expiry_date && (
              <div className="flex justify-between items-center border-t border-border/50 pt-4">
                <span className="text-[10px] font-bold text-muted-foreground  capitalize tracking-widest">Expiry Date</span>
                <span className="text-sm font-bold text-foreground">{licenseStatus.expiry_date}</span>
              </div>
            )}
            {licenseStatus?.plan_name && (
              <div className="flex justify-between items-center border-t border-border/50 pt-4">
                <span className="text-[10px] font-bold text-muted-foreground  capitalize tracking-widest">Plan</span>
                <span className="text-sm font-bold text-foreground capitalize">{licenseStatus.plan_name}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => navigate('/upgrade')}
            className="w-full py-4 rounded-xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
            style={{ backgroundColor: displayInfo.color, color: 'white' }}
          >
            <Crown size={20} /> Renew License
          </button>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/upgrade')}
              className="w-full py-3.5 rounded-xl bg-card border-2 border-border text-foreground text-sm font-bold hover:border-primary/50 hover:bg-muted transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Crown size={16} /> View Plans
            </button>
            <button
              onClick={() => navigate('/help')}
              className="w-full py-3.5 rounded-xl bg-card border-2 border-border text-foreground text-sm font-bold hover:border-primary/50 hover:bg-muted transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <MessageCircle size={16} /> Support
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-xl bg-transparent text-muted-foreground text-xs font-bold hover:text-foreground hover:bg-muted transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={14} /> Check Again
            </button>
            <button
              onClick={logout}
              className="w-full py-3 rounded-xl bg-transparent text-muted-foreground text-xs font-bold hover:text-destructive hover:bg-destructive/10 transition-all flex items-center justify-center gap-1.5 capitalize"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
