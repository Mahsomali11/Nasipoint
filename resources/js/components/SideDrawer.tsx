import { router, usePage, Link } from '@inertiajs/react';
import { X, Home, Settings, BookOpen, HelpCircle, LogOut, Users, Store, User, Wallet, Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  const navigate = (url: string, options?: any) => router.visit(url, options);
  const { currentStore, user, logout, isLicenseActive } = useApp();
  const { hasFeature } = useFeatureAccess();

  const role = user?.role || 'owner';

  const menuItems = [
    { label: 'Home', icon: Home, action: () => navigate('/dashboard'), visible: true },
    { label: 'My Profile', icon: User, action: () => navigate('/profile'), visible: true },
    { label: 'Payment Accounts', icon: Wallet, action: () => navigate('/payment-accounts'), visible: (role === 'owner' || role === 'admin') && hasFeature('payment_integrations'), isLocked: !isLicenseActive },
    { label: 'Preferences', icon: Settings, action: () => navigate('/preferences'), visible: role === 'owner' || role === 'admin' },
    { label: 'Learning Center', icon: BookOpen, action: () => navigate('/learning-center'), visible: true },
    { label: 'Help', icon: HelpCircle, action: () => navigate('/help'), visible: true },
    { label: 'Logout', icon: LogOut, action: () => logout(), danger: true, visible: true },
  ].filter(item => item.visible);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-foreground/30 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col animate-slide-in-left shadow-xl">
        {/* Header */}
        <div className="bg-drawer-header px-5 py-6">
          <h2 className="text-lg font-bold text-foreground">{currentStore?.store_name || 'My Store'}</h2>
          <p className="text-sm text-muted-foreground mt-1">Store ID: {currentStore?.store_code}</p>
          <p className="text-sm text-muted-foreground">{user?.full_name}</p>
          <button
            onClick={() => { navigate('/select-store'); onClose(); }}
            className="mt-3 flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <Users size={18} />
            Switch account
          </button>
        </div>

        {/* Menu */}
        <div className="flex-1 bg-drawer-body px-2 py-4 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.label}
              onClick={() => { 
                if (item.isLocked) {
                  navigate('/upgrade');
                } else {
                  item.action(); 
                }
                onClose(); 
              }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-lg text-left transition-colors ${
                item.danger ? 'text-destructive' : item.isLocked ? 'text-muted-foreground/40 cursor-not-allowed' : 'text-foreground hover:bg-accent'
              }`}
            >
              <item.icon size={22} className={item.danger ? 'text-destructive' : item.isLocked ? 'text-muted-foreground/40' : 'text-primary'} />
              <span className="font-medium flex-1">{item.label}</span>
              {item.isLocked && <Lock size={16} className="text-muted-foreground/40" />}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
