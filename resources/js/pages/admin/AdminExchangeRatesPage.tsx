import PageHeader from '@/components/PageHeader';
import { useEffect, useState } from 'react';
import { api as apiClient } from '@/api';
import { toast } from 'sonner';
import { RefreshCw, Plus, Pencil, Trash2, DollarSign } from 'lucide-react';
import type { ExchangeRate } from '@/lib/currency';
import { invalidateRatesCache } from '@/lib/currency';

export default function AdminExchangeRatesPage() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newCurrency, setNewCurrency] = useState({ currency_code: '', currency_name: '', currency_symbol: '', rate_to_usd: '' });

  useEffect(() => { loadRates(); }, []);

  const loadRates = async () => {
    const { data } = await apiClient.from('exchange_rates').select('*').order('currency_code') as { data: ExchangeRate[] | null };
    setRates(data || []);
    setLoading(false);
  };

  const handleUpdateRate = async (id: string) => {
    const rate = parseFloat(editRate);
    if (isNaN(rate) || rate <= 0) { toast.error('Invalid rate'); return; }
    const { error } = await apiClient.from('exchange_rates').update({ rate_to_usd: rate, updated_at: new Date().toISOString() } as any).eq('id', id);
    if (error) { toast.error(error.message); return; }
    invalidateRatesCache();
    toast.success('Rate updated');
    setEditingId(null);
    loadRates();
  };

  const handleAddCurrency = async () => {
    if (!newCurrency.currency_code || !newCurrency.rate_to_usd) { toast.error('Fill required fields'); return; }
    const { error } = await apiClient.from('exchange_rates').insert({
      currency_code: newCurrency.currency_code.toUpperCase(),
      currency_name: newCurrency.currency_name,
      currency_symbol: newCurrency.currency_symbol,
      rate_to_usd: parseFloat(newCurrency.rate_to_usd),
    } as any);
    if (error) { toast.error(error.message); return; }
    invalidateRatesCache();
    toast.success('Currency added');
    setShowAdd(false);
    setNewCurrency({ currency_code: '', currency_name: '', currency_symbol: '', rate_to_usd: '' });
    loadRates();
  };

  const handleDelete = async (id: string, code: string) => {
    if (code === 'USD') { toast.error('Cannot delete USD'); return; }
    if (!confirm(`Delete ${code}?`)) return;
    const { error } = await apiClient.from('exchange_rates').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    invalidateRatesCache();
    toast.success('Deleted');
    loadRates();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:px-8 space-y-6 max-w-7xl mx-auto w-full">
      <PageHeader title="Exchange Rates" />
      <div className="flex items-center justify-between">
        <div>
                    <p className="text-muted-foreground text-sm mt-1">Manage currency exchange rates to USD</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-foreground rounded-lg text-sm font-medium hover:opacity-90">
            <Plus size={16} /> Add Currency
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-[hsl(210,80%,55%)]/10 border border-[hsl(210,80%,55%)]/20 rounded-xl p-4 flex items-start gap-3">
        <DollarSign size={20} className="text-[hsl(210,80%,55%)] mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-[hsl(210,80%,55%)] font-medium">All platform revenue, license payments, and analytics are calculated in USD.</p>
          <p className="text-xs text-muted-foreground mt-1">Store transactions are automatically converted using these rates.</p>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-card rounded-xl p-5 border border-border space-y-3">
          <h3 className="text-foreground font-semibold capitalize">Add New Currency</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input value={newCurrency.currency_code} onChange={e => setNewCurrency(p => ({ ...p, currency_code: e.target.value }))}
              placeholder="Code (e.g. NGN)" className="px-3 py-2 rounded-lg bg-[hsl(220,15%,18%)] border border-[hsl(220,15%,22%)] text-foreground text-sm" />
            <input value={newCurrency.currency_name} onChange={e => setNewCurrency(p => ({ ...p, currency_name: e.target.value }))}
              placeholder="Name (e.g. Nigerian Naira)" className="px-3 py-2 rounded-lg bg-[hsl(220,15%,18%)] border border-[hsl(220,15%,22%)] text-foreground text-sm" />
            <input value={newCurrency.currency_symbol} onChange={e => setNewCurrency(p => ({ ...p, currency_symbol: e.target.value }))}
              placeholder="Symbol (e.g. ₦)" className="px-3 py-2 rounded-lg bg-[hsl(220,15%,18%)] border border-[hsl(220,15%,22%)] text-foreground text-sm" />
            <input value={newCurrency.rate_to_usd} onChange={e => setNewCurrency(p => ({ ...p, rate_to_usd: e.target.value }))}
              placeholder="Rate to USD" type="number" step="any" className="px-3 py-2 rounded-lg bg-[hsl(220,15%,18%)] border border-[hsl(220,15%,22%)] text-foreground text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddCurrency} className="px-4 py-2 bg-primary text-primary-foreground text-foreground rounded-lg text-sm font-medium capitalize">Save</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-[hsl(220,15%,18%)] text-muted-foreground rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Rates table */}
      <div className="bg-card rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground  capitalize">Code</th>
                <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground  capitalize">Name</th>
                <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground  capitalize">Symbol</th>
                <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground  capitalize">Rate to USD</th>
                <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground  capitalize">1 USD =</th>
                <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground  capitalize">Updated</th>
                <th className="text-right py-3 px-5 text-xs font-medium text-muted-foreground  capitalize">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rates.map(rate => (
                <tr key={rate.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-5 text-sm text-foreground font-mono font-bold">{rate.currency_code}</td>
                  <td className="py-3 px-5 text-sm text-muted-foreground">{rate.currency_name}</td>
                  <td className="py-3 px-5 text-sm text-foreground">{rate.currency_symbol}</td>
                  <td className="py-3 px-5 text-sm">
                    {editingId === rate.id ? (
                      <div className="flex items-center gap-2">
                        <input value={editRate} onChange={e => setEditRate(e.target.value)} type="number" step="any"
                          className="w-32 px-2 py-1 rounded bg-[hsl(220,15%,18%)] border border-[hsl(220,15%,22%)] text-foreground text-sm" autoFocus />
                        <button onClick={() => handleUpdateRate(rate.id)} className="text-primary text-xs font-medium">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-muted-foreground text-xs">Cancel</button>
                      </div>
                    ) : (
                      <span className="text-primary font-mono">{rate.rate_to_usd}</span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-sm text-muted-foreground font-mono">
                    {rate.rate_to_usd > 0 ? `${(1 / rate.rate_to_usd).toFixed(2)} ${rate.currency_code}` : '—'}
                  </td>
                  <td className="py-3 px-5 text-sm text-muted-foreground">{new Date(rate.updated_at).toLocaleDateString()}</td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditingId(rate.id); setEditRate(String(rate.rate_to_usd)); }}
                        className="p-1.5 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                      {rate.currency_code !== 'USD' && (
                        <button onClick={() => handleDelete(rate.id, rate.currency_code)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
