import { useState } from 'react';
import { router } from '@inertiajs/react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/PageHeader';
import { Printer, Eye, Share2, Download, FileText, Calendar, Receipt, X, CircleDollarSign, CheckCircle2, RotateCcw, Box, ArrowUpRight, TrendingUp } from 'lucide-react';
import { printReceipt, shareReceipt, type ReceiptFormat } from '@/lib/receipt-printer';
import { toast } from 'sonner';
import { api as apiClient } from '@/api';
import { useEffect } from 'react';

export default function ReceiptHistoryPage() {
  const { sales, saleItems, currentStore, formatCurrency, customers, payments, user } = useApp();
  const navigate = (url: string, options?: any) => router.visit(url, options);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showFormatPicker, setShowFormatPicker] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (currentStore?.id) {
      apiClient.from('payment_accounts').select('*').eq('store_id', currentStore.id)
        .then(({ data }) => { if (data) setPaymentAccounts(data); });
    }
  }, [currentStore?.id]);

  // Parse selectedDate as local date (not UTC) to avoid timezone shift
  const [year, month, day] = selectedDate.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  const dateStr = localDate.toDateString();
  const dayReceipts = sales.filter(s => s.store_id === currentStore?.id && new Date(s.sold_at).toDateString() === dateStr);

  const getReceiptData = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale || !currentStore) return null;
    const items = saleItems.filter(si => si.sale_id === sale.id);
    const customer = sale.customer_id ? customers.find(c => c.id === sale.customer_id) || null : null;
    const salePayment = payments.find(p => p.sale_id === sale.id && p.payment_type === 'sale');
    const usedAccountId = sale.payment_account_id || salePayment?.payment_account_id;
    const paymentMethod = usedAccountId 
      ? (paymentAccounts.find(p => p.id === usedAccountId)?.account_name || 'Card/Transfer')
      : (salePayment ? salePayment.method : sale.sale_type);
      
    return { sale, items, customer, store: currentStore, cashierName: user?.full_name || '', formatCurrency, paymentMethod };
  };

  const handlePrint = (saleId: string, format: ReceiptFormat) => {
    const data = getReceiptData(saleId);
    if (!data) return;
    printReceipt(data, format);
    setShowFormatPicker(false);
    setSelectedSaleId(null);
    toast.success('Print dialog opened');
  };

  const handleQuickPrint = (saleId: string) => {
    const data = getReceiptData(saleId);
    if (!data) return;
    printReceipt(data, '80mm');
    toast.success('Print dialog opened');
  };

  const handleShare = async (saleId: string) => {
    const data = getReceiptData(saleId);
    if (!data) return;
    const result = await shareReceipt(data);
    if (result === 'copied') toast.success('Receipt copied to clipboard!');
  };

  const openFormatPicker = (saleId: string) => {
    setSelectedSaleId(saleId);
    setShowFormatPicker(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-12">
      <PageHeader 
        title="Receipt History" 
        rightAction={
          <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-4 py-2 shadow-sm">
            <Calendar size={18} className="text-primary" />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-foreground focus:outline-none focus:ring-0 w-[130px] cursor-pointer" 
            />
          </div>
        }
      />
      
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {dayReceipts.length === 0 ? (
          <div className="bg-card rounded-3xl border border-border p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
               <Receipt size={36} className="text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2 capitalize">No receipts found</h3>
            <p className="text-sm font-medium text-muted-foreground">There are no recorded sales for {localDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 xl:gap-8">
            
            {/* Main Content Area */}
            <div className="xl:col-span-3 space-y-6">
              <div className="hidden md:block bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/10">
                      <th className="px-6 py-5 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Receipt #</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Customer</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-center">Payment</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-center">Status</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-right">Total</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {dayReceipts.map(sale => {
                      const items = saleItems.filter(si => si.sale_id === sale.id);
                      const customer = sale.customer_id ? customers.find(c => c.id === sale.customer_id) : null;
                      const salePayment = payments.find(p => p.sale_id === sale.id && p.payment_type === 'sale');
                      const usedAccountId = sale.payment_account_id || salePayment?.payment_account_id;
                      const paymentMethod = usedAccountId 
                        ? (paymentAccounts.find(p => p.id === usedAccountId)?.account_name || 'Card/Transfer')
                        : (salePayment ? salePayment.method : sale.sale_type);

                      return (
                        <tr key={sale.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                               <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{sale.receipt_no}</span>
                               <span className="text-xs font-medium text-muted-foreground mt-0.5">{items.length} items • {new Date(sale.sold_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-sm font-bold text-foreground">
                            {customer?.name || <span className="text-muted-foreground font-medium italic">Walk-in Customer</span>}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className={`inline-flex items-center gap-1 text-[10px]  font-bold capitalize tracking-widest px-2.5 py-1 rounded-lg border ${
                              !sale.payment_account_id && sale.sale_type === 'cash' ? 'bg-primary/10 text-primary border-primary/20' :
                              sale.sale_type === 'credit' ? 'bg-warning/10 text-warning border-warning/20' :
                              'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}>
                              {paymentMethod}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            {sale.status === 'completed' ? (
                               <span className="inline-flex items-center gap-1 text-[10px]  font-bold capitalize tracking-widest px-2.5 py-1 rounded-lg border bg-success/10 text-success border-success/20">
                                  <CheckCircle2 size={10} /> Completed
                               </span>
                            ) : (
                               <span className="inline-flex items-center gap-1 text-[10px]  font-bold capitalize tracking-widest px-2.5 py-1 rounded-lg border bg-destructive/10 text-destructive border-destructive/20">
                                  <RotateCcw size={10} /> Returned
                               </span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-sm font-black text-foreground text-right">
                            {formatCurrency(sale.total)}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => navigate(`/receipt/${sale.id}`)} title="View Receipt Details"
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <Eye size={16} />
                              </button>
                              <button onClick={() => handleQuickPrint(sale.id)} title="Quick Print (80mm)"
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <Printer size={16} />
                              </button>
                              <button onClick={() => openFormatPicker(sale.id)} title="Print Options"
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <FileText size={16} />
                              </button>
                              <button onClick={() => handleShare(sale.id)} title="Share Receipt"
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <Share2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                 {dayReceipts.map(sale => {
                    const items = saleItems.filter(si => si.sale_id === sale.id);
                    const customer = sale.customer_id ? customers.find(c => c.id === sale.customer_id) : null;
                    const salePayment = payments.find(p => p.sale_id === sale.id && p.payment_type === 'sale');
                    const usedAccountId = sale.payment_account_id || salePayment?.payment_account_id;
                    const paymentMethod = usedAccountId 
                      ? (paymentAccounts.find(p => p.id === usedAccountId)?.account_name || 'Card/Transfer')
                      : (salePayment ? salePayment.method : sale.sale_type);

                    return (
                       <div key={sale.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <span className="font-bold text-foreground text-sm block mb-1">{sale.receipt_no}</span>
                                <span className="text-xs font-medium text-muted-foreground">{items.length} items • {new Date(sale.sold_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                             <span className="font-black text-foreground">{formatCurrency(sale.total)}</span>
                          </div>
                          
                          <div className="bg-muted/20 border border-border/50 rounded-xl p-4 space-y-3 mb-4">
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-muted-foreground  capitalize tracking-widest">Customer</span>
                                <span className="text-xs font-bold text-foreground">{customer?.name || 'Walk-in'}</span>
                             </div>
                             <div className="flex justify-between items-center pt-2 border-t border-border/50">
                                <span className="text-[10px] font-bold text-muted-foreground  capitalize tracking-widest">Payment</span>
                                <span className={`text-[10px]  font-bold capitalize tracking-widest px-2.5 py-1 rounded-lg border ${
                                  !sale.payment_account_id && sale.sale_type === 'cash' ? 'bg-primary/10 text-primary border-primary/20' : 
                                  sale.sale_type === 'credit' ? 'bg-warning/10 text-warning border-warning/20' : 
                                  'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                }`}>
                                   {paymentMethod}
                                </span>
                             </div>
                             <div className="flex justify-between items-center pt-2 border-t border-border/50">
                                <span className="text-[10px] font-bold text-muted-foreground  capitalize tracking-widest">Status</span>
                                <span className={`text-[10px]  font-bold capitalize tracking-widest px-2.5 py-1 rounded-lg border ${sale.status === 'completed' ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                                   {sale.status}
                                </span>
                             </div>
                          </div>

                          <div className="flex gap-2">
                             <button onClick={() => navigate(`/receipt/${sale.id}`)} className="flex-1 py-2.5 rounded-xl bg-muted text-foreground hover:bg-accent text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
                                <Eye size={14} /> View
                             </button>
                             <button onClick={() => openFormatPicker(sale.id)} className="flex-1 py-2.5 rounded-xl bg-muted text-foreground hover:bg-accent text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
                                <FileText size={14} /> Options
                             </button>
                             <button onClick={() => handleShare(sale.id)} className="w-10 h-10 shrink-0 rounded-xl bg-muted text-foreground hover:bg-accent flex items-center justify-center transition-colors">
                                <Share2 size={14} />
                             </button>
                          </div>
                       </div>
                    );
                 })}
              </div>
            </div>

            {/* Side Panel: Summary */}
            <div className="xl:col-span-1">
              <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 xl:sticky xl:top-6 shadow-sm space-y-8">
                
                <div className="text-center p-6 bg-primary/5 rounded-2xl border border-primary/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                     <TrendingUp size={64} />
                  </div>
                  <p className="text-[11px] font-bold text-primary  capitalize tracking-widest mb-2 relative z-10">Day's Total Revenue</p>
                  <p className="text-3xl font-black text-foreground relative z-10">
                    {formatCurrency(dayReceipts.filter(s => s.status !== 'returned').reduce((sum, s) => sum + s.total, 0))}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-4 text-[11px]  capitalize tracking-widest flex items-center gap-2">
                     <Box size={14} className="text-muted-foreground" />
                     Summary for {localDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-xl hover:bg-muted/30 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">Total Receipts</span>
                      <span className="font-black text-foreground">{dayReceipts.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-success/5 border border-success/10">
                      <span className="text-sm font-medium text-success/80 flex items-center gap-1.5"><CheckCircle2 size={14}/> Completed</span>
                      <span className="font-black text-success">{dayReceipts.filter(s => s.status === 'completed').length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                      <span className="text-sm font-medium text-destructive/80 flex items-center gap-1.5"><RotateCcw size={14}/> Returned</span>
                      <span className="font-black text-destructive">{dayReceipts.filter(s => s.status === 'returned').length}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>

      {/* Format Picker Modal */}
      {showFormatPicker && selectedSaleId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card rounded-2xl sm:rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-border bg-muted/10">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 capitalize">
                 <Printer size={18} className="text-primary" /> Print Options
              </h3>
              <button 
                onClick={() => { setShowFormatPicker(false); setSelectedSaleId(null); }}
                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 sm:p-8 space-y-4">
              <button 
                onClick={() => handlePrint(selectedSaleId, '58mm')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-primary focus:border-primary focus:ring-4 focus:ring-primary/10 hover:bg-primary/5 transition-all text-left group bg-background shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                  <Printer size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">58mm Thermal</p>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">Compact receipt for small printers</p>
                </div>
                <ArrowUpRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button 
                onClick={() => handlePrint(selectedSaleId, '80mm')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-primary focus:border-primary focus:ring-4 focus:ring-primary/10 hover:bg-primary/5 transition-all text-left group bg-background shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                  <Printer size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">80mm Thermal</p>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">Standard thermal receipt format</p>
                </div>
                <ArrowUpRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button 
                onClick={() => handlePrint(selectedSaleId, 'a4')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-primary focus:border-primary focus:ring-4 focus:ring-primary/10 hover:bg-primary/5 transition-all text-left group bg-background shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                  <Download size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">A4 Invoice / PDF</p>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">Full-page invoice for standard printers</p>
                </div>
                <ArrowUpRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 pt-0">
              <button 
                onClick={() => { setShowFormatPicker(false); setSelectedSaleId(null); }}
                className="w-full py-4 rounded-xl bg-muted text-foreground text-sm font-bold hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
