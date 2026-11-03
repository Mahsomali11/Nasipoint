import PageHeader from '@/components/PageHeader';
import { useEffect, useState } from 'react';
import { api as apiClient } from '@/api';
import StatCard from '@/components/admin/StatCard';
import { Store, DollarSign, ShoppingCart, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getExchangeRates, convertToUsd, formatUsd, type ExchangeRate } from '@/lib/currency';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState({ stores: 0, revenue: 0, transactions: 0, users: 0 });
  const [topStores, setTopStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [{ count: stores }, { count: users }, { data: sales }, { data: storeData }, rates] = await Promise.all([
      apiClient.from('stores').select('*', { count: 'exact', head: true }),
      apiClient.from('profiles').select('*', { count: 'exact', head: true }),
      apiClient.from('sales').select('total, store_id'),
      apiClient.from('stores').select('id, store_name, currency'),
      getExchangeRates(),
    ]);

    // Build a map of store currency symbol -> rate_to_usd
    const symbolToRate: Record<string, number> = {};
    rates.forEach(r => { symbolToRate[r.currency_symbol] = r.rate_to_usd; });

    // Build store id -> currency symbol map
    const storeCurrency: Record<string, string> = {};
    (storeData || []).forEach((s: any) => { storeCurrency[s.id] = s.currency || '$'; });

    // Calculate revenue in USD
    const storeRevenue: Record<string, number> = {};
    let totalRevenueUsd = 0;
    (sales || []).forEach((sale: any) => {
      const currSymbol = storeCurrency[sale.store_id] || '$';
      const rate = symbolToRate[currSymbol] || 1;
      const usdAmount = convertToUsd(Number(sale.total), rate);
      totalRevenueUsd += usdAmount;
      storeRevenue[sale.store_id] = (storeRevenue[sale.store_id] || 0) + usdAmount;
    });

    const top = Object.entries(storeRevenue)
      .map(([id, rev]) => ({ name: (storeData || []).find((s: any) => s.id === id)?.store_name || 'Unknown', revenue: Math.round(rev * 100) / 100 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setStats({ stores: stores || 0, revenue: Math.round(totalRevenueUsd * 100) / 100, transactions: (sales || []).length, users: users || 0 });
    setTopStores(top);
    setLoading(false);
  };

  const COLORS = ['hsl(145,63%,42%)', 'hsl(210,80%,55%)', 'hsl(35,90%,50%)', 'hsl(270,50%,60%)', 'hsl(0,72%,51%)'];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:px-8 space-y-6 max-w-7xl mx-auto w-full">
      <PageHeader title="Analytics" />
      <div>
                <p className="text-muted-foreground text-sm mt-1">All revenue figures are automatically converted to USD</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Stores" value={stats.stores} icon={Store} />
        <StatCard label="Total Revenue (USD)" value={formatUsd(stats.revenue)} icon={DollarSign} color="hsl(210,80%,55%)" />
        <StatCard label="Total Transactions" value={stats.transactions} icon={ShoppingCart} color="hsl(35,90%,50%)" />
        <StatCard label="Total Users" value={stats.users} icon={Users} color="hsl(270,50%,60%)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-foreground font-semibold mb-4 capitalize">Top Performing Stores (USD)</h3>
          {topStores.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topStores}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,20%)" />
                <XAxis dataKey="name" stroke="hsl(220,10%,40%)" fontSize={11} />
                <YAxis stroke="hsl(220,10%,40%)" fontSize={12} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(220,20%,18%)', border: '1px solid hsl(220,15%,25%)', borderRadius: '8px', color: 'white' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue (USD)']} />
                <Bar dataKey="revenue" fill="hsl(145,63%,42%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-center py-8">No data yet</p>}
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-foreground font-semibold mb-4 capitalize">Revenue Distribution (USD)</h3>
          {topStores.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={topStores} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {topStores.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(220,20%,18%)', border: '1px solid hsl(220,15%,25%)', borderRadius: '8px', color: 'white' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue (USD)']} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-center py-8">No data yet</p>}
        </div>
      </div>
    </div>
  );
}
