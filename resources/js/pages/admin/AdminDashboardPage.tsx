import PageHeader from '@/components/PageHeader';
import { useEffect, useState } from 'react';
import { api as apiClient } from '@/api';
import StatCard from '@/components/admin/StatCard';
import { Store, Users, KeyRound, DollarSign, Activity, AlertTriangle, TrendingUp, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { getExchangeRates, convertToUsd, formatUsd } from '@/lib/currency';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalStores: 0, activeStores: 0, suspendedStores: 0, expiredLicenses: 0,
    totalRevenue: 0, monthlyRevenue: 0, totalUsers: 0, totalTransactions: 0,
  });
  const [recentStores, setRecentStores] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [storeGrowthData, setStoreGrowthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [
        { count: totalStores },
        { count: totalUsers },
        { data: licenses },
        { data: sales },
        { data: paymentsData },
        { data: stores },
        { data: allStores },
      ] = await Promise.all([
        apiClient.from('stores').select('*', { count: 'exact', head: true }),
        apiClient.from('profiles').select('*', { count: 'exact', head: true }),
        apiClient.from('licenses').select('*'),
        apiClient.from('sales').select('total'),
        apiClient.from('platform_payments').select('amount, status, created_at'),
        apiClient.from('stores').select('*, profiles!stores_owner_user_id_fkey(email, full_name)').order('created_at', { ascending: false }).limit(5),
        apiClient.from('stores').select('id, created_at'),
      ]);

      const activeLicenses = (licenses || []).filter((l: any) => l.status === 'active').length;
      const suspendedLicenses = (licenses || []).filter((l: any) => l.status === 'suspended').length;
      const expiredLicenses = (licenses || []).filter((l: any) => l.status === 'expired').length;
      const totalRevenue = (paymentsData || []).filter((p: any) => p.status === 'completed').reduce((s: number, p: any) => s + Number(p.amount), 0);
      const totalTransactions = (sales || []).length;
      
      const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const monthlyRevenue = (paymentsData || [])
        .filter((p: any) => p.status === 'completed' && new Date(p.created_at) >= currentMonthStart)
        .reduce((s: number, p: any) => s + Number(p.amount), 0);

      setStats({
        totalStores: totalStores || 0,
        activeStores: activeLicenses,
        suspendedStores: suspendedLicenses,
        expiredLicenses,
        totalRevenue,
        monthlyRevenue,
        totalUsers: totalUsers || 0,
        totalTransactions,
      });
      setRecentStores(stores || []);

      // Build chart data from real data
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const now = new Date();
      const chartMonths: { month: string; revenue: number; stores: number }[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const label = monthNames[d.getMonth()];
        const monthRevenue = (paymentsData || [])
          .filter((p: any) => p.status === 'completed' && new Date(p.created_at || 0) >= d && new Date(p.created_at || 0) <= endD)
          .reduce((s: number, p: any) => s + Number(p.amount), 0);
        const monthStores = (allStores || [])
          .filter((s: any) => new Date(s.created_at) <= endD).length;
        chartMonths.push({ month: label, revenue: monthRevenue, stores: monthStores });
      }
      
      setRevenueData(chartMonths);
      setStoreGrowthData(chartMonths);
    } catch (err) {
      console.error('Error loading admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
      <PageHeader title="Platform Overview" />
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:px-8 space-y-6 max-w-7xl mx-auto w-full">
      <div>
                <p className="text-muted-foreground text-sm mt-1">Monitor your entire platform at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Stores" value={stats.totalStores} icon={Store} trend="+12%" trendUp />
        <StatCard label="Active Stores" value={stats.activeStores} icon={Activity} color="hsl(145,63%,42%)" />
        <StatCard label="Suspended Stores" value={stats.suspendedStores} icon={AlertTriangle} color="hsl(35,90%,50%)" />
        <StatCard label="Expired Licenses" value={stats.expiredLicenses} icon={KeyRound} color="hsl(0,72%,51%)" />
        <StatCard label="Total Revenue (USD)" value={formatUsd(stats.totalRevenue)} icon={DollarSign} trend="+8%" trendUp color="hsl(210,80%,55%)" />
        <StatCard label="Monthly Revenue (USD)" value={formatUsd(stats.monthlyRevenue)} icon={TrendingUp} color="hsl(270,50%,60%)" />
        <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="hsl(180,60%,45%)" />
        <StatCard label="Total Transactions" value={stats.totalTransactions} icon={ShoppingCart} color="hsl(45,80%,50%)" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-foreground font-semibold mb-4 capitalize">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(145,63%,42%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(145,63%,42%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,20%)" />
              <XAxis dataKey="month" stroke="hsl(220,10%,40%)" fontSize={12} />
              <YAxis stroke="hsl(220,10%,40%)" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(220,20%,18%)', border: '1px solid hsl(220,15%,25%)', borderRadius: '8px', color: 'white' }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(145,63%,42%)" fill="url(#revenueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-foreground font-semibold mb-4 capitalize">Store Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={storeGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,20%)" />
              <XAxis dataKey="month" stroke="hsl(220,10%,40%)" fontSize={12} />
              <YAxis stroke="hsl(220,10%,40%)" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(220,20%,18%)', border: '1px solid hsl(220,15%,25%)', borderRadius: '8px', color: 'white' }} />
              <Bar dataKey="stores" fill="hsl(210,80%,55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Stores */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border">
          <h3 className="text-foreground font-semibold capitalize">Recent Store Registrations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground  capitalize">Store Name</th>
                <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground  capitalize">Owner</th>
                <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground  capitalize">Location</th>
                <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground  capitalize">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentStores.map((store: any) => (
                <tr key={store.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-5 text-sm text-foreground">{store.store_name}</td>
                  <td className="py-3 px-5 text-sm text-muted-foreground">{store.profiles?.email || '—'}</td>
                  <td className="py-3 px-5 text-sm text-muted-foreground">{store.location || '—'}</td>
                  <td className="py-3 px-5 text-sm text-muted-foreground">{new Date(store.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {recentStores.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No stores registered yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
