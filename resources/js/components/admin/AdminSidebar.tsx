import { router, usePage, Link } from '@inertiajs/react';
import { useAdmin } from '@/context/AdminContext';
import {
  LayoutDashboard, Store, KeyRound, CreditCard, DollarSign,
  Users, Layers, BarChart3, HeadphonesIcon, Settings, LogOut, Shield, ChevronLeft, ChevronRight, Smartphone, ArrowLeftRight
} from 'lucide-react';
import { useState } from 'react';
import { usePlatformName } from '@/hooks/usePlatformName';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Stores', icon: Store, path: '/admin/stores' },
  { label: 'Licenses', icon: KeyRound, path: '/admin/licenses' },
  { label: 'Subscriptions', icon: CreditCard, path: '/admin/subscriptions' },
  { label: 'Payments', icon: DollarSign, path: '/admin/payments' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Plans', icon: Layers, path: '/admin/plans' },
  { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { label: 'Support', icon: HeadphonesIcon, path: '/admin/support' },
  { label: 'Exchange Rates', icon: ArrowLeftRight, path: '/admin/exchange-rates' },
  { label: 'M-Pesa Config', icon: Smartphone, path: '/admin/mpesa-settings' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

export default function AdminSidebar() {
  const navigate = (url, options) => router.visit(url, options);
  const { url } = usePage(); const location = { pathname: url };
  const { admin, logout } = useAdmin();
  const [collapsed, setCollapsed] = useState(false);
  const platformName = usePlatformName();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <aside className={`hidden lg:flex flex-col h-screen sticky top-0 bg-[hsl(220,20%,11%)] border-r border-[hsl(220,15%,18%)] transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
      {/* Brand */}
      <div className="p-4 border-b border-[hsl(220,15%,18%)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(145,63%,42%)] to-[hsl(180,60%,40%)] flex items-center justify-center shrink-0">
            <Shield size={20} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm">{platformName} Admin</h3>
              <p className="text-xs text-[hsl(220,10%,50%)] capitalize">{admin?.role?.replace('_', ' ')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive(item.path)
                ? 'bg-[hsl(145,63%,42%)]/15 text-[hsl(145,63%,55%)]'
                : 'text-[hsl(220,10%,55%)] hover:bg-[hsl(220,15%,15%)] hover:text-white'
            }`}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[hsl(220,15%,18%)] space-y-1">
        <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[hsl(220,10%,55%)] hover:bg-[hsl(220,15%,15%)] hover:text-white transition-colors">
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!collapsed && <span>Collapse</span>}
        </button>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
