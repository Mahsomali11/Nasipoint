import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { X, ArrowDownRight, ArrowUpRight, Wallet, CalendarDays, Receipt } from 'lucide-react';
import { format } from 'date-fns';

export default function PaymentAccountLedger({ account, onClose }: { account: any, onClose: () => void }) {
  const { sales, expenses, payments, formatCurrency } = useApp();
  const [timeFilter, setTimeFilter] = useState<'today' | 'month' | 'year' | 'all'>('all');

  const now = new Date();
  
  const transactions = useMemo(() => {
    const accSales = sales.filter(s => s.payment_account_id === account.id && s.status !== 'voided');
    const accExpenses = expenses.filter(e => e.payment_account_id === account.id);
    const accPayments = payments.filter(p => p.payment_account_id === account.id && (p.payment_type === 'debt_collection' || p.payment_type === 'transfer'));

    const merged = [
      ...accSales.map(s => ({
        id: s.id,
        date: new Date(s.sold_at),
        type: 'Sale',
        reference: s.receipt_no,
        description: `Sale to ${s.customer_id ? 'Customer' : 'Walk-in'}`,
        amount: s.paid_amount,
        isOutflow: false
      })),
      ...accExpenses.flatMap(e => {
        const items = [{
          id: e.id,
          date: new Date(e.created_at),
          type: 'Expense',
          reference: '-',
          description: e.expense_type + (e.status === 'reversed' ? ' (Reversed)' : '') + (e.note ? ` - ${e.note}` : ''),
          amount: e.amount,
          isOutflow: true
        }];

        if (e.status === 'reversed') {
          items.push({
            id: `${e.id}_refund`,
            date: new Date(e.refunded_at || e.created_at),
            type: 'Expense Refund',
            reference: 'REV',
            description: `Refund: ${e.expense_type}${e.refund_reason ? ` (${e.refund_reason})` : ''}`,
            amount: Number(e.refund_amount || e.amount),
            isOutflow: false
          });
        }
        return items;
      }),
      ...accPayments.map(p => ({
        id: p.id,
        date: new Date(p.created_at),
        type: p.payment_type === 'transfer' ? 'Transfer' : 'Debt Collection',
        reference: p.reference || '-',
        description: p.payment_type === 'transfer' 
          ? (p.direction === 'in' ? 'Transfer In' : 'Transfer Out') 
          : `Debt payment from Customer`,
        amount: p.amount,
        isOutflow: p.direction === 'out'
      }))
    ];

    // Filter by time
    return merged.filter(t => {
      if (timeFilter === 'all') return true;
      if (timeFilter === 'today') return t.date.toDateString() === now.toDateString();
      if (timeFilter === 'month') return t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear();
      if (timeFilter === 'year') return t.date.getFullYear() === now.getFullYear();
      return true;
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [sales, expenses, account.id, timeFilter]);

  const inflow = transactions.filter(t => !t.isOutflow).reduce((s, t) => s + t.amount, 0);
  const outflow = transactions.filter(t => t.isOutflow).reduce((s, t) => s + t.amount, 0);
  const net = inflow - outflow;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
               <Wallet size={20} />
             </div>
             <div>
                <h2 className="text-lg font-black text-foreground capitalize">{account.account_name} Ledger</h2>
                <p className="text-xs text-muted-foreground font-medium">{account.account_type} &bull; {account.provider_name || 'No Provider'}</p>
             </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors capitalize">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 bg-muted/5 flex flex-wrap gap-2 items-center justify-between border-b border-border">
          <div className="flex bg-card p-1 rounded-xl border border-border shadow-sm">
             {(['today', 'month', 'year', 'all'] as const).map(t => (
               <button 
                 key={t}
                 onClick={() => setTimeFilter(t)}
                 className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${timeFilter === t ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
               >
                 {t === 'today' ? 'Today' : t === 'month' ? 'This Month' : t === 'year' ? 'This Year' : 'All Time'}
               </button>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 p-6 gap-6 bg-card border-b border-border">
          <div className="bg-success/10 border border-success/20 rounded-2xl p-5">
            <p className="text-xs font-bold text-success  capitalize tracking-wider mb-1 flex items-center gap-1"><ArrowDownRight size={14}/> Inflow (Sales)</p>
            <p className="text-2xl font-black text-success">{formatCurrency(inflow)}</p>
          </div>
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-5">
            <p className="text-xs font-bold text-destructive  capitalize tracking-wider mb-1 flex items-center gap-1"><ArrowUpRight size={14}/> Outflow (Expenses)</p>
            <p className="text-2xl font-black text-destructive">{formatCurrency(outflow)}</p>
          </div>
          <div className={`border rounded-2xl p-5 ${net >= 0 ? 'bg-primary/10 border-primary/20' : 'bg-muted border-border'}`}>
            <p className="text-xs font-bold text-foreground  capitalize tracking-wider mb-1">Net Balance</p>
            <p className={`text-2xl font-black ${net >= 0 ? 'text-primary' : 'text-foreground'}`}>{formatCurrency(net)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
           {transactions.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-16 text-center">
                <Receipt size={40} className="text-muted-foreground/30 mb-4" />
                <h3 className="text-foreground font-bold text-lg mb-1 capitalize">No transactions</h3>
                <p className="text-muted-foreground text-sm">There are no transactions for this account in the selected period.</p>
             </div>
           ) : (
             <table className="w-full text-left border-collapse">
               <thead className="sticky top-0 bg-muted/90 backdrop-blur-md z-10 border-b border-border">
                 <tr>
                   <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground  capitalize tracking-widest">Date & Time</th>
                   <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground  capitalize tracking-widest">Type</th>
                   <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground  capitalize tracking-widest">Reference</th>
                   <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground  capitalize tracking-widest">Description</th>
                   <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground  capitalize tracking-widest text-right">Amount</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border/50">
                 {transactions.map(t => (
                   <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                     <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {format(t.date, 'MMM d, yyyy')} <span className="text-muted-foreground text-xs block">{format(t.date, 'h:mm a')}</span>
                     </td>
                     <td className="px-6 py-4">
                       <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold  capitalize tracking-wider ${t.isOutflow ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                         {t.type}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{t.reference}</td>
                     <td className="px-6 py-4 text-sm text-foreground max-w-[200px] truncate" title={t.description}>{t.description}</td>
                     <td className={`px-6 py-4 text-right font-black text-base ${t.isOutflow ? 'text-destructive' : 'text-success'}`}>
                       {t.isOutflow ? '-' : '+'}{formatCurrency(t.amount)}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
        </div>
      </div>
    </div>
  );
}
