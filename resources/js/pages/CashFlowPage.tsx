import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { api as apiClient } from '@/api';
import PageHeader from '@/components/PageHeader';
import { DollarSign, Wallet, BarChart3, Plus, Minus, X, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

interface PaymentAccount {
  id: string;
  account_name: string;
  account_type: string;
  is_active: boolean;
}

export default function CashFlowPage() {
  const { sales, expenses, payments, cashMovements, addCashMovement, currentStore, formatCurrency } = useApp();
  const [openingCash, setOpeningCash] = useState(0);
  const [showCashIn, setShowCashIn] = useState(false);
  const [showCashOut, setShowCashOut] = useState(false);
  const [moveAmount, setMoveAmount] = useState('');
  const [moveNote, setMoveNote] = useState('');
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [tab, setTab] = useState<'today' | 'month' | 'all' | 'custom'>('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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

  const filterByDate = (dateString: string) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    if (tab === 'today') return d.toDateString() === now.toDateString();
    if (tab === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (tab === 'custom') {
      if (fromDate && d < new Date(fromDate)) return false;
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
      return true;
    }
    return true; // 'all'
  };

  const filteredSales = sales.filter(s => s.store_id === currentStore?.id && filterByDate(s.sold_at));
  const filteredExpenses = expenses.filter(e => e.store_id === currentStore?.id && filterByDate(e.created_at));
  const filteredPayments = payments.filter(p => p.store_id === currentStore?.id && filterByDate(p.created_at));
  const filteredCashMovements = cashMovements.filter(m => m.store_id === currentStore?.id && filterByDate(m.created_at));

  // Dynamic breakdown by payment account
  const salesByAccount = paymentAccounts.map(acc => {
    const total = filteredPayments
      .filter(p => (p.payment_type === 'sale' || p.payment_type === 'debt_collection') && (p.payment_account_id === acc.id || p.method === acc.account_name))
      .reduce((s, p) => s + p.amount, 0);
    return { account: acc, total };
  });

  const totalSales = filteredSales.reduce((s, sale) => s + sale.paid_amount, 0);
  
  // Expenses breakdown by payment account (excluding reversed/refunded expenses)
  const expensesByAccount = paymentAccounts.map(acc => {
    const total = filteredExpenses
      .filter(e => e.status !== 'reversed' && (e.payment_account_id === acc.id || e.payment_method === acc.account_name))
      .reduce((s, e) => s + e.amount, 0);
    return { account: acc, total };
  });
  const totalExpensesAmount = filteredExpenses.filter(e => e.status !== 'reversed').reduce((s, e) => s + e.amount, 0);
  const totalReversedExpenses = filteredExpenses.filter(e => e.status === 'reversed').reduce((s, e) => s + Number(e.refund_amount || e.amount), 0);

  const transfersInByAccount = paymentAccounts.map(acc => {
    const total = filteredPayments
      .filter(p => p.payment_type === 'transfer' && p.direction === 'in' && p.payment_account_id === acc.id)
      .reduce((s, p) => s + p.amount, 0);
    return { account: acc, total };
  });

  const transfersOutByAccount = paymentAccounts.map(acc => {
    const total = filteredPayments
      .filter(p => p.payment_type === 'transfer' && p.direction === 'out' && p.payment_account_id === acc.id)
      .reduce((s, p) => s + p.amount, 0);
    return { account: acc, total };
  });

  const manualIn = filteredCashMovements.filter(m => m.direction === 'in').reduce((s, m) => s + m.amount, 0);
  const manualOut = filteredCashMovements.filter(m => m.direction === 'out').reduce((s, m) => s + m.amount, 0);

  // Closing cash only counts "Cash" type accounts (excluding reversed expenses so cash is credited back)
  const cashAccountSales = filteredPayments
    .filter(p => (p.payment_type === 'sale' || p.payment_type === 'debt_collection') && paymentAccounts.some(a => (p.payment_account_id === a.id || p.method === a.account_name) && a.account_type === 'Cash'))
    .reduce((s, p) => s + p.amount, 0);
  const cashExpenses = filteredExpenses
    .filter(e => e.status !== 'reversed' && paymentAccounts.some(a => (e.payment_account_id === a.id || e.payment_method === a.account_name) && a.account_type === 'Cash'))
    .reduce((s, e) => s + e.amount, 0);
  
  const cashTransfersIn = filteredPayments
    .filter(p => p.payment_type === 'transfer' && p.direction === 'in' && paymentAccounts.some(a => p.payment_account_id === a.id && a.account_type === 'Cash'))
    .reduce((s, p) => s + p.amount, 0);
    
  const cashTransfersOut = filteredPayments
    .filter(p => p.payment_type === 'transfer' && p.direction === 'out' && paymentAccounts.some(a => p.payment_account_id === a.id && a.account_type === 'Cash'))
    .reduce((s, p) => s + p.amount, 0);

  const closingCash = openingCash + cashAccountSales + manualIn + cashTransfersIn - cashExpenses - manualOut - cashTransfersOut;

  const handleCashMove = (direction: 'in' | 'out', e: React.FormEvent) => {
    e.preventDefault();
    addCashMovement({
      store_id: currentStore?.id || '',
      cash_session_id: '',
      movement_type: 'manual',
      direction,
      amount: Number(moveAmount),
      source_module: 'manual',
      reference_id: '',
      note: moveNote,
    });
    setMoveAmount(''); setMoveNote('');
    setShowCashIn(false); setShowCashOut(false);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'Cash': return DollarSign;
      case 'Mobile Money': return Wallet;
      case 'Bank': return BarChart3;
      default: return Wallet;
    }
  };

  const InfoCard = ({ icon: Icon, label, value, color = 'text-foreground', bgColor = 'bg-muted' }: { icon: any; label: string; value: string; color?: string; bgColor?: string }) => (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
      <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
        <Icon size={20} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-1 truncate">{label}</p>
        <p className={`text-xl font-black ${color} truncate`}>{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-12">
      <PageHeader 
        title="Cash Flow Tracker" 
        rightAction={
          <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex bg-muted/50 p-1 rounded-xl w-full sm:w-auto">
                {['today', 'month', 'all', 'custom'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t as any)}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${
                      tab === t 
                        ? 'bg-background shadow-sm text-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {t === 'today' ? 'Today' : t === 'month' ? 'This Month' : t === 'all' ? 'All Time' : 'Custom'}
                  </button>
                ))}
              </div>
              
              {tab === 'custom' && (
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <input 
                    type="date" 
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setShowCashIn(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-xl text-sm font-bold hover:bg-success/20 transition-all shadow-sm"
              >
                <ArrowDownToLine size={16} />
                <span className="hidden sm:inline">Cash In</span>
              </button>
              <button 
                onClick={() => setShowCashOut(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-xl text-sm font-bold hover:bg-destructive/20 transition-all shadow-sm"
              >
                <ArrowUpFromLine size={16} />
                <span className="hidden sm:inline">Cash Out</span>
              </button>
            </div>
          </div>
        }
      />
      
      <div className="p-4 sm:p-6 md:px-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Date & Cash Summary */}
        <div className="bg-card rounded-3xl border border-border p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 w-full h-2 bg-primary"></div>
          
          <p className="text-sm font-bold text-primary  capitalize tracking-widest mb-6">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start md:items-center">
            <div className="flex-1 w-full bg-muted/30 rounded-2xl p-6 border border-border/50">
              <p className="text-sm font-bold text-muted-foreground  capitalize tracking-wider mb-3">Opening Cash Drawer</p>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-muted-foreground font-black text-2xl">$</span>
                <input 
                  type="number" 
                  value={openingCash || ''} 
                  onChange={e => setOpeningCash(Number(e.target.value))}
                  className="w-full pl-10 py-2 text-4xl font-black text-foreground bg-transparent border-b-2 border-input focus:border-primary focus:outline-none transition-colors" 
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="hidden md:flex flex-col items-center justify-center">
               <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                 <DollarSign size={20} className="text-muted-foreground" />
               </div>
            </div>
            
            <div className="flex-1 w-full bg-primary/5 rounded-2xl p-6 border border-primary/20">
              <p className="text-sm font-bold text-primary  capitalize tracking-wider mb-3">Expected Closing Cash</p>
              <p className="text-5xl font-black text-primary">{formatCurrency(closingCash)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inflows - Dynamic per payment account */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center">
                <Plus size={16} className="font-bold" />
              </div>
              <h3 className="text-lg font-black text-foreground capitalize">Inflows</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {salesByAccount.map(({ account, total }) => (
                <InfoCard 
                  key={account.id} 
                  icon={getAccountIcon(account.account_type)} 
                  label={account.account_name} 
                  value={formatCurrency(total)} 
                  color="text-success"
                  bgColor="bg-success/10"
                />
              ))}
              <InfoCard 
                icon={BarChart3} 
                label="Total Sales" 
                value={formatCurrency(totalSales)} 
                color="text-success"
                bgColor="bg-success/10"
              />
              {manualIn > 0 && (
                <InfoCard 
                  icon={ArrowDownToLine} 
                  label="Manual Cash In" 
                  value={formatCurrency(manualIn)} 
                  color="text-success"
                  bgColor="bg-success/10"
                />
              )}
              {transfersInByAccount.filter(t => t.total > 0).map(({ account, total }) => (
                <InfoCard 
                  key={`trin-${account.id}`}
                  icon={ArrowDownToLine} 
                  label={`Transfer In (${account.account_name})`} 
                  value={formatCurrency(total)} 
                  color="text-success"
                  bgColor="bg-success/10"
                />
              ))}
            </div>
          </div>

          {/* Outflows - Dynamic per payment account */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="w-8 h-8 rounded-full bg-destructive/20 text-destructive flex items-center justify-center">
                <Minus size={16} className="font-bold" />
              </div>
              <h3 className="text-lg font-black text-foreground capitalize">Outflows</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {expensesByAccount.filter(e => e.total > 0).map(({ account, total }) => (
                <InfoCard 
                  key={account.id} 
                  icon={getAccountIcon(account.account_type)} 
                  label={`Expenses (${account.account_name})`} 
                  value={formatCurrency(total)} 
                  color="text-destructive" 
                  bgColor="bg-destructive/10"
                />
              ))}
              {totalExpensesAmount === 0 && expensesByAccount.length === 0 && (
                <InfoCard 
                  icon={DollarSign} 
                  label="Expenses" 
                  value={formatCurrency(0)} 
                  color="text-destructive"
                  bgColor="bg-destructive/10"
                />
              )}
              {manualOut > 0 && (
                <InfoCard 
                  icon={ArrowUpFromLine} 
                  label="Manual Cash Out" 
                  value={formatCurrency(manualOut)} 
                  color="text-destructive" 
                  bgColor="bg-destructive/10"
                />
              )}
              {transfersOutByAccount.filter(t => t.total > 0).map(({ account, total }) => (
                <InfoCard 
                  key={`trout-${account.id}`}
                  icon={ArrowUpFromLine} 
                  label={`Transfer Out (${account.account_name})`} 
                  value={formatCurrency(total)} 
                  color="text-destructive"
                  bgColor="bg-destructive/10"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cash In/Out Modal */}
      {(showCashIn || showCashOut) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-border bg-muted/10">
              <h3 className={`text-xl font-bold flex items-center gap-2 ${showCashIn ? 'text-success' : 'text-destructive'}`}>
                {showCashIn ? <ArrowDownToLine size={20} /> : <ArrowUpFromLine size={20} />}
                {showCashIn ? 'Add Cash In' : 'Record Cash Out'}
              </h3>
              <button 
                onClick={() => { setShowCashIn(false); setShowCashOut(false); }}
                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={(e) => handleCashMove(showCashIn ? 'in' : 'out', e)} className="p-6 sm:p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Amount <span className="text-destructive">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black">$</span>
                  <input 
                    type="number" 
                    value={moveAmount} 
                    onChange={e => setMoveAmount(e.target.value)} 
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all font-bold" 
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Note <span className="lowercase font-medium">(optional)</span></label>
                <input 
                  value={moveNote} 
                  onChange={e => setMoveNote(e.target.value)} 
                  placeholder="Reason for cash movement"
                  className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" 
                />
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-border mt-8">
                <button 
                  type="button"
                  onClick={() => { setShowCashIn(false); setShowCashOut(false); }} 
                  className="flex-1 py-3 rounded-xl bg-muted text-foreground text-sm font-bold hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`flex-1 py-3 rounded-xl text-white text-sm font-bold shadow-sm transition-colors ${
                    showCashIn ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
