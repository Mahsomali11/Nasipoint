import PageHeader from '@/components/PageHeader';
import { useEffect, useState } from 'react';
import { api as apiClient } from '@/api';
import { Search } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.from('platform_payments').select('*, stores(store_name)').order('created_at', { ascending: false }).then(({ data }) => {
      setPayments(data || []);
      setLoading(false);
    });
  }, []);

  const filtered = payments.filter((p: any) =>
    p.stores?.store_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.transaction_reference?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = { completed: 'bg-green-500/20 text-green-400', pending: 'bg-yellow-500/20 text-yellow-400', failed: 'bg-red-500/20 text-red-400', refunded: 'bg-gray-500/20 text-gray-400' };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:px-8 space-y-6 max-w-7xl mx-auto w-full">
      <PageHeader title="Platform Payments" />
            <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search payments..." className="w-full pl-10 pr-4 py-2 rounded-lg bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(145,63%,42%)]" />
      </div>
      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-border">
            {['Store', 'Amount', 'Method', 'Reference', 'Status', 'Date', 'Next Due'].map(h => <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground  capitalize">{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((p: any) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="py-3 px-4 text-sm text-foreground">{p.stores?.store_name || '—'}</td>
                <td className="py-3 px-4 text-sm text-foreground font-medium">${Number(p.amount).toFixed(2)}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground capitalize">{p.method?.replace('_', ' ')}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground font-mono">{p.transaction_reference || '—'}</td>
                <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[p.status] || ''}`}>{p.status}</span></td>
                <td className="py-3 px-4 text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground">{p.next_due_date || '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No payments recorded</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
