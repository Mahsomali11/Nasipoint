import { router, usePage } from '@inertiajs/react';
import {
  Home, Receipt, TrendingUp, CreditCard, Undo2, Package, BarChart3,
  Users, ArrowLeftRight, Clock, Truck, UserCog, FileText, ShoppingCart,
  Settings, BookOpen, HelpCircle, Store, LogOut, ChevronDown, Check, Plus, Lock, User, Wallet,
  ChevronsUpDown, ShieldCheck, LayoutDashboard, Database, Smartphone, DollarSign, Layers
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAdmin } from '@/context/AdminContext';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { ROUTE_FEATURE_MAP } from '@/lib/features';
import type { FeatureKey } from '@/lib/features';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

const mainNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Start Sale', icon: ShoppingCart, path: '/start-sale' },
  { label: 'Inventory', icon: Package, path: '/inventory', subItems: [
      { label: 'Items', path: '/inventory' },
      { label: 'Categories', path: '/categories' }
  ] },
  { label: 'Sales Report', icon: BarChart3, path: '/sales-report' },
];

const moduleNav = [
  { label: 'Expenses', icon: Receipt, path: '/expenses' },
  { label: 'Cash Flow', icon: TrendingUp, path: '/cash-flow' },
  { label: 'Credit Record', icon: CreditCard, path: '/credit-record' },
  { label: 'Returns', icon: Undo2, path: '/returns' },
  { label: 'Customers', icon: Users, path: '/customers' },
  { label: 'Suppliers', icon: Truck, path: '/suppliers' },
  { label: 'Purchases', icon: ShoppingCart, path: '/purchases' },
  { label: 'Stock Transfers', icon: ArrowLeftRight, path: '/stock-transfers' },
  { label: 'Receipt History', icon: Clock, path: '/receipt-history' },
  { label: 'Staff Accounts', icon: UserCog, path: '/staff-accounts' },
  { label: 'Stock Report', icon: FileText, path: '/stock-report' },
];

const bottomNav = [
  { label: 'My Profile', icon: User, path: '/profile' },
  { label: 'Payment Accounts', icon: Wallet, path: '/payment-accounts' },
  { label: 'Preferences', icon: Settings, path: '/preferences' },
  { label: 'Learning Center', icon: BookOpen, path: '/learning-center' },
  { label: 'Help & Support', icon: HelpCircle, path: '/help' },
];

export default function DesktopSidebar({ isMobile = false }: { isMobile?: boolean }) {
  const navigate = (url: string, options?: any) => router.visit(url, options);
  const { url } = usePage(); 
  const location = { pathname: url };
  const { currentStore, stores, setCurrentStore, user, logout, isLicenseActive } = useApp();
  const { admin, isAdminAuthenticated, logout: adminLogout } = useAdmin();
  const { hasFeature } = useFeatureAccess();
  
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const displayUser = admin || user;
  const role = admin ? admin.admin_role : (user?.role || 'owner');
  const isAdmin = isAdminAuthenticated;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStoreDropdownOpen(false);
      }
    };
    if (storeDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [storeDropdownOpen]);

  const isActive = (path: string) => location.pathname === path || (path !== '/inventory' && location.pathname.startsWith(path + '/'));
  const isExactActive = (path: string) => location.pathname === path;

  const isItemVisible = (path: string) => {
    if (role === 'superadmin') return true;
    if (role === 'owner' || role === 'admin') return true;
    if (role === 'cashier') {
      const allowedPaths = ['/dashboard', '/start-sale', '/receipt-history', '/returns', '/customers', '/profile', '/help', '/expenses'];
      return allowedPaths.includes(path);
    }
    if (role === 'inventory_manager') {
      const allowedPaths = ['/dashboard', '/inventory', '/stock-transfers', '/suppliers', '/purchases', '/stock-report', '/profile', '/help'];
      return allowedPaths.includes(path);
    }
    return false;
  };

  const filteredMainNav = mainNav.filter(item => isItemVisible(item.path));
  const filteredModuleNav = moduleNav.filter(item => isItemVisible(item.path));
  const filteredBottomNav = bottomNav.filter(item => isItemVisible(item.path));

  const NavItem = ({ label, icon: Icon, path, subItems }: { label: string; icon: any; path: string; subItems?: any[] }) => {
    const featureKey = ROUTE_FEATURE_MAP[path] as FeatureKey | undefined;
    
    // Check if the feature is actually in the plan
    const inPlan = featureKey ? hasFeature(featureKey) : true;
    
    // Completely hide if it's not in the plan at all
    if (!inPlan) return null;

    const validSubItems = subItems ? subItems.filter(s => {
       const sfKey = ROUTE_FEATURE_MAP[s.path] as FeatureKey | undefined;
       return sfKey ? hasFeature(sfKey) : true;
    }) : undefined;
    const hasSubItems = validSubItems && validSubItems.length > 0;
    
    // If it's in the plan, but license is expired/suspended, we show it as blocked
    const isLocked = featureKey && !isLicenseActive;
    
    // Custom active logic for items with subItems
    const isSubItemActive = hasSubItems && validSubItems.some(s => isExactActive(s.path));
    const active = hasSubItems ? isSubItemActive : isActive(path);
    const isOpen = hasSubItems && (inventoryOpen || isSubItemActive);

    return (
      <div className="w-full relative px-3">
        <button
          onClick={() => {
            if (isLocked) {
              toast.error('License Expired/Suspended. Please renew your subscription to access this feature.');
              navigate('/upgrade');
            } else if (hasSubItems) {
              setInventoryOpen(!inventoryOpen);
            } else {
              navigate(path);
            }
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
            isLocked
              ? 'text-muted-foreground/40 cursor-not-allowed'
              : active
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-3">
             <Icon size={18} className={active && !isLocked ? 'text-primary-foreground' : 'text-muted-foreground'} />
             <span className="truncate">{label}</span>
          </div>
          {hasSubItems && <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
          {isLocked && <Lock size={12} className="opacity-50" />}
        </button>
        
        {hasSubItems && isOpen && !isLocked && (
          <div className="pl-9 pr-3 py-1.5 mt-1 space-y-1 relative before:content-[''] before:absolute before:left-5 before:top-0 before:bottom-2 before:w-px before:bg-border">
            {validSubItems.map((subItem) => {
              const subActive = isExactActive(subItem.path);
              return (
                <button
                  key={subItem.path}
                  onClick={() => navigate(subItem.path)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                    subActive
                      ? 'text-primary bg-secondary shadow-sm border border-border/50'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {subActive && <span className="absolute -left-[17px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary ring-2 ring-background"></span>}
                  {subItem.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <aside className={`shrink-0 h-[100dvh] sticky top-0 flex flex-col bg-background z-20 ${isMobile ? 'w-full' : 'w-[280px] border-r border-border'}`}>
        
        {/* Brand Header */}
        <div className="pt-8 pb-6 px-6 shrink-0 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Store size={20} className="text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight text-foreground leading-none">Maaldhis</span>
            <span className="text-[10px] font-bold text-primary  capitalize tracking-widest mt-1 leading-none">POS System</span>
          </div>
        </div>

        {/* Store Selector */}
        {!isAdmin && (
          <div className="px-6 mb-8 relative z-50" ref={dropdownRef}>
            <button
              onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
              className="w-full flex items-center justify-between bg-card border border-border p-3 rounded-2xl transition-all shadow-sm hover:shadow-md hover:border-primary/30"
            >
              <div className="flex items-center gap-3 min-w-0">
                {currentStore?.logo_url ? (
                  <img src={currentStore.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover border border-border shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center shrink-0">
                    <Store size={18} className="text-muted-foreground" />
                  </div>
                )}
                <div className="text-left min-w-0 flex flex-col justify-center">
                  <p className="text-sm font-black text-foreground truncate">{currentStore?.store_name || 'My Store'}</p>
                  <p className="text-[10px] font-bold text-muted-foreground  capitalize tracking-widest truncate">{role}</p>
                </div>
              </div>
              <ChevronsUpDown size={16} className="text-muted-foreground shrink-0" />
            </button>

            {storeDropdownOpen && (
              <div className="absolute top-full left-6 right-6 mt-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden text-foreground animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-border bg-muted/10">
                  <p className="font-bold text-sm text-foreground truncate">{currentStore?.store_name || 'My Store'}</p>
                  <p className="text-xs font-medium text-muted-foreground truncate">{currentStore?.location || 'No location set'}</p>
                </div>
                <div className="p-2 max-h-48 overflow-y-auto space-y-1 scrollbar-hide">
                  {stores.map(store => (
                    <button
                      key={store.id}
                      onClick={() => {
                        setCurrentStore(store);
                        setStoreDropdownOpen(false);
                        navigate('/dashboard');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        store.id === currentStore?.id
                          ? 'bg-secondary text-primary shadow-sm border border-border/50'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <span className="truncate">{store.store_name}</span>
                      {store.id === currentStore?.id && <Check size={16} />}
                    </button>
                  ))}
                </div>
                <div className="border-t border-border p-2 bg-muted/30">
                  <button onClick={() => { setStoreDropdownOpen(false); navigate('/create-store'); }} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold bg-card border border-border hover:bg-muted transition-colors text-foreground shadow-sm">
                    <Plus size={16} /> <span>Add New Store</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto pb-8 space-y-8 scrollbar-hide px-3">
          
          {isAdmin ? (
             <div className="space-y-1">
               <p className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest px-4 mb-3">Admin Panel</p>
               <NavItem label="Dashboard" icon={LayoutDashboard} path="/admin/dashboard" />
               <NavItem label="Stores" icon={Store} path="/admin/stores" />
               <NavItem label="Licenses" icon={ShieldCheck} path="/admin/licenses" />
               <NavItem label="Subscriptions" icon={CreditCard} path="/admin/subscriptions" />
               <NavItem label="Payments" icon={DollarSign} path="/admin/payments" />
               <NavItem label="Users" icon={Users} path="/admin/users" />
               <NavItem label="Plans" icon={Layers} path="/admin/plans" />
               <NavItem label="Analytics" icon={BarChart3} path="/admin/analytics" />
               <NavItem label="Support" icon={HelpCircle} path="/admin/support" />
               <NavItem label="Exchange Rates" icon={ArrowLeftRight} path="/admin/exchange-rates" />
               <NavItem label="M-Pesa Config" icon={Smartphone} path="/admin/mpesa-settings" />
               <NavItem label="Settings" icon={Settings} path="/admin/settings" />
             </div>
          ) : (
            <>
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest px-4 mb-3">Main</p>
                {filteredMainNav.map(item => <NavItem key={item.path} {...item} />)}
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest px-4 mb-3">Modules</p>
                {filteredModuleNav.map(item => <NavItem key={item.path} {...item} />)}
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest px-4 mb-3">Settings</p>
                {filteredBottomNav.map(item => <NavItem key={item.path} {...item} />)}
              </div>
            </>
          )}
        </div>

        {/* Bottom User Actions */}
        <div className="p-4 shrink-0 border-t border-border bg-card">
           <div className="bg-muted/30 border border-border/50 rounded-2xl p-2 flex flex-col gap-1">
              <button onClick={() => navigate(isAdmin ? '/admin/settings' : '/profile')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-card hover:shadow-sm transition-all border border-transparent hover:border-border">
                <div className="w-8 h-8 rounded-lg bg-secondary border border-border/50 flex items-center justify-center shrink-0 text-primary shadow-sm">
                  {isAdmin ? <ShieldCheck size={16} /> : <User size={16} />}
                </div>
                <div className="flex-1 flex flex-col items-start min-w-0">
                  <span className="truncate w-full text-left text-sm font-bold text-foreground leading-tight">{displayUser?.full_name || 'User'}</span>
                  <span className="text-[10px] font-bold text-muted-foreground  capitalize tracking-widest leading-tight">{role}</span>
                </div>
              </button>
              <div className="h-px bg-border/50 my-1 mx-2"></div>
              <button onClick={isAdmin ? adminLogout : logout} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl hover:bg-primary/10 text-primary transition-colors text-sm font-bold capitalize">
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
           </div>
        </div>
      </aside>
    </>
  );
}
