import { ReactNode, useState, useEffect } from 'react';
import DesktopSidebar from './DesktopSidebar';
import LicenseExpiryBanner from './LicenseExpiryBanner';
import { useApp } from '@/context/AppContext';
import { Menu, X, Store } from 'lucide-react';
import { usePage, router } from '@inertiajs/react';
import { ROUTE_FEATURE_MAP } from '@/lib/features';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

interface DesktopLayoutProps {
  children: ReactNode;
}

export default function DesktopLayout({ children }: DesktopLayoutProps) {
  const { licenseStatus, storeFeatures, isLicenseActive } = useApp();
  const { url } = usePage();
  const { hasFeature } = useFeatureAccess();
  const daysRemaining = licenseStatus?.days_remaining ?? 999;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check feature access
  useEffect(() => {
    // Check if we are fully loaded
    if (!licenseStatus) return;

    const path = url.split('?')[0];
    const requiredFeature = ROUTE_FEATURE_MAP[path];
    
    if (requiredFeature) {
      if (!hasFeature(requiredFeature)) {
        router.visit('/upgrade');
      } else if (!isLicenseActive) {
        // It's in the plan, but license is expired
        router.visit('/upgrade');
      }
    }
  }, [url, licenseStatus, storeFeatures, isLicenseActive, hasFeature]);

  // Close mobile menu when url changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [url]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F8F9FA] dark:bg-background overflow-hidden relative">
      
      {/* Desktop Sidebar (Hidden on mobile) */}
      <div className="hidden lg:block h-full z-20 shrink-0 shadow-2xl shadow-black/5">
        <DesktopSidebar />
      </div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between bg-card border-b border-border px-4 py-3 z-30 shrink-0 shadow-sm relative">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-inner">
              <Store size={14} className="text-primary-foreground" />
           </div>
           <div className="font-black text-lg text-foreground tracking-tight leading-none">Maaldhis</div>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="w-10 h-10 rounded-xl bg-muted text-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-[300px] max-w-[85vw] flex-col bg-background h-full shadow-2xl animate-in slide-in-from-left duration-300">
             <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-muted/50 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors z-50 shadow-sm"
              >
                <X size={20} />
              </button>
             <div className="h-full overflow-y-auto">
               <DesktopSidebar isMobile={true} />
             </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        

        {licenseStatus?.status === 'active' && daysRemaining <= 7 && (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-6 pb-2 shrink-0">
            <LicenseExpiryBanner
              daysRemaining={daysRemaining}
              expiryDate={licenseStatus.expiry_date}
            />
          </div>
        )}
        <div className="flex-1 flex flex-col min-h-0 pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
