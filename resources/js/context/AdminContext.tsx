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

  const isPlatformAdminUser = (u: any): boolean => {
    if (!u) return false;
    // A Store Admin has u.role === 'admin' and u.assigned_store_id != null (and u.admin_role == null).
    // ONLY treat a user as a Platform Super Admin if they explicitly have an active admin_role from admin_roles!
    if (u.assigned_store_id) return false;
    return Boolean(u.is_platform_admin || u.admin_role || u.role === 'super_admin');
  };

  const loadAdminFromSession = useCallback(async () => {
    try {
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      if (!isAdminRoute) {
        setSession(null);
        setAdmin(null);
        setLoading(false);
        return;
      }

      const { data: { session: sess } } = await apiClient.auth.getSession();
      if (!sess?.user) {
        setSession(null);
        setAdmin(null);
        setLoading(false);
        return;
      }

      const user = sess.user as any;

      if (isPlatformAdminUser(user)) {
        setSession(sess);
        setAdmin({
          id: user.id,
          email: user.email || '',
          full_name: user.full_name || user.name || '',
          role: (user.admin_role || 'super_owner') as 'super_owner' | 'admin' | 'support',
          admin_role: user.admin_role || 'super_owner',
        });
      } else {
        setSession(null);
        setAdmin(null);
      }
    } catch {
      setSession(null);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAndLoad = (pageProps?: any) => {
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      if (!isAdminRoute) {
        // Strictly clear any Platform Admin state when on Store Client Portal routes
        setSession(null);
        setAdmin(null);
        setLoading(false);
        return;
      }
      const inertiaUser = pageProps?.auth?.user;
      if (inertiaUser) {
        if (isPlatformAdminUser(inertiaUser)) {
          setSession({ access_token: 'session', user: inertiaUser });
          setAdmin({
            id: inertiaUser.id,
            email: inertiaUser.email || '',
            full_name: inertiaUser.full_name || inertiaUser.name || '',
            role: (inertiaUser.admin_role || 'super_owner') as 'super_owner' | 'admin' | 'support',
            admin_role: inertiaUser.admin_role || 'super_owner',
          });
        } else {
          setSession(null);
          setAdmin(null);
        }
        setLoading(false);
        return;
      }
      loadAdminFromSession();
    };

    checkAndLoad();

    const handleInertiaNavigate = (event: any) => {
      checkAndLoad(event?.detail?.page?.props);
    };
    document.addEventListener('inertia:navigate', handleInertiaNavigate);
    return () => document.removeEventListener('inertia:navigate', handleInertiaNavigate);
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
      isSuperOwner: admin?.role === 'super_owner' || admin?.admin_role === 'super_owner' || admin?.admin_role === 'superadmin',
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
