import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { api as apiClient } from '@/api';
import PageHeader from '@/components/PageHeader';
import {
  Plus, X, Receipt, Wallet, User, Clock, RotateCcw, Pencil,
  Trash2, AlertCircle, CheckCircle2, Info, ArrowDownLeft, ShieldAlert
} from 'lucide-react';
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
import type { Expense } from '@/types';
import { SearchableSelect } from '@/components/ui/searchable-select';

export default function ExpensesPage() {
  const { expenses, addExpense, refundExpense, updateExpense, deleteExpense, currentStore, formatCurrency, user } = useApp();
  
  // Modals & form state
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [method, setMethod] = useState('cash');
  const [paymentAccountId, setPaymentAccountId] = useState<string | null>(null);
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refund / Reverse modal state
  const [refundTarget, setRefundTarget] = useState<Expense | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundCustomReason, setRefundCustomReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundAccountId, setRefundAccountId] = useState<string | null>(null);
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  // Edit modal state
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [editType, setEditType] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editAccountId, setEditAccountId] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Audit info modal state
  const [viewAuditTarget, setViewAuditTarget] = useState<Expense | null>(null);

  // Filters & Tabs
  const [tab, setTab] = useState<'today' | 'month' | 'all' | 'custom'>('today');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'reversed'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'super_owner' || (Boolean(currentStore?.owner_user_id) && Boolean(user?.id) && currentStore?.owner_user_id === user?.id);

  useEffect(() => {
    if (!currentStore) return;
    apiClient
      .from('payment_accounts')
      .select('id, account_name, account_type, is_active')
      .eq('store_id', currentStore.id)
      .eq('is_active', true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setPaymentAccounts(data);
          setPaymentAccountId(data[0].id);
        }
      });
  }, [currentStore?.id]);

  const filterByDate = (dateString: string) => {
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

  const isSameDay = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  };

  // Base date-filtered expenses for current store
  const storeExpensesInPeriod = expenses.filter(
    e => e.store_id === currentStore?.id && filterByDate(e.created_at)
  );

  // Active (non-reversed) expenses count towards operating costs
  const activeExpenses = storeExpensesInPeriod.filter(e => e.status !== 'reversed');
  const reversedExpenses = storeExpensesInPeriod.filter(e => e.status === 'reversed');

  const activeTotal = activeExpenses.reduce((s, e) => s + e.amount, 0);
  const reversedTotal = reversedExpenses.reduce((s, e) => s + Number(e.refund_amount || e.amount), 0);

  // Visible items based on status filter
  const displayedExpenses = statusFilter === 'active'
    ? activeExpenses
    : statusFilter === 'reversed'
      ? reversedExpenses
      : storeExpensesInPeriod;

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addExpense({
        store_id: currentStore?.id || '',
        expense_type: type,
        amount: Number(amount),
        note,
        employee_user_id: user?.id || null,
        employee_name: user?.full_name,
        payment_method: method,
        payment_account_id: paymentAccountId,
        created_by: user?.id || '',
      });
      setType('');
      setAmount('');
      setNote('');
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (exp: Expense) => {
    if (!isOwnerOrAdmin) {
      toast.error('Forbidden: Only Store Owners and Admins have permission to delete expenses.');
      return;
    }
    setDeleteTarget(exp);
  };

  const openRefundModal = (exp: Expense) => {
    if (!isOwnerOrAdmin) {
      toast.error('Forbidden: Only Store Owners and Admins have permission to refund or reverse expenses.');
      return;
    }
    setRefundTarget(exp);
    setRefundAmount(String(exp.amount));
    setRefundAccountId(exp.payment_account_id || (paymentAccounts[0]?.id ?? null));
    setRefundReason('Errand / Service Canceled');
    setRefundCustomReason('');
  };

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerOrAdmin) {
      toast.error('Forbidden: Only Store Owners and Admins have permission to refund or reverse expenses.');
      return;
    }
    if (!refundTarget || isSubmittingRefund) return;
    setIsSubmittingRefund(true);
    try {
      const finalReason = refundReason === 'Custom' 
        ? refundCustomReason.trim() || 'Service canceled and refunded'
        : refundReason;

      const success = await refundExpense(
        refundTarget.id,
        finalReason,
        Number(refundAmount) || refundTarget.amount,
        refundAccountId || undefined
      );

      if (success) {
        setRefundTarget(null);
      }
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const openEditModal = (exp: Expense) => {
    if (!isOwnerOrAdmin) {
      toast.error('Forbidden: Only Store Owners and Admins have permission to edit expenses.');
      return;
    }
    setEditTarget(exp);
    setEditType(exp.expense_type);
    setEditAmount(String(exp.amount));
    setEditNote(exp.note || '');
    setEditAccountId(exp.payment_account_id || (paymentAccounts[0]?.id ?? null));
  };

  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerOrAdmin) {
      toast.error('Forbidden: Only Store Owners and Admins have permission to edit expenses.');
      return;
    }
    if (!editTarget || isSubmittingEdit) return;
    setIsSubmittingEdit(true);
    try {
      const success = await updateExpense(editTarget.id, {
        expense_type: editType,
        amount: Number(editAmount),
        note: editNote,
        payment_account_id: editAccountId,
      });

      if (success) {
        setEditTarget(null);
      }
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleConfirmDelete = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isOwnerOrAdmin) {
      toast.error('Forbidden: Only Store Owners and Admins have permission to delete expenses.');
      return;
    }
    if (!deleteTarget || isSubmittingDelete) return;
    const targetId = deleteTarget.id;
    setIsSubmittingDelete(true);
    try {
      const success = await deleteExpense(targetId);
      if (success) {
        setDeleteTarget(null);
      }
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  const getAccountName = (accId?: string | null) => {
    if (!accId) return 'Cash';
    const acc = paymentAccounts.find(a => a.id === accId);
    return acc ? acc.account_name : 'Cash / Standard';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-12">
      <PageHeader 
        title="Expenses" 
        rightAction={
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex bg-muted/50 p-1 rounded-xl w-full sm:w-auto">
                {(['today', 'month', 'all', 'custom'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
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
            
            <button 
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-sm w-full sm:w-auto"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Expense</span>
            </button>
          </div>
        }
      />
      
      <div className="p-4 sm:p-6 md:px-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Summary Cards Column */}
          <div className="lg:col-span-1 lg:order-2 space-y-4">
            {/* Active Expenses Card */}
            <div className="bg-card border border-border rounded-3xl p-6 text-center shadow-sm flex flex-col justify-center items-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
                 <Wallet size={24} />
              </div>
              <p className="text-xs font-bold text-muted-foreground capitalize tracking-widest mb-1">Net Operating Expenses</p>
              <p className="text-3xl sm:text-4xl font-black text-foreground">{formatCurrency(activeTotal)}</p>
              <p className="text-xs text-muted-foreground mt-2">{activeExpenses.length} active entries</p>
            </div>

            {/* Reversed / Refunded Card */}
            {reversedTotal > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 text-center shadow-sm flex flex-col justify-center items-center animate-in fade-in">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                   <RotateCcw size={22} />
                </div>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 capitalize tracking-widest mb-1">Reversed & Refunded</p>
                <p className="text-3xl font-black text-amber-600 dark:text-amber-400">+{formatCurrency(reversedTotal)}</p>
                <p className="text-xs text-muted-foreground mt-1">{reversedExpenses.length} credited back to accounts</p>
              </div>
            )}
          </div>

          {/* Main Table Column */}
          <div className="lg:col-span-3 lg:order-1 space-y-4">
            
            {/* Status Filter Tabs */}
            <div className="flex items-center justify-between gap-3 bg-card border border-border/70 p-2 rounded-2xl shadow-2xs">
              <div className="flex items-center gap-1.5">
                {(['all', 'active', 'reversed'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      statusFilter === st
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {st === 'all' ? `All (${storeExpensesInPeriod.length})` : st === 'active' ? `Active (${activeExpenses.length})` : `Reversed (${reversedExpenses.length})`}
                  </button>
                ))}
              </div>
            </div>

            {displayedExpenses.length === 0 ? (
               <div className="bg-card rounded-3xl border border-border p-16 text-center shadow-sm flex flex-col items-center">
                 <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                   <Receipt size={32} className="text-muted-foreground/50" />
                 </div>
                 <h3 className="text-xl font-bold text-foreground mb-2 capitalize">No expenses found</h3>
                 <p className="text-muted-foreground text-sm max-w-sm">
                   {statusFilter === 'reversed' 
                     ? 'No reversed or canceled expenses in this time period.' 
                     : 'Keep track of your operational costs by recording expenses here.'}
                 </p>
                 {statusFilter !== 'reversed' && (
                   <button 
                      type="button"
                      onClick={() => setShowForm(true)}
                      className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm"
                    >
                      Add Expense
                    </button>
                 )}
               </div>
            ) : (
              <>
                <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/10">
                        <th className="px-5 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest">Type & Note</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest">Account</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest">Time</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest">Employee</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest text-right">Amount</th>
                        <th className="px-5 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {displayedExpenses.map(exp => {
                        const isReversed = exp.status === 'reversed';
                        const canModify = isOwnerOrAdmin || isSameDay(exp.created_at);

                        return (
                          <tr key={exp.id} className={`hover:bg-muted/30 transition-colors ${isReversed ? 'bg-amber-500/5' : ''}`}>
                            <td className="px-5 py-4">
                               <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold text-sm ${isReversed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                      {exp.expense_type}
                                    </span>
                                    {isReversed && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                        <RotateCcw size={10} /> Reversed
                                      </span>
                                    )}
                                  </div>
                                  {exp.note && <span className="text-xs text-muted-foreground mt-0.5">{exp.note}</span>}
                                  {isReversed && exp.refund_reason && (
                                    <span className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 flex items-center gap-1 italic">
                                      Reason: {exp.refund_reason}
                                    </span>
                                  )}
                               </div>
                            </td>

                            <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                              <span className="px-2.5 py-1 rounded-md bg-muted/60 border border-border/50">
                                {getAccountName(exp.payment_account_id)}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-sm font-medium text-muted-foreground whitespace-nowrap">
                              {new Date(exp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>

                            <td className="px-5 py-4 text-sm font-medium text-foreground">
                               <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                     {exp.employee_name ? exp.employee_name.charAt(0).toUpperCase() : 'U'}
                                  </div>
                                  <span className="truncate max-w-[120px]">{exp.employee_name || 'Staff'}</span>
                               </div>
                            </td>

                            <td className="px-5 py-4 text-sm font-bold text-right whitespace-nowrap">
                              {isReversed ? (
                                <div className="flex flex-col items-end">
                                  <span className="line-through text-muted-foreground text-xs">{formatCurrency(exp.amount)}</span>
                                  <span className="text-amber-600 dark:text-amber-400 font-black text-sm">
                                    +{formatCurrency(Number(exp.refund_amount || exp.amount))}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-destructive font-black">
                                  {formatCurrency(exp.amount)}
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isReversed ? (
                                  <>
                                    {isOwnerOrAdmin ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => openRefundModal(exp)}
                                          title="Refund or Reverse this expense"
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all shadow-2xs"
                                        >
                                          <RotateCcw size={13} />
                                          <span>Refund / Reverse</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => openEditModal(exp)}
                                          title="Edit Expense"
                                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                        >
                                          <Pencil size={15} />
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => openDeleteModal(exp)}
                                          title="Delete Expense"
                                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-xs text-muted-foreground/60 italic px-2">
                                        —
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setViewAuditTarget(exp)}
                                    title="View refund details and audit trail"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted hover:bg-accent transition-colors"
                                  >
                                    <Info size={13} />
                                    <span>Details</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-4">
                  {displayedExpenses.map(exp => {
                    const isReversed = exp.status === 'reversed';
                    const canModify = !isReversed;

                    return (
                      <div key={exp.id} className={`bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3 ${isReversed ? 'bg-amber-500/5 border-amber-500/30' : ''}`}>
                         <div className="flex justify-between items-start">
                           <div>
                              <div className="flex items-center gap-2">
                                <h4 className={`font-bold text-base leading-tight capitalize ${isReversed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                  {exp.expense_type}
                                </h4>
                                {isReversed && (
                                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                    Reversed
                                  </span>
                                )}
                              </div>
                              {exp.note && <span className="text-xs text-muted-foreground mt-1 inline-block">{exp.note}</span>}
                              {isReversed && exp.refund_reason && (
                                <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 italic">
                                  Reason: {exp.refund_reason}
                                </p>
                              )}
                           </div>
                           <div className="text-right">
                             {isReversed ? (
                               <div>
                                 <span className="line-through text-xs text-muted-foreground block">{formatCurrency(exp.amount)}</span>
                                 <span className="font-black text-amber-600 dark:text-amber-400 text-sm">+{formatCurrency(Number(exp.refund_amount || exp.amount))}</span>
                               </div>
                             ) : (
                               <span className="font-black text-destructive text-base">{formatCurrency(exp.amount)}</span>
                             )}
                           </div>
                         </div>

                         <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/50 text-xs text-muted-foreground font-medium">
                            <div className="flex items-center gap-3">
                               <div className="flex items-center gap-1">
                                  <Clock size={13} className="opacity-70" />
                                  {new Date(exp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center gap-1">
                                  <User size={13} className="opacity-70" />
                                  {exp.employee_name || 'Staff'}
                                </div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-muted text-[11px] font-semibold">
                              {getAccountName(exp.payment_account_id)}
                            </span>
                         </div>

                         {/* Mobile Actions */}
                         <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                           {!isReversed ? (
                             <>
                               {isOwnerOrAdmin ? (
                                 <>
                                   <button
                                     type="button"
                                     onClick={() => openRefundModal(exp)}
                                     className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30"
                                   >
                                     <RotateCcw size={12} /> Refund / Reverse
                                   </button>

                                   <button
                                     type="button"
                                     onClick={() => openEditModal(exp)}
                                     className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                                   >
                                     <Pencil size={14} />
                                   </button>
                                   <button
                                     type="button"
                                     onClick={() => openDeleteModal(exp)}
                                     className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                   >
                                     <Trash2 size={14} />
                                   </button>
                                 </>
                               ) : (
                                 <span className="text-xs text-muted-foreground/60 italic">
                                   Recorded
                                 </span>
                               )}
                             </>
                           ) : (
                             <button
                               type="button"
                               onClick={() => setViewAuditTarget(exp)}
                               className="text-xs font-semibold text-muted-foreground flex items-center gap-1 py-1 px-2.5 rounded bg-muted"
                             >
                               <Info size={12} /> Audit Info
                             </button>
                           )}
                         </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* ADD EXPENSE MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-border bg-muted/10">
              <h3 className="text-xl font-bold text-foreground capitalize">Add Expense</h3>
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 sm:p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Expense Type <span className="text-destructive">*</span></label>
                <input 
                  value={type} 
                  onChange={e => setType(e.target.value)} 
                  placeholder="e.g., Transport, Errand, Meals, Supplies"
                  className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Amount <span className="text-destructive">*</span></label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  placeholder="0.00"
                  className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" 
                  required 
                />
              </div>

              {paymentAccounts.length > 0 ? (
                <div>
                  <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Payment Account</label>
                  <SearchableSelect 
                    value={paymentAccountId || ''} 
                    onChange={setPaymentAccountId}
                    options={paymentAccounts.map(pa => ({
                      value: pa.id,
                      label: `${pa.account_name} (${pa.account_type})`
                    }))}
                    placeholder="Select Payment Account"
                    searchPlaceholder="Search payment account..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Payment Method</label>
                  <select 
                    value={method} 
                    onChange={e => setMethod(e.target.value)}
                    className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all appearance-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="card">Card / Bank</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Note <span className="lowercase font-medium">(optional)</span></label>
                <input 
                  value={note} 
                  onChange={e => setNote(e.target.value)} 
                  placeholder="e.g., Motorbike errand to post office"
                  className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" 
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-border mt-8">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="flex-1 py-3 rounded-xl bg-muted text-foreground text-sm font-bold hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  data-submit-guard="true"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-opacity capitalize disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    'Save Expense'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* REFUND / REVERSE EXPENSE MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {refundTarget && isOwnerOrAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-border bg-amber-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground capitalize">Refund / Reverse Expense</h3>
                  <p className="text-xs text-muted-foreground">Credit cash back to store account & adjust expense logs</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setRefundTarget(null)}
                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleConfirmRefund} className="p-6 sm:p-8 space-y-5">
              {/* Target Expense Summary Card */}
              <div className="bg-muted/40 rounded-2xl p-4 border border-border/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Original Expense</p>
                  <p className="text-base font-black text-foreground">{refundTarget.expense_type}</p>
                  {refundTarget.note && <p className="text-xs text-muted-foreground mt-0.5">{refundTarget.note}</p>}
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Charged Amount</span>
                  <span className="text-xl font-black text-destructive">{formatCurrency(refundTarget.amount)}</span>
                </div>
              </div>

              {/* Refund Amount */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-muted-foreground capitalize tracking-wider">
                    Refund Amount to Credit Back <span className="text-destructive">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setRefundAmount(String(refundTarget.amount))}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Full Amount ({formatCurrency(refundTarget.amount)})
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    max={refundTarget.amount}
                    value={refundAmount} 
                    onChange={e => setRefundAmount(e.target.value)} 
                    className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" 
                    required 
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  This exact amount will be credited back to the selected payment account and deducted from total expenses.
                </p>
              </div>

              {/* Credit Back To Payment Account */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">
                  Credit Refund Into Account <span className="text-destructive">*</span>
                </label>
                <SearchableSelect 
                  value={refundAccountId || ''} 
                  onChange={setRefundAccountId}
                  options={paymentAccounts.map(pa => ({
                    value: pa.id,
                    label: `${pa.account_name} (${pa.account_type}) ${pa.id === refundTarget.payment_account_id ? '— (Original)' : ''}`
                  }))}
                  placeholder="Select Refund Account"
                  searchPlaceholder="Search account name..."
                  required
                />
              </div>

              {/* Predefined Reversal Reason */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">
                  Reason for Reversal <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[
                    'Errand / Service Canceled',
                    'Returned Unused Cash',
                    'Wrong / Duplicate Entry',
                    'Overcharged Refund',
                    'Custom'
                  ].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRefundReason(r)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border ${
                        refundReason === r 
                          ? 'bg-primary/10 border-primary text-primary shadow-2xs' 
                          : 'bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {refundReason === 'Custom' && (
                  <input
                    value={refundCustomReason}
                    onChange={e => setRefundCustomReason(e.target.value)}
                    placeholder="Enter specific reason for refund..."
                    className="w-full mt-2 px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all"
                    required
                  />
                )}
              </div>

              <div className="flex gap-3 pt-6 border-t border-border mt-8">
                <button 
                  type="button" 
                  onClick={() => setRefundTarget(null)} 
                  className="flex-1 py-3 rounded-xl bg-muted text-foreground text-sm font-bold hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  data-submit-guard="true"
                  disabled={isSubmittingRefund}
                  className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmittingRefund ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Reversing...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw size={16} />
                      <span>Confirm Refund</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* EDIT EXPENSE MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {editTarget && isOwnerOrAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-border bg-muted/10">
              <h3 className="text-xl font-bold text-foreground capitalize">Edit Expense</h3>
              <button 
                type="button"
                onClick={() => setEditTarget(null)}
                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleConfirmEdit} className="p-6 sm:p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Expense Type <span className="text-destructive">*</span></label>
                <input 
                  value={editType} 
                  onChange={e => setEditType(e.target.value)} 
                  className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Amount <span className="text-destructive">*</span></label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  value={editAmount} 
                  onChange={e => setEditAmount(e.target.value)} 
                  className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" 
                  required 
                />
              </div>

              {paymentAccounts.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Payment Account</label>
                  <SearchableSelect 
                    value={editAccountId || ''} 
                    onChange={setEditAccountId}
                    options={paymentAccounts.map(pa => ({
                      value: pa.id,
                      label: `${pa.account_name} (${pa.account_type})`
                    }))}
                    placeholder="Select Payment Account"
                    searchPlaceholder="Search payment account..."
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Note <span className="lowercase font-medium">(optional)</span></label>
                <input 
                  value={editNote} 
                  onChange={e => setEditNote(e.target.value)} 
                  className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" 
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-border mt-8">
                <button 
                  type="button" 
                  onClick={() => setEditTarget(null)} 
                  className="flex-1 py-3 rounded-xl bg-muted text-foreground text-sm font-bold hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  data-submit-guard="true"
                  disabled={isSubmittingEdit}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-opacity capitalize disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingEdit ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ---------------------------------------------------------------------- */}
      <AlertDialog open={Boolean(deleteTarget && isOwnerOrAdmin)} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
              <AlertCircle size={24} />
            </div>
            <AlertDialogTitle className="text-center text-xl font-black">Delete Expense Entry?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm">
              Are you sure you want to permanently delete this expense:
              <strong className="block text-foreground mt-1">
                {deleteTarget?.expense_type} ({formatCurrency(deleteTarget?.amount || 0)})
              </strong>
              This will remove the entry entirely. If this was a valid expense that was later canceled, consider using <strong>"Refund / Reverse"</strong> instead to preserve audit logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-1/2 rounded-xl text-sm font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-submit-guard="true"
              onClick={(e) => handleConfirmDelete(e)}
              disabled={isSubmittingDelete}
              className="w-full sm:w-1/2 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-bold"
            >
              {isSubmittingDelete ? 'Deleting...' : 'Delete Expense'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---------------------------------------------------------------------- */}
      {/* AUDIT DETAILS MODAL (FOR REVERSED EXPENSES) */}
      {/* ---------------------------------------------------------------------- */}
      {viewAuditTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-border bg-amber-500/10">
              <div className="flex items-center gap-2.5">
                <RotateCcw size={18} className="text-amber-600 dark:text-amber-400" />
                <h3 className="text-lg font-black text-foreground capitalize">Reversal Audit Trail</h3>
              </div>
              <button 
                type="button"
                onClick={() => setViewAuditTarget(null)}
                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-muted/40 p-4 rounded-xl border border-border/60 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-semibold">Expense Type:</span>
                  <span className="font-bold text-foreground">{viewAuditTarget.expense_type}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-semibold">Original Amount:</span>
                  <span className="font-bold text-destructive line-through">{formatCurrency(viewAuditTarget.amount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-semibold">Refunded Amount:</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">+{formatCurrency(Number(viewAuditTarget.refund_amount || viewAuditTarget.amount))}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-semibold">Account Credited:</span>
                  <span className="font-semibold text-foreground">{getAccountName(viewAuditTarget.payment_account_id)}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Recorded At:</span>
                  <span className="font-semibold text-foreground">{new Date(viewAuditTarget.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Recorded By:</span>
                  <span className="font-semibold text-foreground">{viewAuditTarget.employee_name || 'Staff'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Reversed At:</span>
                  <span className="font-semibold text-foreground">
                    {viewAuditTarget.refunded_at ? new Date(viewAuditTarget.refunded_at).toLocaleString() : 'Recently'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Reversed By:</span>
                  <span className="font-semibold text-foreground">{viewAuditTarget.refunder?.full_name || viewAuditTarget.refunder?.name || user?.full_name || 'Authorized User'}</span>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300">
                <span className="font-bold block mb-1">Reversal Reason:</span>
                <p className="italic">{viewAuditTarget.refund_reason || 'Service / Errand Canceled and money returned to cash drawer.'}</p>
              </div>

              <button
                type="button"
                onClick={() => setViewAuditTarget(null)}
                className="w-full mt-4 py-2.5 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-accent transition-colors"
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
