import { useAdmin } from '@/context/AdminContext';
import { Search } from 'lucide-react';
import AdminNotifications from './AdminNotifications';

export default function AdminHeader() {
  const { admin } = useAdmin();

  return (
    <header className="h-16 border-b border-[hsl(220,15%,18%)] bg-[hsl(220,20%,11%)] flex items-center justify-between px-6 shrink-0">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(220,10%,40%)]" />
          <input
            type="text"
            placeholder="Search stores, users, licenses..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[hsl(220,20%,14%)] border border-[hsl(220,15%,20%)] text-white text-sm placeholder:text-[hsl(220,10%,40%)] focus:outline-none focus:ring-1 focus:ring-[hsl(145,63%,42%)]"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <AdminNotifications />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(145,63%,42%)] to-[hsl(200,60%,40%)] flex items-center justify-center text-white text-xs font-bold">
            {admin?.full_name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-white">{admin?.full_name || 'Admin'}</p>
            <p className="text-xs text-[hsl(220,10%,50%)] capitalize">{admin?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
