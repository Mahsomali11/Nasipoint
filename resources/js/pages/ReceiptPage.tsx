import { router } from '@inertiajs/react';
import { useApp } from '@/context/AppContext';
import { Check, Printer, Share2, Download, FileText, ArrowLeft, RotateCcw, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { printReceipt, shareReceipt, type ReceiptFormat } from '@/lib/receipt-printer';
import { toast } from 'sonner';
import { api as apiClient } from '@/api';

export default function ReceiptPage({ saleId }: { saleId?: string }) {
  const { sales, saleItems, customers, payments, currentStore, formatCurrency, user } = useApp();
  const navigate = (url: string) => router.visit(url);
  const [showFormatPicker, setShowFormatPicker] = useState(true);
  const [printAction, setPrintAction] = useState<'print' | 'download'>('print');
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
  const [fetchedSale, setFetchedSale] = useState<any>(null);
  const [fetchedItems, setFetchedItems] = useState<any[]>([]);

  // Fetch payment accounts to correctly map the payment method name
  useEffect(() => {
    if (currentStore?.id) {
      apiClient.from('payment_accounts').select('*').eq('store_id', currentStore.id)
        .then(({ data }) => { if (data) setPaymentAccounts(data); });
    }
  }, [currentStore?.id]);

  useEffect(() => {
    if (!saleId) return;
    const existing = sales.find(s => s.id === saleId);
    if (!existing) {
      apiClient.from('sales').select('*').eq('id', saleId).single()
        .then(({ data }) => {
          if (data) setFetchedSale(data);
        });
      apiClient.from('sale_items').select('*').eq('sale_id', saleId)
        .then(({ data }) => {
          if (data) setFetchedItems(data);
        });
    }
  }, [saleId, sales]);

  const sale = sales.find(s => s.id === saleId) || fetchedSale;
  if (!sale) return <div className="min-h-screen bg-background flex flex-col items-center justify-center text-muted-foreground"><p className="text-lg font-semibold">Loading receipt...</p></div>;

  const items = saleItems.filter(si => si.sale_id === sale.id).length > 0
    ? saleItems.filter(si => si.sale_id === sale.id)
    : fetchedItems;
  const customer = sale.customer_id ? customers.find(c => c.id === sale.customer_id) : null;

  const salePayment = payments.find(p => p.sale_id === sale.id && p.payment_type === 'sale');
  const usedAccountId = sale.payment_account_id || salePayment?.payment_account_id;
  const paymentMethod = usedAccountId 
    ? (paymentAccounts.find(p => p.id === usedAccountId)?.account_name || 'Card/Transfer')
    : (salePayment ? salePayment.method : sale.sale_type);

  const receiptData = {
    sale,
    items,
    customer: customer || null,
    store: currentStore!,
    cashierName: user?.full_name || '',
    formatCurrency,
    paymentMethod,
  };

  const handlePrint = (format: ReceiptFormat) => {
    printReceipt(receiptData, format);
    setShowFormatPicker(false);
    toast.success('Print dialog opened');
  };

  const handleShare = async () => {
    const result = await shareReceipt(receiptData);
    if (result === 'copied') toast.success('Receipt copied to clipboard!');
  };

  const openFormatPicker = (action: 'print' | 'download') => {
    setPrintAction(action);
    setShowFormatPicker(true);
  };

  const storeLogo = currentStore?.logo_url || '';
  const storeInitials = (currentStore?.store_name || 'S').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const template = currentStore?.receipt_template || 'classic';

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background py-10 px-4 flex justify-center">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center">
        
        {/* LEFT SIDE: Receipt Preview */}
        <div className="w-full max-w-[380px] bg-card rounded-2xl p-8 shadow-xl border border-border relative overflow-hidden shrink-0">
        
        {/* Receipt Zig-Zag Top (Purely CSS) */}
        <div className="absolute top-0 left-0 right-0 h-2 w-full" style={{ background: 'radial-gradient(circle at 10px 0, transparent 0, transparent 10px, var(--card) 10px) repeat-x', backgroundSize: '20px 20px', backgroundPosition: '-10px -10px', display: 'none' }}></div>

        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/5">
            <Check size={32} className="text-primary" />
          </div>
        </div>
        
        <h2 className="text-center text-2xl font-black tracking-tight text-foreground mb-1 capitalize">Sale Complete</h2>
        <p className="text-center text-sm font-medium text-muted-foreground mb-6 bg-muted/50 py-1 px-3 rounded-full inline-block mx-auto max-w-fit flex items-center justify-center self-center">Receipt #{sale.receipt_no}</p>

        <div className="border-t-2 border-dashed border-border/60 pt-5">
          {/* Store Logo */}
          {storeLogo ? (
            <div className="flex justify-center mb-4">
              <img src={storeLogo} alt={currentStore?.store_name} className="w-16 h-16 object-contain rounded-xl" />
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-black text-primary">{storeInitials}</span>
              </div>
            </div>
          )}

          {template === 'classic' && (
            <div className="flex justify-between items-start w-full gap-2">
              {/* LEFT COLUMN: Store Details */}
              <div className="flex flex-col text-left space-y-0.5 max-w-[55%]">
                <div className="text-base font-bold text-foreground leading-tight">{currentStore?.store_name}</div>
                {currentStore?.location && <div className="text-sm font-medium text-muted-foreground">{currentStore.location}</div>}
                {currentStore?.phone && <div className="text-sm font-medium text-muted-foreground">Tel: {currentStore.phone}</div>}
              </div>

              {/* RIGHT COLUMN: Transaction Meta */}
              <div className="flex flex-col text-right space-y-0.5 max-w-[45%]">
                {currentStore?.store_code && <div className="text-xs font-semibold text-muted-foreground/80">ID: {currentStore.store_code}</div>}
                <div className="text-xs font-semibold text-muted-foreground/80">{new Date(sale.sold_at).toLocaleString()}</div>
                <div className="text-xs font-medium text-muted-foreground">Cashier: {user?.full_name}</div>
              </div>
            </div>
          )}

          {template === 'modern' && (
            <div className="flex flex-col items-center justify-center text-center space-y-1">
              <div className="text-lg font-black text-foreground  capitalize tracking-wider">{currentStore?.store_name}</div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                {currentStore?.location && <span>{currentStore.location}</span>}
                {currentStore?.location && currentStore?.phone && <span>&bull;</span>}
                {currentStore?.phone && <span>Tel: {currentStore.phone}</span>}
              </div>
              {currentStore?.store_code && <div className="text-xs font-medium text-muted-foreground">ID: {currentStore.store_code}</div>}
              
              <div className="w-8 h-[2px] bg-border my-2"></div>
              
              <div className="text-xs font-bold text-muted-foreground">{new Date(sale.sold_at).toLocaleString()}</div>
              <div className="text-xs font-medium text-muted-foreground">Cashier: {user?.full_name}</div>
            </div>
          )}

          {template === 'compact' && (
            <div className="flex flex-col text-left space-y-0.5">
              <div className="text-base font-bold text-foreground">{currentStore?.store_name}</div>
              <div className="text-xs text-muted-foreground">
                {currentStore?.location}{currentStore?.location && currentStore?.phone ? ' | ' : ''}{currentStore?.phone ? `Tel: ${currentStore.phone}` : ''}
              </div>
              {currentStore?.store_code && <div className="text-xs text-muted-foreground">ID: {currentStore.store_code}</div>}
              
              <div className="text-xs font-medium text-muted-foreground mt-3">
                Date: {new Date(sale.sold_at).toLocaleString()}
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                Cashier: {user?.full_name}
              </div>
            </div>
          )}
          
          {customer && (
            <div className="text-center text-sm font-semibold text-foreground mt-4 bg-muted/30 py-1.5 rounded-lg">
              Customer: {customer.name}{customer.phone ? ` (${customer.phone})` : ''}
            </div>
          )}
        </div>

        <div className="border-t-2 border-dashed border-border/60 mt-5 pt-5 space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex justify-between items-start text-sm">
              <div className="flex-1 min-w-0 pr-3">
                <span className="text-foreground font-semibold line-clamp-2 leading-tight">{item.item_name}</span>
                <span className="text-xs font-bold text-muted-foreground mt-0.5 block">{item.quantity} × {formatCurrency(item.sell_price)}</span>
              </div>
              <span className="text-foreground font-bold">{formatCurrency(item.line_total)}</span>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-dashed border-border/60 mt-5 pt-5 space-y-2">
          {(sale.discount > 0 || sale.tax > 0) && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Subtotal</span>
              <span className="text-foreground font-semibold">{formatCurrency(sale.subtotal)}</span>
            </div>
          )}
          {sale.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Discount</span>
              <span className="text-destructive font-bold">-{formatCurrency(sale.discount)}</span>
            </div>
          )}
          {sale.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Tax {sale.tax_rate ? `(${sale.tax_rate}%)` : ''}</span>
              <span className="text-foreground font-semibold">{formatCurrency(sale.tax)}</span>
            </div>
          )}
          <div className="flex justify-between items-end pt-2 pb-2">
            <span className="text-foreground font-bold">Total</span>
            <span className="text-foreground font-black text-2xl tracking-tight leading-none">{formatCurrency(sale.total)}</span>
          </div>
          
          <div className="bg-muted/30 rounded-xl p-3 space-y-1.5 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Paid ({paymentMethod.toUpperCase()})</span>
              <span className="text-primary font-bold">{formatCurrency(sale.paid_amount)}</span>
            </div>
            {sale.outstanding_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">Credit Balance</span>
                <span className="text-destructive font-bold">{formatCurrency(sale.outstanding_amount)}</span>
              </div>
            )}
            {sale.paid_amount > sale.total && sale.outstanding_amount <= 0 && (
              <div className="flex justify-between text-sm pt-1 border-t border-border/50">
                <span className="text-muted-foreground font-medium">Change Due</span>
                <span className="text-foreground font-bold">{formatCurrency(sale.paid_amount - sale.total)}</span>
              </div>
            )}
          </div>
        </div>

        {sale.status === 'returned' && (
          <div className="mt-4 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-center">
            <span className="text-destructive font-black capitalize tracking-widest text-sm">REFUNDED</span>
          </div>
        )}

        <div className="mt-6 space-y-1.5">
          <p className="text-center text-xs font-medium text-foreground">{currentStore?.receipt_thank_you_message || 'Thank you for your purchase!'}</p>
          {currentStore?.receipt_footer_text && (
            <p className="text-center text-xs text-muted-foreground">{currentStore.receipt_footer_text}</p>
          )}
          <p className="text-center text-[10px] font-bold capitalize tracking-widest text-muted-foreground/40  mt-4">Powered by Maaldhis</p>
        </div>
        </div>

        {/* RIGHT SIDE: Action Buttons */}
        <div className="w-full max-w-[380px] flex flex-col shrink-0">
          <div className="w-full grid grid-cols-3 gap-3 lg:mt-0 mt-6">
            <button onClick={() => openFormatPicker('print')}
              className="py-4 rounded-2xl bg-info/10 text-info font-bold flex flex-col items-center justify-center gap-1.5 hover:bg-info/20 active:scale-[0.98] transition-all">
              <Printer size={22} />
              <span className="text-[11px]  capitalize tracking-wider">Print</span>
            </button>
            <button onClick={() => openFormatPicker('download')}
              className="py-4 rounded-2xl bg-primary/10 text-primary font-bold flex flex-col items-center justify-center gap-1.5 hover:bg-primary/20 active:scale-[0.98] transition-all">
              <Download size={22} />
              <span className="text-[11px]  capitalize tracking-wider">PDF</span>
            </button>
            <button onClick={handleShare}
              className="py-4 rounded-2xl bg-muted text-foreground font-bold flex flex-col items-center justify-center gap-1.5 hover:bg-accent active:scale-[0.98] transition-all capitalize">
              <Share2 size={22} />
              <span className="text-[11px]  capitalize tracking-wider">Share</span>
            </button>
          </div>

          <div className="w-full mt-4 space-y-3">
            <button onClick={() => navigate('/start-sale')}
              className="w-full py-4 rounded-2xl bg-foreground text-background font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2">
              <Plus size={18} /> New Sale
            </button>

            <button onClick={() => navigate('/dashboard')}
              className="w-full py-4 rounded-2xl bg-card border border-border text-foreground font-bold text-sm hover:bg-accent active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm">
              <ArrowLeft size={18} /> Back to Dashboard
            </button>
          </div>

          <button onClick={() => navigate('/receipt-history')}
            className="mt-6 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 mx-auto lg:mx-0">
            <RotateCcw size={16} /> View Receipt History
          </button>
        </div>
      </div>

      {/* Format Picker Modal */}
      {showFormatPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowFormatPicker(false)}>
          <div className="w-full max-w-[420px] bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
               <h3 className="text-xl font-bold text-foreground capitalize">
                 {printAction === 'print' ? 'Print Format' : 'PDF Format'}
               </h3>
               <button onClick={() => setShowFormatPicker(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors">×</button>
            </div>

            <button onClick={() => handlePrint('58mm')}
              className="w-full flex items-center gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all text-left group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <FileText size={24} className="text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <div>
                <p className="font-bold text-foreground">58mm Thermal</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Compact receipt for small printers</p>
              </div>
            </button>

            <button onClick={() => handlePrint('80mm')}
              className="w-full flex items-center gap-4 p-5 rounded-2xl bg-card border border-border hover:border-info/50 hover:shadow-md transition-all text-left group">
              <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center group-hover:bg-info group-hover:text-info-foreground transition-colors">
                <FileText size={24} className="text-info group-hover:text-info-foreground transition-colors" />
              </div>
              <div>
                <p className="font-bold text-foreground">80mm Thermal</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Standard thermal receipt format</p>
              </div>
            </button>

            <button onClick={() => handlePrint('a4')}
              className="w-full flex items-center gap-4 p-5 rounded-2xl bg-card border border-border hover:border-warning/50 hover:shadow-md transition-all text-left group">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center group-hover:bg-warning group-hover:text-warning-foreground transition-colors">
                <FileText size={24} className="text-warning group-hover:text-warning-foreground transition-colors" />
              </div>
              <div>
                <p className="font-bold text-foreground">A4 Invoice</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Full-page professional invoice</p>
              </div>
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
