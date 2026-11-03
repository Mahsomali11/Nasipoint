import PageHeader from '@/components/PageHeader';
import { useEffect, useState } from 'react';
import { api as apiClient } from '@/api';
import { toast } from 'sonner';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.from('support_tickets').select('*, stores(store_name), profiles:user_id(full_name, email)').order('created_at', { ascending: false }).then(({ data }) => {
      setTickets(data || []);
      setLoading(false);
    });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await apiClient.from('support_tickets').update({ status } as any).eq('id', id);
    if (error) toast.error('Failed'); else {
      toast.success(`Ticket ${status}`);
      setTickets(tickets.map((t: any) => t.id === id ? { ...t, status } : t));
    }
  };

  const statusColors: Record<string, string> = { open: 'bg-blue-500/20 text-blue-400', in_progress: 'bg-yellow-500/20 text-yellow-400', resolved: 'bg-green-500/20 text-green-400', closed: 'bg-gray-500/20 text-gray-400' };
  const priorityColors: Record<string, string> = { low: 'text-gray-400', medium: 'text-yellow-400', high: 'text-orange-400', urgent: 'text-red-400' };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:px-8 space-y-6 max-w-7xl mx-auto w-full">
      <PageHeader title="Support Tickets" />
            <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-border">
            {['Subject', 'Store', 'User', 'Priority', 'Status', 'Created', 'Actions'].map(h => <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground  capitalize">{h}</th>)}
          </tr></thead>
          <tbody>
            {tickets.map((t: any) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="py-3 px-4 text-sm text-foreground">{t.subject}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground">{t.stores?.store_name || '—'}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground">{(t.profiles as any)?.full_name || (t.profiles as any)?.email || '—'}</td>
                <td className="py-3 px-4 text-sm capitalize"><span className={priorityColors[t.priority]}>{t.priority}</span></td>
                <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[t.status]}`}>{t.status?.replace('_', ' ')}</span></td>
                <td className="py-3 px-4 text-sm text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-1 flex-wrap">
                    {t.status !== 'resolved' && <button onClick={() => updateStatus(t.id, 'resolved')} className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400">Resolve</button>}
                    {t.status !== 'closed' && <button onClick={() => updateStatus(t.id, 'closed')} className="text-xs px-2 py-1 rounded bg-gray-500/10 text-gray-400">Close</button>}
                    {t.status === 'open' && <button onClick={() => updateStatus(t.id, 'in_progress')} className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-400">In Progress</button>}
                  </div>
                </td>
              </tr>
            ))}
            {tickets.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No support tickets</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
