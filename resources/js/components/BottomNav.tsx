import { router, usePage, Link } from '@inertiajs/react';
import { Home, Package, BarChart3 } from 'lucide-react';

const navItems = [
  { label: 'Home', icon: Home, path: '/dashboard' },
  { label: 'Inventory', icon: Package, path: '/inventory' },
  { label: 'Sales Report', icon: BarChart3, path: '/sales-report' },
];

export default function BottomNav() {
  const navigate = (url, options) => router.visit(url, options);
  const { url } = usePage(); const location = { pathname: url };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                isActive ? 'text-info' : 'text-muted-foreground'
              }`}
            >
              <item.icon size={22} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
