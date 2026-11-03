import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { useApp } from '@/context/AppContext';
import { X, ArrowRight, Plus, Package, MapPin, Truck, Store, ArrowRightLeft, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { api as apiClient } from '@/api';
import { SearchableSelect } from '@/components/ui/searchable-select';

export default function StockTransfersPage() {
  const { stores, items, currentStore, user, stockTransfers, refreshData, formatCurrency } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [destStoreId, setDestStoreId] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ item_id: string; quantity: number }[]>([]);
  const [addItemId, setAddItemId] = useState('');
  const [addQty, setAddQty] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otherStores = stores.filter(s => s.id !== currentStore?.id);

  const handleAddItem = () => {
    if (!addItemId || Number(addQty) <= 0) return;
    const item = items.find(i => i.id === addItemId);
    if (!item) return;
    if (Number(addQty) > item.quantity) {
      toast.error(`Only ${item.quantity} in stock`);
      return;
    }
    if (selectedItems.find(si => si.item_id === addItemId)) {
      setSelectedItems(prev => prev.map(si => si.item_id === addItemId ? { ...si, quantity: si.quantity + Number(addQty) } : si));
    } else {
      setSelectedItems(prev => [...prev, { item_id: addItemId, quantity: Number(addQty) }]);
    }
    setAddItemId('');
    setAddQty('1');
  };

  const handleCreateTransfer = async () => {
    if (isSubmitting) return;
    if (!destStoreId) { toast.error('Select destination store'); return; }
    if (selectedItems.length === 0) { toast.error('Add at least one item'); return; }

    setIsSubmitting(true);
    try {
      const { data: transfer, error } = await apiClient.from('stock_transfers').insert({
        source_store_id: currentStore?.id || '',
        destination_store_id: destStoreId,
        requested_by: user?.id || '',
        status: 'pending',
      } as any).select().single();

      if (error || !transfer) {
        toast.error('Failed to create transfer: ' + (error?.message || 'Unknown error'));
        return;
      }

      const transferItems = selectedItems.map(si => ({
        stock_transfer_id: (transfer as any).id,
        item_id: si.item_id,
        quantity: si.quantity,
      }));

      const { error: itemsError } = await apiClient.from('stock_transfer_items').insert(transferItems as any);
      if (itemsError) {
        toast.error('Failed to add transfer items: ' + itemsError.message);
        return;
      }

      toast.success('Stock transfer created successfully');
      setShowAdd(false);
      setDestStoreId('');
      setSelectedItems([]);
      await refreshData();
    } catch (err: any) {
      toast.error(err.message || 'Error creating transfer');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
     const statusConfig: Record<string, { bg: string, text: string, border: string, icon: any }> = { 
        pending: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20', icon: Clock }, 
        approved: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20', icon: ShieldAlert }, 
        received: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20', icon: CheckCircle2 }, 
        rejected: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20', icon: X } 
     };
     
     const config = statusConfig[status] || statusConfig.pending;
     const Icon = config.icon;
     
     return (
       <span className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold border  capitalize tracking-widest ${config.bg} ${config.text} ${config.border}`}>
         <Icon size={12} />
         {status}
       </span>
     );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-12">
      <PageHeader 
        title="Stock Transfers" 
        rightAction={
          <button 
            onClick={() => {
              if (stores.length <= 1) {
                toast.error('You need at least 2 stores to transfer stock');
                return;
              }
              setShowAdd(true);
            }} 
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
          >
            <ArrowRightLeft size={18} />
            <span className="hidden sm:inline">New Transfer</span>
          </button>
        }
      />
      
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {stores.length <= 1 ? (
          <div className="bg-card rounded-3xl border border-border p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
               <Store size={36} className="text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2 capitalize">Multiple Stores Required</h3>
            <p className="text-sm font-medium text-muted-foreground max-w-md mx-auto">
               You need at least two stores connected to your account to perform stock transfers. Please create another store branch first.
            </p>
          </div>
        ) : stockTransfers.length === 0 ? (
          <div className="bg-card rounded-3xl border border-border p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <ArrowRightLeft size={36} className="text-primary" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2 capitalize">No Transfers Yet</h3>
            <p className="text-sm font-medium text-muted-foreground max-w-md mx-auto mb-6">
               You haven't initiated or received any stock transfers. Move inventory between your stores easily.
            </p>
            <button 
               onClick={() => setShowAdd(true)}
               className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-sm"
            >
               <ArrowRightLeft size={18} /> Start Transfer
            </button>
          </div>
        ) : (
          <>
            <div className="hidden md:block bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/10">
                    <th className="px-6 py-5 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Date</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-right">Source Store</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-center">Direction</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Destination Store</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {stockTransfers.map(st => {
                    const source = stores.find(s => s.id === st.source_store_id);
                    const dest = stores.find(s => s.id === st.destination_store_id);
                    return (
                      <tr key={st.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                             <span className="font-bold text-sm text-foreground">
                               {new Date(st.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                             </span>
                             <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock size={12} />
                                {new Date(st.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex flex-col items-end">
                             <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{source?.store_name || 'Unknown'}</span>
                             <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin size={10} /> {source?.location || '—'}
                             </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-center items-center">
                             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <ArrowRight size={14} className="text-primary" />
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex flex-col items-start">
                             <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{dest?.store_name || 'Unknown'}</span>
                             <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin size={10} /> {dest?.location || '—'}
                             </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          {getStatusBadge(st.status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
               {stockTransfers.map(st => {
                  const source = stores.find(s => s.id === st.source_store_id);
                  const dest = stores.find(s => s.id === st.destination_store_id);
                  return (
                     <div key={st.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-border/50">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-muted-foreground  capitalize tracking-widest mb-1">Transfer Date</span>
                              <span className="font-bold text-sm text-foreground">{new Date(st.created_at).toLocaleDateString()}</span>
                           </div>
                           {getStatusBadge(st.status)}
                        </div>
                        
                        <div className="flex items-center gap-3">
                           <div className="flex-1 bg-muted/20 border border-border/50 rounded-xl p-3 text-center">
                              <span className="block text-[10px] font-bold text-muted-foreground  capitalize tracking-widest mb-1">From</span>
                              <span className="font-bold text-sm text-foreground truncate block">{source?.store_name || 'Unknown'}</span>
                           </div>
                           <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <ArrowRight size={14} className="text-primary" />
                           </div>
                           <div className="flex-1 bg-primary/5 border border-primary/10 rounded-xl p-3 text-center">
                              <span className="block text-[10px] font-bold text-primary/70  capitalize tracking-widest mb-1">To</span>
                              <span className="font-bold text-sm text-primary truncate block">{dest?.store_name || 'Unknown'}</span>
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
          </>
        )}
      </div>

      {/* Add Transfer Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-border bg-muted/10">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 capitalize">
                 <ArrowRightLeft size={18} className="text-primary" />
                 New Stock Transfer
              </h3>
              <button 
                onClick={() => setShowAdd(false)}
                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest block">From (Source)</label>
                  <div className="w-full px-4 py-3 h-12 rounded-xl border border-border/50 bg-muted/30 text-muted-foreground font-bold text-sm flex items-center gap-2">
                    <Store size={16} /> {currentStore?.store_name}
                  </div>
                </div>

                <div className="hidden md:flex justify-center translate-y-3">
                   <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ArrowRight size={18} className="text-primary" />
                   </div>
                </div>
                <div className="md:hidden flex justify-center -my-2">
                   <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center rotate-90">
                      <ArrowRight size={14} className="text-primary" />
                   </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest block">To (Destination) <span className="text-destructive">*</span></label>
                  <SearchableSelect 
                    value={destStoreId} 
                    onChange={setDestStoreId}
                    options={otherStores.map(s => ({ value: s.id, label: s.store_name, subLabel: s.location }))}
                    placeholder="Select Destination Store..."
                    searchPlaceholder="Search store name or location..."
                    triggerClassName="h-12 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="h-px bg-border/50 w-full"></div>

              <div className="space-y-4">
                <label className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest flex items-center gap-2">
                   <Package size={14} /> Items to Transfer
                </label>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                     <SearchableSelect 
                       value={addItemId} 
                       onChange={setAddItemId}
                       options={items.filter(i => i.type === 'product' && i.quantity > 0).map(i => ({
                         value: i.id,
                         label: i.name,
                         subLabel: `In stock: ${i.quantity}`,
                         badge: i.barcode ? `Barcode: ${i.barcode}` : undefined
                       }))}
                       placeholder="Select an item from inventory..."
                       searchPlaceholder="Search item name or barcode..."
                       triggerClassName="h-12 font-medium"
                     />
                  </div>
                  
                  <div className="flex gap-3">
                    <input 
                      type="number" 
                      value={addQty} 
                      onChange={e => setAddQty(e.target.value)} 
                      min="1"
                      className="w-24 px-4 h-12 rounded-xl border border-input bg-background text-sm text-foreground font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" 
                    />
                    <button 
                      onClick={handleAddItem} 
                      className="px-6 h-12 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/80 transition-colors shadow-sm capitalize"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {selectedItems.length > 0 ? (
                  <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mt-4">
                    <table className="w-full text-left">
                      <thead className="bg-muted/10 border-b border-border/50">
                        <tr>
                          <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground  capitalize tracking-widest">Item Name</th>
                          <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground  capitalize tracking-widest text-right">Transfer Qty</th>
                          <th className="px-5 py-3 w-12 capitalize"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {selectedItems.map(si => {
                          const item = items.find(i => i.id === si.item_id);
                          return (
                            <tr key={si.item_id} className="hover:bg-muted/30 transition-colors group">
                              <td className="px-5 py-3 text-sm font-bold text-foreground">
                                 <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded bg-muted/50 flex items-center justify-center text-muted-foreground">
                                       <Package size={12} />
                                    </div>
                                    {item?.name || 'Unknown'}
                                 </div>
                              </td>
                              <td className="px-5 py-3 text-sm font-black text-right text-primary">
                                 <span className="bg-primary/10 px-2.5 py-1 rounded-lg">x{si.quantity}</span>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <button 
                                  onClick={() => setSelectedItems(prev => prev.filter(x => x.item_id !== si.item_id))}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-8 border border-dashed border-border rounded-2xl mt-4 bg-muted/5">
                    <Package size={24} className="mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm font-bold text-foreground mb-1">No items selected</p>
                    <p className="text-xs font-medium text-muted-foreground">Select items above to add them to this transfer list.</p>
                  </div>
                )}
              </div>

            </div>
            
            <div className="p-4 sm:p-6 border-t border-border bg-muted/10 flex gap-3 justify-end mt-auto">
              <button 
                onClick={() => setShowAdd(false)} 
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-muted text-foreground text-sm font-bold hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button 
                data-submit-guard="true"
                onClick={handleCreateTransfer} 
                disabled={isSubmitting || selectedItems.length === 0 || !destStoreId}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm capitalize"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Truck size={16} /> Initiate Transfer
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
