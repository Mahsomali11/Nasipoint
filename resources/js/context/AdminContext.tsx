import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { api as apiClient } from '@/api';
import type { Session } from '@/api';

interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'super_owner' | 'admin' | 'support';
  admin_role: string;
}

interface AdminContextType {
  session: Session | null;
  admin: AdminProfile | null;
  isAdminAuthenticated: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  isSuperOwner: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAdminFromSession = useCallback(async () => {
    try {
      const { data: { session: sess } } = await apiClient.auth.getSession();
      if (!sess?.user) {
        setLoading(false);
        return;
      }

      const user = sess.user as any;

      // Check if the user has admin role in the API response
      if (user.role === 'admin' || user.admin_role) {
        setSession(sess);
        setAdmin({
          id: user.id,
          email: user.email || '',
          full_name: user.full_name || user.name || '',
          role: user.admin_role as 'super_owner' | 'admin' | 'support',
          admin_role: user.admin_role,
        });
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only check session on admin routes
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    if (!isAdminRoute) {
      setLoading(false);
      return;
    }
    loadAdminFromSession();
  }, [loadAdminFromSession]);

  const logout = useCallback(async () => {
    try {
      const csrf = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('XSRF-TOKEN='))
        ?.split('=')[1] || '';

      await fetch('/admin/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': decodeURIComponent(csrf),
          'Accept': 'application/json',
        },
      });
    } catch (_) {}

    setSession(null);
    setAdmin(null);
    window.location.href = '/admin/login';
  }, []);

  return (
    <AdminContext.Provider value={{
      session,
      admin,
      isAdminAuthenticated: !!admin,
      loading,
      logout,
      isSuperOwner: admin?.role === 'super_owner',
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
