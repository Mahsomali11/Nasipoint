import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { api as apiClient } from '@/api';
import { ArrowLeft, Download, FileText, Calendar, DollarSign, Activity, TrendingUp, TrendingDown, Clock, ShieldCheck, Calculator, Receipt } from 'lucide-react';
import { format, startOfWeek, startOfMonth } from 'date-fns';

interface Props {
  staff: any;
  onClose: () => void;
}

export default function StaffActivityDashboard({ staff, onClose }: Props) {
  const { sales, saleItems, expenses, payments, currentStore } = useApp();
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);

  React.useEffect(() => {
    if (currentStore?.id) {
      apiClient.from('payment_accounts').select('*').eq('store_id', currentStore.id)
        .then(({ data }) => { if (data) setPaymentAccounts(data); });
    }
  }, [currentStore?.id]);

  const staffUserId = staff.user_id;

  // Compute date boundaries
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (dateRange === 'today') {
      start = new Date();
      end = new Date();
    } else if (dateRange === 'week') {
      start = startOfWeek(now);
    } else if (dateRange === 'month') {
      start = startOfMonth(now);
    } else if (dateRange === 'custom') {
      start = customStart ? new Date(customStart) : new Date(0);
      end = customEnd ? new Date(customEnd) : new Date();
    }
    
    // Normalize times
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return { startDate: start, endDate: end };
  }, [dateRange, customStart, customEnd]);

  const isWithinRange = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getTime() >= startDate.getTime() && d.getTime() <= endDate.getTime();
  };

  // Filter data for this staff member within the date range
  const staffSales = useMemo(() => 
    sales.filter(s => s.staff_user_id === staffUserId && isWithinRange(s.sold_at || s.created_at)),
  [sales, staffUserId, startDate, endDate]);

  const staffExpenses = useMemo(() => 
    expenses.filter(e => (e.created_by === staffUserId || e.employee_user_id === staffUserId) && isWithinRange(e.created_at)),
  [expenses, staffUserId, startDate, endDate]);

  const staffPayments = useMemo(() => 
    payments.filter(p => p.created_by === staffUserId && isWithinRange(p.created_at)),
  [payments, staffUserId, startDate, endDate]);

  // Calculations
  const totalSalesCount = staffSales.length;

  const staffSaleItems = useMemo(() => 
    (saleItems || []).filter(si => staffSales.some(s => s.id === si.sale_id)),
  [saleItems, staffSales]);

  const totalGrossProfit = staffSaleItems.reduce((sum, si) => sum + ((Number(si.sell_price) - Number(si.cost_price)) * Number(si.quantity)), 0);
  
  // Inflow by Payment Account
  const inflowByAccount = useMemo(() => {
    const map: Record<string, number> = {};
    const inflows = staffPayments.filter(p => p.direction === 'in');
    inflows.forEach(p => {
      const accId = p.payment_account_id || p.method;
      map[accId] = (map[accId] || 0) + Number(p.amount);
    });
    return map;
  }, [staffPayments]);

  // Outflow by Payment Account
  const outflowByAccount = useMemo(() => {
    const map: Record<string, number> = {};
    staffExpenses.filter(e => e.status !== 'reversed').forEach(e => {
      const accId = e.payment_account_id || 'cash';
      map[accId] = (map[accId] || 0) + Number(e.amount);
    });
    const outflows = staffPayments.filter(p => p.direction === 'out');
    outflows.forEach(p => {
      const accId = p.payment_account_id || p.method;
      map[accId] = (map[accId] || 0) + Number(p.amount);
    });
    return map;
  }, [staffExpenses, staffPayments]);

  const totalExpensesAmount = useMemo(() => Object.values(outflowByAccount).reduce((a,b)=>a+b,0), [outflowByAccount]);
  const netProfitAmount = totalGrossProfit - totalExpensesAmount;

  // Combined Activity Log
  const activityLog = useMemo(() => {
    const log: any[] = [];
    staffPayments.forEach(p => log.push({ type: p.direction === 'in' ? 'Collection' : 'Payout', id: p.reference || 'PAY-'+p.id.slice(0,5), time: p.created_at, amount: p.amount, method: p.payment_account_id || p.method }));
    staffExpenses.forEach(e => log.push({ 
      type: e.status === 'reversed' ? 'Expense (Reversed)' : 'Expense', 
      id: 'EXP-'+e.id.slice(0,5), 
      time: e.created_at, 
      amount: e.amount, 
      method: e.payment_account_id || 'cash',
      isReversed: e.status === 'reversed'
    }));
    
    return log.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [staffPayments, staffExpenses]);

  const handleExport = () => {
    // Generate CSV
    let csv = `Date Range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}\n`;
    csv += `Staff Member: ${staff.full_name}\n`;
    csv += `Role: ${staff.role}\n\n`;
    
    csv += `Performance Summary\n`;
    csv += `Total Transactions,${totalSalesCount}\n`;
    csv += `Net Profit,${netProfitAmount}\n\n`;
    
    csv += `Inflow Collections\n`;
    csv += `Account,Amount\n`;
    Object.entries(inflowByAccount).forEach(([acc, amt]) => {
       const accName = paymentAccounts.find(p => p.id === acc)?.account_name || acc;
       csv += `${accName},${amt}\n`;
    });
    
    csv += `\nOutflow Expenses\n`;
    csv += `Account,Amount\n`;
    Object.entries(outflowByAccount).forEach(([acc, amt]) => {
       const accName = paymentAccounts.find(p => p.id === acc)?.account_name || acc;
       csv += `${accName},${amt}\n`;
    });

    csv += `\nActivity Log\n`;
    csv += `Time,Type,Reference,Account,Amount\n`;
    activityLog.forEach(log => {
      const accName = paymentAccounts.find(p => p.id === log.method)?.account_name || log.method;
      csv += `${format(new Date(log.time), 'yyyy-MM-dd HH:mm:ss')},${log.type},${log.id},${accName},${log.amount}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Staff_Report_${staff.full_name.replace(/ /g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (val: number) => {
    if (isNaN(val)) return '$0.00';
    return '$' + val.toFixed(2);
  };
  const getAccountName = (id: string) => paymentAccounts.find(p => p.id === id)?.account_name || id;

  return (
    <div className="absolute inset-0 bg-background z-50 overflow-y-auto pb-12 flex flex-col animate-in slide-in-from-right-8 duration-300">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors capitalize">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-foreground capitalize">{staff.full_name}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1  capitalize tracking-widest font-bold">
              <ShieldCheck size={12} /> {staff.role}
            </p>
          </div>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-all capitalize">
          <Download size={16} /> Export Report
        </button>
      </div>

      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Date Filter */}
        <div className="bg-card border border-border p-4 rounded-2xl flex flex-wrap gap-3 items-center shadow-sm">
          <Calendar size={18} className="text-muted-foreground" />
          <div className="flex bg-muted p-1 rounded-xl">
            {(['today', 'week', 'month', 'custom'] as const).map(mode => (
              <button 
                key={mode} 
                onClick={() => setDateRange(mode)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold  capitalize tracking-wider transition-colors ${dateRange === mode ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {mode}
              </button>
            ))}
          </div>
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 ml-4">
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm" />
              <span className="text-muted-foreground">to</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm" />
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <div className="p-2.5 bg-primary/10 rounded-xl"><Receipt size={20} /></div>
              <h3 className="font-bold text-sm  capitalize tracking-wider text-muted-foreground">Total Sales</h3>
            </div>
            <p className="text-3xl font-black text-foreground">{totalSalesCount}</p>
            <p className="text-sm text-muted-foreground mt-2 font-medium">{totalSalesCount} Receipts Issued</p>
          </div>
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-success">
              <div className="p-2.5 bg-success/10 rounded-xl"><TrendingUp size={20} /></div>
              <h3 className="font-bold text-sm  capitalize tracking-wider text-muted-foreground">Total Collected (In)</h3>
            </div>
            <p className="text-3xl font-black text-foreground">
              {formatCurrency(Object.values(inflowByAccount).reduce((a,b)=>a+b,0))}
            </p>
            <div className="mt-3 space-y-1">
              {Object.entries(inflowByAccount).map(([acc, amt]) => (
                <div key={acc} className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground ">{getAccountName(acc)}</span>
                  <span className="text-foreground">{formatCurrency(amt)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-destructive">
              <div className="p-2.5 bg-destructive/10 rounded-xl"><TrendingDown size={20} /></div>
              <h3 className="font-bold text-sm  capitalize tracking-wider text-muted-foreground">Total Disbursed (Out)</h3>
            </div>
            <p className="text-3xl font-black text-foreground">
              {formatCurrency(Object.values(outflowByAccount).reduce((a,b)=>a+b,0))}
            </p>
            <div className="mt-3 space-y-1">
              {Object.entries(outflowByAccount).map(([acc, amt]) => (
                <div key={acc} className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground ">{getAccountName(acc)}</span>
                  <span className="text-foreground">{formatCurrency(amt)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <div className="p-2.5 bg-primary/10 rounded-xl"><Calculator size={20} /></div>
              <h3 className="font-bold text-sm  capitalize tracking-wider text-muted-foreground">Net Profit</h3>
            </div>
            <p className="text-3xl font-black text-foreground">{formatCurrency(netProfitAmount)}</p>
            <p className="text-sm text-muted-foreground mt-2 font-medium">After Costs & Expenses</p>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border/50 flex items-center gap-3">
            <Activity className="text-muted-foreground" size={20} />
            <h3 className="font-bold text-foreground capitalize">Activity Log & History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/10 border-b border-border/50">
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Time</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Action / Type</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Reference No.</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Account / Method</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {activityLog.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No activity found for this period.</td>
                  </tr>
                ) : (
                  activityLog.map((log, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3 text-sm text-foreground flex items-center gap-2">
                        <Clock size={14} className="text-muted-foreground" />
                        {format(new Date(log.time), 'MMM d, h:mm a')}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold  capitalize tracking-wider ${
                          log.type === 'Sale' ? 'bg-primary/10 text-primary' :
                          log.type === 'Collection' ? 'bg-success/10 text-success' :
                          log.type === 'Payout' || log.type === 'Expense' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                        }`}>{log.type}</span>
                      </td>
                      <td className="px-6 py-3 text-sm text-muted-foreground font-mono">{log.id}</td>
                      <td className="px-6 py-3 text-sm font-medium  capitalize tracking-wider">{getAccountName(log.method)}</td>
                      <td className="px-6 py-3 text-right text-sm font-bold text-foreground">{formatCurrency(Number(log.amount))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
