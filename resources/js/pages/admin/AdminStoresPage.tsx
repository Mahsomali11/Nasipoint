import PageHeader from '@/components/PageHeader';
import { useEffect, useState } from 'react';
import { api as apiClient } from '@/api';
import { useAdmin } from '@/context/AdminContext';
import { Search, CheckCircle, Pause, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminStoresPage() {
  const { isSuperOwner } = useAdmin();
  const [stores, setStores] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [{ data: storeData }, { data: licData }] = await Promise.all([
      apiClient.from('stores').select('*, profiles!stores_owner_user_id_fkey(email, full_name, phone)').order('created_at', { ascending: false }),
      apiClient.from('licenses').select('*, plans(name)'),
    ]);
    setStores(storeData || []);
    setLicenses(licData || []);
    setLoading(false);
  };

  // Owner-level license lookup: find license by owner_user_id
  const getLicense = (storeId: string) => {
    const store = stores.find((s: any) => s.id === storeId);
    if (!store) return null;
    // Find license by owner_user_id
    return licenses.find((l: any) => l.owner_user_id === store.owner_user_id) || null;
  };

  const updateLicenseStatus = async (storeId: string, status: string) => {
    const store = stores.find((s: any) => s.id === storeId);
    if (!store) { toast.error('Store not found'); return; }

    const license = getLicense(storeId);
    if (!license) { toast.error('No owner license found'); return; }

    const [{ error: licenseError }, { error: subError }] = await Promise.all([
      apiClient.from('licenses').update({ status } as any).eq('id', license.id),
      apiClient.from('subscriptions').update({ status } as any).eq('owner_user_id', store.owner_user_id),
    ]);

    if (licenseError || subError) {
      toast.error('Failed to update owner license status');
    } else {
      toast.success(`Owner license ${status}`);
      loadData();
    }
  };

  const deleteStore = async (storeId: string) => {
    if (!isSuperOwner) { toast.error('Only Super Owners can delete stores'); return; }
    if (!confirm('Are you sure? This will permanently delete the store and all its data.')) return;
    const { error } = await apiClient.from('stores').delete().eq('id', storeId);
    if (error) toast.error('Failed to delete'); else { toast.success('Store deleted'); loadData(); }
  };

  const filtered = stores.filter((s: any) =>
    s.store_name.toLowerCase().includes(search.toLowerCase()) ||
    s.profiles?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (license: any) => {
    if (!license) return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-400">No License</span>;
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      suspended: 'bg-yellow-500/20 text-yellow-400',
      expired: 'bg-red-500/20 text-red-400',
      cancelled: 'bg-gray-500/20 text-gray-400',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[license.status] || colors.cancelled}`}>{license.status}</span>;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:px-8 space-y-6 max-w-7xl mx-auto w-full">
      <PageHeader title="Stores Management" />
      <div className="flex items-center justify-between">
        <div>
                    <p className="text-muted-foreground text-sm">{stores.length} total stores</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stores..." className="w-full pl-10 pr-4 py-2 rounded-lg bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(145,63%,42%)]" />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Store Name', 'Owner', 'Phone', 'Location', 'Plan', 'License', 'Expiry', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground  capitalize">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((store: any) => {
                const lic = getLicense(store.id);
                return (
                  <tr key={store.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm text-foreground font-medium">{store.store_name}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{store.profiles?.email || '—'}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{store.phone || '—'}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{store.location || '—'}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{lic?.plans?.name || '—'}</td>
                    <td className="py-3 px-4">{getStatusBadge(lic)}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{lic?.expiry_date || '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setSelectedStore(store); setShowDetail(true); }} className="p-1.5 rounded hover:bg-muted/80 text-muted-foreground" title="View"><Eye size={16} /></button>
                        <button onClick={() => updateLicenseStatus(store.id, 'active')} className="p-1.5 rounded hover:bg-green-500/10 text-green-400" title="Activate"><CheckCircle size={16} /></button>
                        <button onClick={() => updateLicenseStatus(store.id, 'suspended')} className="p-1.5 rounded hover:bg-yellow-500/10 text-yellow-400" title="Suspend"><Pause size={16} /></button>
                        {isSuperOwner && (
                          <button onClick={() => deleteStore(store.id)} className="p-1.5 rounded hover:bg-red-500/10 text-red-400" title="Delete"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No stores found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Store Detail Modal */}
      {showDetail && selectedStore && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowDetail(false)}>
          <div className="bg-card rounded-2xl sm:rounded-3xl border border-border max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-foreground mb-4 capitalize">{selectedStore.store_name}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="text-foreground">{selectedStore.profiles?.full_name || selectedStore.profiles?.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-foreground">{selectedStore.profiles?.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="text-foreground">{selectedStore.phone || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="text-foreground">{selectedStore.location || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Currency</span><span className="text-foreground">{selectedStore.currency}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Store Code</span><span className="text-foreground">{selectedStore.store_code || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="text-foreground">{new Date(selectedStore.created_at).toLocaleDateString()}</span></div>
              {(() => { const lic = getLicense(selectedStore.id); return lic ? (
                <>
                  <hr className="border-border" />
                  <div className="flex justify-between"><span className="text-muted-foreground">License Key</span><span className="text-foreground font-mono text-xs">{lic.license_key}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="text-foreground">{lic.plans?.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">License Status</span>{getStatusBadge(lic)}</div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Expiry</span><span className="text-foreground">{lic.expiry_date}</span></div>
                  <p className="text-xs text-muted-foreground mt-1">This license belongs to the owner account and covers all their stores.</p>
                </>
              ) : null; })()}
            </div>
            <button onClick={() => setShowDetail(false)} className="mt-6 w-full py-2.5 rounded-lg bg-muted text-foreground hover:bg-accent transition-colors">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
