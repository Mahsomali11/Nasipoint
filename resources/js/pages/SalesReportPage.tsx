import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { api as apiClient } from '@/api';
import PageHeader from '@/components/PageHeader';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Wallet, 
  BarChart3, 
  CalendarDays, 
  Activity, 
  Receipt, 
  X, 
  Printer, 
  CheckCircle2, 
  Clock, 
  ShoppingBag,
  Info,
  Layers,
  ArrowDownToLine,
  FileText
} from 'lucide-react';

interface PaymentAccount {
  id: string;
  account_name: string;
  account_type: string;
  is_active: boolean;
}

export default function SalesReportPage() {
  const { sales, saleItems, items: storeItems, customerDebts, customers, expenses, payments, currentStore, formatCurrency, user } = useApp();
  const [tab, setTab] = useState<'today' | 'month' | 'all'>('today');
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  useEffect(() => {
    if (!currentStore) return;
    apiClient
      .from('payment_accounts')
      .select('id, account_name, account_type, is_active')
      .eq('store_id', currentStore.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setPaymentAccounts(data);
      });
  }, [currentStore?.id]);

  const now = new Date();
  const today = now.toDateString();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Filter Sales strictly for the current store, completed (non-voided), and matching the date range
  const filterSales = (s: typeof sales[0]) => {
    if (s.store_id !== currentStore?.id || s.status === 'voided') return false;
    if (selectedAccountId !== 'all' && s.payment_account_id !== selectedAccountId) return false;
    const dateStr = s.sold_at || s.created_at;
    const d = new Date(dateStr);
    if (tab === 'today') return d.toDateString() === today;
    if (tab === 'month') return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    return true; // 'all'
  };

  const filteredSales = sales.filter(filterSales);
  const filteredSaleItems = saleItems.filter(si => filteredSales.some(s => s.id === si.sale_id));

  // Filter Operating Expenses for the same period
  const filteredExpenses = expenses.filter(e => {
    if (e.store_id !== currentStore?.id) return false;
    const d = new Date(e.created_at);
    if (tab === 'today') return d.toDateString() === today;
    if (tab === 'month') return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    return true;
  });

  // Filter Payments (Cash Flow events) for the same period
  const filteredPayments = payments.filter(p => {
    if (p.store_id !== currentStore?.id) return false;
    if (selectedAccountId !== 'all' && p.payment_account_id !== selectedAccountId) return false;
    const d = new Date(p.created_at);
    if (tab === 'today') return d.toDateString() === today;
    if (tab === 'month') return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    return true;
  });

  // Helper: Cash collected strictly at POS checkout for a sale
  const getSaleCheckoutCash = (sale: typeof sales[0]) => {
    const saleP = payments.find(p => p.sale_id === sale.id && p.payment_type === 'sale');
    if (saleP) return Number(saleP.amount || 0);

    const debt = customerDebts.find(d => d.sale_id === sale.id);
    if (debt) return Math.max(0, Number(sale.total || 0) - Number(debt.original_amount || 0));

    // Fallback: paid_amount minus any debt collections for this sale
    const debtCollections = payments
      .filter(p => p.sale_id === sale.id && p.payment_type === 'debt_collection')
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    return Math.max(0, Number(sale.paid_amount || 0) - debtCollections);
  };

  // Helper: Get financial breakdown for any sale (revenue excl tax, COGS, full gross profit)
  const getSaleFinancials = (sale: typeof sales[0]) => {
    const sItems = saleItems.filter(si => si.sale_id === sale.id);
    let saleCogs = 0;
    let saleProfit = 0;
    let itemsCount = 0;

    for (const si of sItems) {
      const qty = Number(si.quantity || 0);
      itemsCount += qty;
      let cost = Number(si.cost_price || 0);
      if (cost <= 0) {
        const product = storeItems.find(it => it.id === si.item_id);
        if (product && Number(product.cost_price) > 0) {
          cost = Number(product.cost_price);
        }
      }
      const sell = Number(si.sell_price || 0);
      saleCogs += cost * qty;
      saleProfit += (sell - cost) * qty;
    }

    if (Number(sale.discount) > 0 && saleProfit > 0) {
      saleProfit = Math.max(0, saleProfit - Number(sale.discount));
    }

    const saleTotal = Number(sale.total) || 1;
    // Revenue excluding tax (IFRS 15 / GAAP): subtotal minus discount
    const saleRevenue = Number(sale.subtotal || 0) - Number(sale.discount || 0);
    const saleTax = Number(sale.tax || 0);

    return {
      itemsCount,
      saleCogs,
      saleRevenue,
      saleTotal,
      saleTax,
      saleProfit,
    };
  };

  // =========================================================================
  // IFRS / GAAP ACCRUAL BASIS FINANCIAL AGGREGATIONS
  // =========================================================================

  // 1. Total Revenue (Invoiced sales excluding tax, recognized on sale date)
  const totalRevenue = filteredSales.reduce((sum, sale) => {
    const { saleRevenue } = getSaleFinancials(sale);
    return sum + saleRevenue;
  }, 0);

  // 2. Cost of Goods Sold (COGS, recognized on sale date matching inventory discharge)
  const totalCogs = filteredSales.reduce((sum, sale) => {
    const { saleCogs } = getSaleFinancials(sale);
    return sum + saleCogs;
  }, 0);

  // 3. Gross Profit (FULL gross profit recognized on transaction date: Revenue - COGS)
  const grossProfit = totalRevenue - totalCogs;
  const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // 4. Operating Expenses (excluding reversed/refunded expenses)
  const totalExpenses = filteredExpenses
    .filter(e => e.status !== 'reversed' && e.expense_type !== 'Purchase' && e.expense_type !== 'Supplier Payment')
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  // 5. Net Profit: Strictly Gross Profit - Expenses (Net Profit <= Gross Profit when expenses >= 0)
  const totalLoss = 0;
  const netProfit = grossProfit - totalExpenses - totalLoss;

  // 6. Total Items Sold: Dynamically sum unit quantities from all completed sales in period
  const totalItemsSold = filteredSaleItems.reduce((s, si) => s + Number(si.quantity || 0), 0);

  // 7. Balance Sheet & Cash Flow Separation:
  //    - Cash collected at POS checkout on sales made in this period
  const totalCheckoutCash = filteredSales.reduce((sum, sale) => sum + getSaleCheckoutCash(sale), 0);

  //    - Credit extended / Accounts Receivable created in this period
  const totalCreditExtended = filteredSales.reduce((sum, sale) => {
    const checkoutCash = getSaleCheckoutCash(sale);
    return sum + Math.max(0, Number(sale.total || 0) - checkoutCash);
  }, 0);

  //    - Debt settlements collected in this period (Cash Inflow, reduces AR, DOES NOT re-add profit)
  const totalDebtCollections = filteredPayments
    .filter(p => p.payment_type === 'debt_collection')
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  //    - Current unpaid credit balance on sales from this period
  const totalOutstandingCredit = filteredSales.reduce((sum, sale) => sum + Number(sale.outstanding_amount || 0), 0);

  //    - Total Tax Invoiced (Liability)
  const totalTaxInvoiced = filteredSales.reduce((sum, sale) => sum + Number(sale.tax || 0), 0);

  // 8. Payment Accounts breakdown
  const salePaymentsByMethod = paymentAccounts.map(acc => {
    const total = filteredSales
      .filter(s => s.payment_account_id === acc.id)
      .reduce((s, sale) => s + getSaleCheckoutCash(sale), 0);
    return { account: acc, total };
  }).filter(item => item.total > 0 || paymentAccounts.length <= 6);

  const creditPaymentsByMethod = paymentAccounts.map(acc => {
    const total = filteredPayments
      .filter(p => p.payment_type === 'debt_collection' && p.payment_account_id === acc.id)
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    return { account: acc, total };
  }).filter(item => item.total > 0 || paymentAccounts.length <= 6);

  const dateDisplay = tab === 'today' ? now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : tab === 'month' ? now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'All Time';

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'Cash': return DollarSign;
      case 'Mobile Money': return Wallet;
      case 'Bank': return BarChart3;
      default: return Wallet;
    }
  };

  const handleOpenReceipt = (sale: typeof sales[0]) => {
    const items = saleItems.filter(si => si.sale_id === sale.id);
    const customer = customers.find(c => c.id === sale.customer_id);
    const debt = customerDebts.find(d => d.sale_id === sale.id);
    const acc = paymentAccounts.find(pa => pa.id === sale.payment_account_id);
    
    setSelectedReceipt({
      sale,
      items,
      customer,
      debt,
      paymentMethod: acc ? acc.account_name : (sale.sale_type === 'cash' ? 'Cash' : 'Credit / Split'),
    });
  };

  const MetricCard = ({ icon: Icon, label, value, color = 'text-primary', bgColor = 'bg-primary/10', subtitle, badge }: any) => (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1 relative overflow-hidden">
      <div className={`w-14 h-14 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
        <Icon size={24} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-bold text-muted-foreground capitalize tracking-wider truncate">{label}</p>
          {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        <p className={`text-2xl font-black ${color} truncate tracking-tight`}>{value}</p>
        {subtitle && <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-12">
      <PageHeader 
        title="Sales Report" 
        rightAction={
          <div className="flex items-center gap-4">
            <select 
              value={selectedAccountId} 
              onChange={e => setSelectedAccountId(e.target.value)}
              className="px-4 py-2 h-10 rounded-xl border border-border bg-card text-sm font-bold shadow-sm focus:outline-none focus:border-primary transition-colors appearance-none"
            >
              <option value="all">All Payment Accounts</option>
              {paymentAccounts.map(pa => (
                <option key={pa.id} value={pa.id}>{pa.account_name}</option>
              ))}
            </select>
            <div className="flex bg-muted/50 p-1.5 rounded-xl border border-border">
              {(['today', 'month', 'all'] as const).map(t => (
                <button 
                  key={t} 
                  onClick={() => setTab(t)}
                  className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 capitalize ${tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  {t === 'month' ? 'This Month' : t === 'all' ? 'All Time' : 'Today'}
                </button>
              ))}
            </div>
          </div>
        }
      />
      
      <div className="p-4 sm:p-6 md:px-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Date & Accounting Standard Badge */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-foreground bg-card p-4 rounded-xl border border-border shadow-sm inline-flex">
            <CalendarDays size={20} className="text-primary" />
            <h2 className="text-base font-bold capitalize">{dateDisplay}</h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
            <CheckCircle2 size={14} />
            <span>IFRS / GAAP Accrual Basis (Profit Recognized on Sale Date)</span>
          </div>
        </div>

        {filteredSales.length === 0 && tab !== 'all' ? (
          <div className="bg-card rounded-2xl border border-border p-16 text-center shadow-sm flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Activity size={40} className="text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 capitalize">No transactions</h3>
            <p className="text-muted-foreground">There are no transactions in this period.</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Top Level Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Net Profit Big Banner Card */}
              <div className="bg-card rounded-3xl p-8 border border-border shadow-sm flex flex-col justify-center items-center text-center overflow-hidden relative">
                <div className={`absolute top-0 w-full h-2 ${netProfit >= 0 ? 'bg-success' : 'bg-destructive'}`}></div>
                <p className="text-sm font-bold text-muted-foreground capitalize tracking-widest mb-1">Net Profit</p>
                <p className="text-[11px] font-medium text-muted-foreground/80 mb-3">Gross Profit ({formatCurrency(grossProfit)}) - Expenses ({formatCurrency(totalExpenses)})</p>
                <p className={`text-5xl md:text-6xl font-black tracking-tighter ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(netProfit)}
                </p>
                <div className="flex items-center gap-2 mt-6">
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize tracking-wider ${netProfit >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {netProfit >= 0 ? 'Profitable' : 'Net Loss'}
                  </div>
                  <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-muted text-muted-foreground">
                    Margin: {grossMarginPct.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Accrual Core Metrics Grid */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <MetricCard 
                  icon={BarChart3} 
                  label="Total Revenue" 
                  value={formatCurrency(totalRevenue)} 
                  color="text-primary" 
                  bgColor="bg-primary/10" 
                  subtitle="Invoiced Sales (Cash + Credit, Excl. Tax)"
                  badge="Accrual"
                />
                <MetricCard 
                  icon={TrendingDown} 
                  label="Cost of Goods (COGS)" 
                  value={formatCurrency(totalCogs)} 
                  color="text-indigo-600 dark:text-indigo-400" 
                  bgColor="bg-indigo-500/10" 
                  subtitle="Stored cost basis of items discharged"
                  badge="COGS"
                />
                <MetricCard 
                  icon={TrendingUp} 
                  label="Gross Profit" 
                  value={formatCurrency(grossProfit)} 
                  color="text-success" 
                  bgColor="bg-success/10" 
                  subtitle="Total Revenue - COGS (Full Margin Earned)"
                  badge="On Sale Date"
                />
                <MetricCard 
                  icon={DollarSign} 
                  label="Operating Expenses" 
                  value={formatCurrency(totalExpenses)} 
                  color="text-destructive" 
                  bgColor="bg-destructive/10" 
                  subtitle="Operating overheads & staff costs"
                  badge="Expenses"
                />
              </div>
            </div>

            {/* Cash Flow vs Credit Accounts Receivable Section */}
            <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-4">
                <div>
                  <h3 className="font-black text-foreground text-xl capitalize">Cash Flow & Accounts Receivable</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Profit is recognized 100% on sale date. Debt collections increase Cash Flow and clear Accounts Receivable without double-counting profit.
                  </p>
                </div>
                <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 self-start sm:self-auto">
                  Separation of Profit vs Collection
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                  icon={ArrowDownToLine} 
                  label="Cash Inflow (POS)" 
                  value={formatCurrency(totalCheckoutCash)} 
                  color="text-primary" 
                  bgColor="bg-primary/10" 
                  subtitle="Down payments & cash sales at checkout"
                />
                <MetricCard 
                  icon={Wallet} 
                  label="Credit Invoiced (AR)" 
                  value={formatCurrency(totalCreditExtended)} 
                  color="text-amber-600 dark:text-amber-400" 
                  bgColor="bg-amber-500/10" 
                  subtitle="Receivables created on credit sales"
                />
                <MetricCard 
                  icon={BarChart3} 
                  label="Debt Collections" 
                  value={formatCurrency(totalDebtCollections)} 
                  color="text-blue-500" 
                  bgColor="bg-blue-500/10" 
                  subtitle="Cash collected on customer accounts"
                />
                <MetricCard 
                  icon={Clock} 
                  label="Outstanding Balance Due" 
                  value={formatCurrency(totalOutstandingCredit)} 
                  color="text-destructive" 
                  bgColor="bg-destructive/10" 
                  subtitle="Unpaid credit remaining from period"
                />
              </div>
            </div>

            {/* Operational & Tax Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard 
                icon={Package} 
                label="Total Items Sold" 
                value={totalItemsSold.toString()} 
                color="text-foreground" 
                bgColor="bg-muted" 
                subtitle="Sum of unit quantities sold"
              />
              <MetricCard 
                icon={FileText} 
                label="Total Invoices / Sales" 
                value={filteredSales.length.toString()} 
                color="text-primary" 
                bgColor="bg-primary/10" 
                subtitle="Completed sales transactions"
              />
              {currentStore?.tax_enabled && (
                <MetricCard 
                  icon={DollarSign} 
                  label="Tax Invoiced (Liability)" 
                  value={formatCurrency(totalTaxInvoiced)} 
                  color="text-amber-500" 
                  bgColor="bg-amber-500/10" 
                  subtitle="Tax liability (excluded from profit)"
                />
              )}
            </div>

            {/* Payment Methods Breakdown */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pt-4">
              <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-sm">
                <h3 className="font-black text-foreground text-xl mb-6 capitalize">Payment Accounts <span className="text-muted-foreground font-medium text-lg">(POS Cash Sales)</span></h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {salePaymentsByMethod.length > 0 ? (
                    salePaymentsByMethod.map(({ account, total }) => (
                      <MetricCard
                        key={account.id}
                        icon={getAccountIcon(account.account_type)}
                        label={account.account_name}
                        value={formatCurrency(total)}
                        color="text-primary"
                        bgColor="bg-primary/10"
                      />
                    ))
                  ) : (
                    <div className="col-span-2 p-8 border border-dashed border-border rounded-2xl text-center">
                       <p className="text-sm font-bold text-muted-foreground">No payment accounts configured</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-sm">
                <h3 className="font-black text-foreground text-xl mb-6 capitalize">Payment Accounts <span className="text-muted-foreground font-medium text-lg">(Credit Settlements)</span></h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {creditPaymentsByMethod.length > 0 ? (
                    creditPaymentsByMethod.map(({ account, total }) => (
                      <MetricCard
                        key={account.id}
                        icon={getAccountIcon(account.account_type)}
                        label={account.account_name}
                        value={formatCurrency(total)}
                        color="text-blue-500"
                        bgColor="bg-blue-500/10"
                      />
                    ))
                  ) : (
                    <div className="col-span-2 p-8 border border-dashed border-border rounded-2xl text-center">
                       <p className="text-sm font-bold text-muted-foreground">No payment accounts configured</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Filtered Transactions List */}
            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden mt-8">
               <div className="p-6 border-b border-border/50 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div>
                   <h3 className="font-black text-foreground text-xl capitalize">Invoices & Transactions List</h3>
                   <p className="text-sm text-muted-foreground mt-1">Filtered by your selected date and payment account. Click receipt reference to view full POS breakdown.</p>
                 </div>
                 <div className="text-xs font-bold text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-xl border border-border/50">
                   {filteredSales.length} {filteredSales.length === 1 ? 'Invoice' : 'Invoices'} Recorded
                 </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead className="bg-muted/30 border-b border-border">
                     <tr>
                       <th className="px-5 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest">Time</th>
                       <th className="px-5 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest">Receipt</th>
                       <th className="px-5 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest">Type</th>
                       <th className="px-5 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest text-right">Revenue (Ex. Tax)</th>
                       <th className="px-5 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest text-right">COGS</th>
                       <th className="px-5 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest text-right">Gross Profit</th>
                       <th className="px-5 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest text-right">Total Invoice</th>
                       <th className="px-5 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest text-right">Paid at POS</th>
                       <th className="px-5 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest text-center">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-border/50">
                     {filteredSales.map(sale => {
                       const { saleRevenue, saleCogs, saleProfit } = getSaleFinancials(sale);
                       const checkoutCash = getSaleCheckoutCash(sale);
                       const isFullyPaid = Number(sale.outstanding_amount || 0) === 0;

                       return (
                         <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                           <td className="px-5 py-4 text-xs font-medium text-foreground">
                              {new Date(sale.sold_at || sale.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                           </td>
                           <td className="px-5 py-4">
                             <button
                               type="button"
                               onClick={() => handleOpenReceipt(sale)}
                               title="Click to view full POS receipt details"
                               className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-primary hover:text-primary/80 hover:underline transition-all group"
                             >
                               <Receipt size={13} className="text-primary group-hover:scale-110 transition-transform" />
                               <span>{sale.receipt_no}</span>
                             </button>
                           </td>
                           <td className="px-5 py-4">
                             <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize tracking-wider ${
                               sale.sale_type === 'cash' 
                                 ? 'bg-success/10 text-success border border-success/20' 
                                 : sale.sale_type === 'mixed'
                                 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                 : 'bg-primary/10 text-primary border border-primary/20'
                             }`}>
                               {sale.sale_type}
                             </span>
                           </td>
                           <td className="px-5 py-4 text-right text-xs font-bold text-foreground">
                             {formatCurrency(saleRevenue)}
                           </td>
                           <td className="px-5 py-4 text-right text-xs font-medium text-muted-foreground">
                             {formatCurrency(saleCogs)}
                           </td>
                           <td className="px-5 py-4 text-right text-xs font-black text-success">
                             +{formatCurrency(saleProfit)}
                           </td>
                           <td className="px-5 py-4 text-right text-xs font-bold text-foreground">
                             {formatCurrency(sale.total)}
                           </td>
                           <td className="px-5 py-4 text-right text-xs font-bold text-primary">
                             {formatCurrency(checkoutCash)}
                           </td>
                           <td className="px-5 py-4 text-center">
                             {isFullyPaid ? (
                               <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full capitalize">
                                 <CheckCircle2 size={11} /> Settled
                               </span>
                             ) : (
                               <span className="inline-flex items-center gap-1 text-[10px] font-bold text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded-full capitalize">
                                 <Clock size={11} /> Due: {formatCurrency(sale.outstanding_amount)}
                               </span>
                             )}
                           </td>
                         </tr>
                       );
                     })}
                     {filteredSales.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground text-sm font-medium">No sales found matching these filters.</td>
                        </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>

          </div>
        )}
      </div>

      {/* POS Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl border border-border max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-primary" />
                <h3 className="font-bold text-foreground text-sm">POS Sale Receipt #{selectedReceipt.sale.receipt_no}</h3>
              </div>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="overflow-y-auto p-6 space-y-4">
              <div className="text-center pb-4 border-b border-dashed border-border/70">
                <h4 className="text-base font-black text-foreground">{currentStore?.store_name}</h4>
                {currentStore?.location && <p className="text-xs text-muted-foreground">{currentStore.location}</p>}
                {currentStore?.phone && <p className="text-xs text-muted-foreground">Tel: {currentStore.phone}</p>}
                <div className="mt-2 text-xs font-mono text-muted-foreground">
                  Date: {new Date(selectedReceipt.sale.sold_at || selectedReceipt.sale.created_at).toLocaleString()}
                </div>
                {selectedReceipt.customer && (
                  <div className="mt-2 text-xs font-bold text-foreground bg-muted/40 py-1 px-3 rounded-lg inline-block">
                    Customer: {selectedReceipt.customer.name} {selectedReceipt.customer.phone ? `(${selectedReceipt.customer.phone})` : ''}
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div className="space-y-2 pb-4 border-b border-dashed border-border/70">
                <div className="flex justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span>Item</span>
                  <span>Total</span>
                </div>
                {selectedReceipt.items.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-2">No line items recorded.</p>
                ) : (
                  selectedReceipt.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-start text-xs">
                      <div className="flex-1 pr-2">
                        <p className="font-bold text-foreground">{item.item_name}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{item.quantity} × {formatCurrency(item.sell_price)}</p>
                      </div>
                      <span className="font-bold text-foreground">{formatCurrency(item.line_total)}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Subtotal, Tax, Total */}
              <div className="space-y-1.5 pb-4 border-b border-dashed border-border/70 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Subtotal</span>
                  <span className="font-bold text-foreground">{formatCurrency(selectedReceipt.sale.subtotal)}</span>
                </div>
                {Number(selectedReceipt.sale.tax) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Tax {selectedReceipt.sale.tax_rate ? `(${selectedReceipt.sale.tax_rate}%)` : ''}</span>
                    <span className="font-bold text-foreground">{formatCurrency(selectedReceipt.sale.tax)}</span>
                  </div>
                )}
                {Number(selectedReceipt.sale.discount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Discount</span>
                    <span className="font-bold text-destructive">-{formatCurrency(selectedReceipt.sale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black pt-1.5 border-t border-border/50 text-foreground">
                  <span>Grand Total</span>
                  <span>{formatCurrency(selectedReceipt.sale.total)}</span>
                </div>
              </div>

              {/* Payment Split */}
              <div className="p-3 bg-muted/30 rounded-xl space-y-1.5 text-xs border border-border/50">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Payment Details</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase">{selectedReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Paid at POS:</span>
                  <span className="font-bold text-primary">{formatCurrency(getSaleCheckoutCash(selectedReceipt.sale))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Total Paid to Date:</span>
                  <span className="font-bold text-success">{formatCurrency(selectedReceipt.sale.paid_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Balance Due:</span>
                  <span className={`font-black ${Number(selectedReceipt.sale.outstanding_amount || 0) === 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(selectedReceipt.sale.outstanding_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/20 flex gap-3">
              <button 
                type="button" 
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer size={14} /> Print Receipt
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-xs font-bold hover:bg-muted transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
