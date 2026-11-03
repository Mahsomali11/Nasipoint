import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/PageHeader';
import { Search, QrCode, Check, RefreshCw, AlertCircle, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ReturnsPage() {
  const { sales, saleItems, recordReturn, currentStore, formatCurrency } = useApp();
  const [receiptSearch, setReceiptSearch] = useState('');
  const [foundSale, setFoundSale] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [confirmReturn, setConfirmReturn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sale = foundSale ? sales.find(s => s.id === foundSale) : null;
  const sItems = sale ? saleItems.filter(si => si.sale_id === sale.id) : [];

  const handleSearch = () => {
    if (!receiptSearch.trim()) return;
    const found = sales.find(s => s.receipt_no.toLowerCase().includes(receiptSearch.toLowerCase()) && s.store_id === currentStore?.id);
    setFoundSale(found?.id || null);
    setSelectedItems({});
    if (!found) toast.error('No receipt found');
  };

  const toggleItem = (saleItemId: string, maxQty: number) => {
    setSelectedItems(prev => {
      if (prev[saleItemId]) {
        const { [saleItemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [saleItemId]: maxQty };
    });
  };

  const updateQty = (saleItemId: string, qty: number, maxQty: number) => {
    if (qty <= 0 || qty > maxQty) return;
    setSelectedItems(prev => ({ ...prev, [saleItemId]: qty }));
  };

  const isFullReturn = Object.keys(selectedItems).length === sItems.length &&
    sItems.every(si => selectedItems[si.id] === si.quantity);

  const totalRefund = sItems
    .filter(si => selectedItems[si.id])
    .reduce((sum, si) => sum + (si.sell_price * (selectedItems[si.id] || 0)), 0);

  const handleReturn = async () => {
    if (isSubmitting || !sale || Object.keys(selectedItems).length === 0) return;
    setIsSubmitting(true);
    try {
      const returnItems = sItems
        .filter(si => selectedItems[si.id])
        .map(si => ({
          item_id: si.item_id,
          sale_item_id: si.id,
          quantity: selectedItems[si.id],
          amount: si.sell_price * selectedItems[si.id],
        }));
      await recordReturn(sale.id, returnItems, 'cash');
      toast.success(isFullReturn ? 'Full receipt returned & cancelled' : 'Partial return processed');
      setFoundSale(null);
      setReceiptSearch('');
      setSelectedItems({});
      setConfirmReturn(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to process return');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-12">
      <PageHeader title="Process Returns" />
      
      <div className="p-4 sm:p-6 md:px-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Search Bar */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row gap-3 max-w-3xl">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              value={receiptSearch} 
              onChange={e => setReceiptSearch(e.target.value)} 
              placeholder="Search by Receipt ID (e.g. REC-1234)"
              className="w-full pl-11 pr-4 h-12 rounded-xl border border-input bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              onKeyDown={e => e.key === 'Enter' && handleSearch()} 
            />
          </div>
          <button 
            onClick={handleSearch} 
            className="px-6 h-12 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap flex items-center justify-center gap-2 capitalize"
          >
            <Search size={16} /> Find Receipt
          </button>
        </div>

        {sale ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Main Area: Receipt Details & Items */}
            <div className="lg:col-span-3 space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-primary/5 border border-primary/20 rounded-2xl p-5 sm:p-6 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <QrCode size={20} />
                   </div>
                   <div>
                     <h3 className="font-black text-foreground text-lg mb-1 capitalize">{sale.receipt_no}</h3>
                     <p className="text-sm font-medium text-muted-foreground">{new Date(sale.sold_at).toLocaleString()}</p>
                   </div>
                </div>
                {sale.status === 'returned' && (
                  <span className="px-3 py-1.5 rounded-lg text-xs  capitalize tracking-widest font-black bg-destructive/10 text-destructive border border-destructive/20 self-start sm:self-auto">
                    Already Returned
                  </span>
                )}
              </div>

              {/* Note about partial returns */}
              {sale.status !== 'returned' && (
                 <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
                   <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                   <p className="text-sm text-blue-600/80 dark:text-blue-400 font-medium">
                     Select the items that the customer is returning. You can adjust the quantity for partial returns of identical items.
                   </p>
                 </div>
              )}

              <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/10">
                      <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest w-20 text-center">Select</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Item Details</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-right">Unit Price</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-center w-40">Return Qty</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-right">Refund Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {sItems.map(si => {
                      const isSelected = !!selectedItems[si.id];
                      const qty = selectedItems[si.id] || 0;
                      return (
                        <tr key={si.id} className={`transition-colors group ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => toggleItem(si.id, si.quantity)}
                              disabled={sale.status === 'returned'}
                              className={`w-6 h-6 rounded-md flex items-center justify-center transition-all mx-auto ${
                                isSelected 
                                  ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                                  : 'border-2 border-muted-foreground/30 bg-background hover:border-primary disabled:opacity-50'
                              }`}
                            >
                              {isSelected && <Check size={14} strokeWidth={3} />}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                               <span className="font-bold text-foreground text-sm">{si.item_name}</span>
                               <span className="text-xs font-medium text-muted-foreground mt-0.5">Purchased: {si.quantity} unit(s)</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-right text-muted-foreground">
                            {formatCurrency(si.sell_price)}
                          </td>
                          <td className="px-6 py-4">
                            {isSelected ? (
                              <div className="flex items-center justify-center gap-2 bg-background border border-border rounded-lg p-1 w-max mx-auto shadow-sm">
                                <button 
                                  onClick={() => updateQty(si.id, qty - 1, si.quantity)}
                                  className="w-7 h-7 rounded-md flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors font-bold"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center text-sm font-bold text-foreground">{qty}</span>
                                <button 
                                  onClick={() => updateQty(si.id, qty + 1, si.quantity)}
                                  className="w-7 h-7 rounded-md flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors font-bold"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <div className="text-center text-muted-foreground/30 font-black">—</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className={`text-sm font-bold ${isSelected ? 'text-destructive' : 'text-muted-foreground'}`}>
                               {isSelected ? formatCurrency(si.sell_price * qty) : formatCurrency(0)}
                             </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacking Cards */}
              <div className="md:hidden space-y-4">
                 {sItems.map(si => {
                    const isSelected = !!selectedItems[si.id];
                    const qty = selectedItems[si.id] || 0;
                    return (
                       <div key={si.id} className={`bg-card rounded-2xl border p-5 shadow-sm transition-all ${isSelected ? 'border-primary shadow-primary/10' : 'border-border'}`}>
                          <div className="flex gap-4 items-start mb-4">
                             <button 
                                onClick={() => toggleItem(si.id, si.quantity)}
                                disabled={sale.status === 'returned'}
                                className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center transition-all mt-1 ${
                                  isSelected 
                                    ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                                    : 'border-2 border-muted-foreground/30 bg-background hover:border-primary disabled:opacity-50'
                                }`}
                              >
                                {isSelected && <Check size={14} strokeWidth={3} />}
                              </button>
                              <div>
                                 <h4 className="font-bold text-foreground text-base leading-tight capitalize">{si.item_name}</h4>
                                 <p className="text-sm font-medium text-muted-foreground mt-1">{formatCurrency(si.sell_price)} each &middot; Bought {si.quantity}</p>
                              </div>
                          </div>
                          
                          {isSelected && (
                             <div className="pt-4 border-t border-border/50 flex justify-between items-center bg-muted/20 p-3 rounded-xl mt-2">
                                <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-1 shadow-sm">
                                  <button 
                                    onClick={() => updateQty(si.id, qty - 1, si.quantity)}
                                    className="w-8 h-8 rounded-md flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors font-bold text-lg"
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center text-sm font-bold text-foreground">{qty}</span>
                                  <button 
                                    onClick={() => updateQty(si.id, qty + 1, si.quantity)}
                                    className="w-8 h-8 rounded-md flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors font-bold text-lg"
                                  >
                                    +
                                  </button>
                                </div>
                                <div className="text-right">
                                   <p className="text-[10px] font-bold text-muted-foreground  capitalize tracking-widest mb-1">Refund</p>
                                   <p className="font-black text-destructive">{formatCurrency(si.sell_price * qty)}</p>
                                </div>
                             </div>
                          )}
                       </div>
                    );
                 })}
              </div>

            </div>

            {/* Side Panel: Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-3xl p-6 lg:sticky lg:top-24 shadow-sm flex flex-col gap-6">
                
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <RefreshCw size={18} className="text-foreground" />
                   </div>
                   <div>
                     <h4 className="font-black text-foreground text-lg leading-tight capitalize">Return Summary</h4>
                     <p className="text-xs font-medium text-muted-foreground mt-0.5">
                       {Object.keys(selectedItems).length} item(s) selected
                     </p>
                   </div>
                </div>

                <div className="bg-destructive/5 rounded-2xl p-5 border border-destructive/20 relative overflow-hidden text-center">
                  <div className="absolute top-0 w-full h-1 bg-destructive"></div>
                  <p className="text-xs font-bold text-destructive  capitalize tracking-widest mb-2">Total Refund</p>
                  <p className="text-4xl font-black text-destructive">{formatCurrency(totalRefund)}</p>
                </div>

                <button 
                  onClick={() => setConfirmReturn(true)}
                  disabled={sale.status === 'returned' || Object.keys(selectedItems).length === 0}
                  className="w-full h-12 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  {isFullReturn ? 'Return Full Receipt' : 'Process Partial Return'}
                </button>
              </div>
            </div>

          </div>
        ) : receiptSearch ? (
          <div className="bg-card rounded-3xl border border-border p-16 text-center max-w-2xl shadow-sm mx-auto flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
               <QrCode size={40} className="text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 capitalize">No receipt found</h3>
            <p className="text-muted-foreground">Double check the Receipt ID and try again.</p>
          </div>
        ) : (
          <div className="bg-card rounded-3xl border border-border p-16 text-center max-w-2xl shadow-sm mx-auto flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
               <Search size={40} className="text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 capitalize">Search for a receipt</h3>
            <p className="text-muted-foreground">Enter a receipt ID above to begin processing a return.</p>
          </div>
        )}
      </div>

      <AlertDialog open={confirmReturn} onOpenChange={setConfirmReturn}>
        <AlertDialogContent className="sm:max-w-[425px] rounded-3xl">
          <AlertDialogHeader>
             <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
                <AlertCircle size={24} />
             </div>
            <AlertDialogTitle className="text-center text-xl font-black">Confirm Return</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              {isFullReturn
                ? 'This will cancel the entire receipt and return all items to inventory. This cannot be undone.'
                : `This will return the selected items and process a refund of `}
                {!isFullReturn && <span className="font-black text-foreground">{formatCurrency(totalRefund)}</span>}
                {!isFullReturn && `. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-6">
            <AlertDialogCancel className="w-full sm:w-1/2 h-11 rounded-xl text-sm font-bold border-border hover:bg-muted mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              data-submit-guard="true"
              onClick={handleReturn} 
              disabled={isSubmitting}
              className="w-full sm:w-1/2 h-11 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                'Confirm Return'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
