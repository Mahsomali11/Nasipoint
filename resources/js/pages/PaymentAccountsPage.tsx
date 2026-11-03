import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/PageHeader';
import { api as apiClient } from '@/api';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Wallet, X, Building2, CreditCard, Landmark, Smartphone, ArrowRightLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import PaymentAccountLedger from '@/components/PaymentAccountLedger';
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
import { SearchableSelect } from '@/components/ui/searchable-select';

interface PaymentAccount {
  id: string;
  store_id: string;
  account_name: string;
  account_type: string;
  account_number: string;
  provider_name: string;
  is_active: boolean;
  created_at: string;
}

const ACCOUNT_TYPES = ['Cash', 'Mobile Money', 'Bank', 'Card', 'Digital Wallet'];

export default function PaymentAccountsPage() {
  const { currentStore, recordTransfer, accountTransfers, formatCurrency } = useApp();
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [activeTab, setActiveTab] = useState<'accounts' | 'history'>('accounts');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingAccount, setViewingAccount] = useState<PaymentAccount | null>(null);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    note: ''
  });
  const [form, setForm] = useState({
    account_name: '',
    account_type: 'Cash',
    account_number: '',
    provider_name: '',
  });

  const fetchAccounts = async () => {
    if (!currentStore) return;
    const { data, error } = await apiClient
      .from('payment_accounts')
      .select('*')
      .eq('store_id', currentStore.id)
      .order('created_at', { ascending: true });
    
    if (!error && data) {
      if (data.length === 0) {
        await seedFromExistingPayments();
        return;
      }
      setAccounts(data);
    }
    setLoading(false);
  };

  const seedFromExistingPayments = async () => {
    if (!currentStore) return;
    const { data: existingPayments } = await apiClient
      .from('payments')
      .select('method')
      .eq('store_id', currentStore.id);
    
    const uniqueMethods = new Set<string>();
    existingPayments?.forEach((p) => uniqueMethods.add(p.method));
    uniqueMethods.add('cash');
    
    const typeMap: Record<string, string> = {
      cash: 'Cash',
      mpesa: 'Mobile Money',
      card: 'Card',
      bank: 'Bank',
    };

    const toInsert = Array.from(uniqueMethods).map((method) => ({
      store_id: currentStore.id,
      account_name: method === 'mpesa' ? 'M-Pesa' : method.charAt(0).toUpperCase() + method.slice(1),
      account_type: typeMap[method.toLowerCase()] || 'Cash',
      is_active: true,
    }));

    await apiClient.from('payment_accounts').insert(toInsert);
    const { data } = await apiClient
      .from('payment_accounts')
      .select('*')
      .eq('store_id', currentStore.id)
      .order('created_at', { ascending: true });
    if (data) setAccounts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, [currentStore?.id]);

  const resetForm = () => {
    setForm({ account_name: '', account_type: 'Cash', account_number: '', provider_name: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore || !transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.amount) {
      toast.error('Please fill all required fields');
      return;
    }
    if (transferForm.fromAccountId === transferForm.toAccountId) {
      toast.error('Source and destination accounts must be different');
      return;
    }

    const amount = Number(transferForm.amount);
    if (amount <= 0) {
      toast.error('Transfer amount must be greater than zero');
      return;
    }

    try {
      await recordTransfer({
        from_account_id: transferForm.fromAccountId,
        to_account_id: transferForm.toAccountId,
        amount: amount,
        notes: transferForm.note,
      } as any);

      toast.success('Transfer completed successfully');
      setTransferForm({ fromAccountId: '', toAccountId: '', amount: '', note: '' });
      setShowTransferForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Transfer failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore || !form.account_name.trim()) {
      toast.error('Account name is required');
      return;
    }

    if (editingId) {
      const { error } = await apiClient
        .from('payment_accounts')
        .update({
          account_name: form.account_name.trim(),
          account_type: form.account_type,
          account_number: form.account_number.trim(),
          provider_name: form.provider_name.trim(),
        })
        .eq('id', editingId);
      if (error) {
        toast.error('Failed to update account');
      } else {
        toast.success('Account updated');
      }
    } else {
      const { error } = await apiClient
        .from('payment_accounts')
        .insert({
          store_id: currentStore.id,
          account_name: form.account_name.trim(),
          account_type: form.account_type,
          account_number: form.account_number.trim(),
          provider_name: form.provider_name.trim(),
        });
      if (error) {
        toast.error('Failed to add account');
      } else {
        toast.success('Account added');
      }
    }
    resetForm();
    fetchAccounts();
  };

  const toggleActive = async (account: PaymentAccount) => {
    const { error } = await apiClient
      .from('payment_accounts')
      .update({ is_active: !account.is_active })
      .eq('id', account.id);
    if (!error) {
      toast.success(account.is_active ? 'Account disabled' : 'Account enabled');
      fetchAccounts();
    }
  };

  const deleteAccount = async () => {
    if (!deleteId) return;
    const { error } = await apiClient
      .from('payment_accounts')
      .update({ is_active: false })
      .eq('id', deleteId);
    if (!error) {
      toast.success('Account deactivated');
      fetchAccounts();
    }
    setDeleteId(null);
  };

  const openEdit = (account: PaymentAccount) => {
    setEditingId(account.id);
    setForm({
      account_name: account.account_name,
      account_type: account.account_type,
      account_number: account.account_number,
      provider_name: account.provider_name,
    });
    setShowForm(true);
  };

  const typeColor = (type: string) => {
    switch (type) {
      case 'Cash': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Mobile Money': return 'bg-primary/10 text-primary border-primary/20';
      case 'Bank': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'Card': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Cash': return <Wallet size={18} />;
      case 'Mobile Money': return <Smartphone size={18} />;
      case 'Bank': return <Landmark size={18} />;
      case 'Card': return <CreditCard size={18} />;
      default: return <Building2 size={18} />;
    }
  };

  const accountToDelete = deleteId ? accounts.find(a => a.id === deleteId) : null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-12">
      <PageHeader 
        title="Payment Accounts" 
        rightAction={
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowTransferForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-bold hover:bg-accent/90 transition-all shadow-sm border border-border"
            >
              <ArrowRightLeft size={18} />
              <span className="hidden sm:inline">Transfer</span>
            </button>
            <button 
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Account</span>
            </button>
          </div>
        }
      />
      
      <div className="p-4 sm:p-6 md:px-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-border/50">
          <button 
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'accounts' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('accounts')}
          >
            Accounts
          </button>
          <button 
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('history')}
          >
            Transfer History
          </button>
        </div>

        {activeTab === 'accounts' && (
          <>
            <p className="text-sm text-muted-foreground max-w-2xl bg-card p-4 rounded-xl border border-border shadow-sm">
              Manage the payment methods available during sales. Only active accounts appear at checkout. You can deactivate an account if you no longer want to accept it as a payment method.
            </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border shadow-sm">
             <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
             <p className="text-sm font-semibold text-muted-foreground">Loading accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-16 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Wallet size={32} className="text-muted-foreground/50" />
            </div>
            <h3 className="text-foreground font-semibold text-lg capitalize">No payment accounts found</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Add a payment account to accept payments from customers during checkout.
            </p>
            <button 
              onClick={() => { resetForm(); setShowForm(true); }}
              className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm"
            >
              Add Account
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/10">
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Account Details</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Type</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Provider</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {accounts.map((account) => (
                    <tr key={account.id} className={`transition-all group ${account.is_active ? 'hover:bg-muted/30' : 'opacity-70 bg-muted/20 grayscale-[0.2]'}`}>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="font-bold text-foreground text-sm">{account.account_name}</span>
                           {account.account_number && <span className="text-xs font-mono text-muted-foreground mt-0.5">{account.account_number}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${typeColor(account.account_type)}`}>
                          {getTypeIcon(account.account_type)}
                          {account.account_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground font-medium">
                        {account.provider_name || '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <span className={`text-[10px] font-bold  capitalize tracking-wider w-12 text-left ${account.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                            {account.is_active ? 'Active' : 'Hidden'}
                          </span>
                          <Switch
                            checked={account.is_active}
                            onCheckedChange={() => toggleActive(account)}
                            className="data-[state=checked]:bg-success"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEdit(account)} 
                            className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-sm"
                            title="Edit Account"
                          >
                            <Pencil size={14} />
                          </button>
                          <button 
                            onClick={() => setViewingAccount(account)} 
                            className="p-2 rounded-lg bg-background border border-border text-primary hover:bg-primary/10 transition-colors shadow-sm"
                            title="View Ledger"
                          >
                            <Wallet size={14} />
                          </button>
                          {account.is_active && (
                            <button 
                              onClick={() => setDeleteId(account.id)} 
                              className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors shadow-sm"
                              title="Deactivate Account"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacking Cards */}
            <div className="md:hidden space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className={`bg-card rounded-2xl border border-border p-5 shadow-sm transition-opacity ${!account.is_active && 'opacity-70 bg-muted/20'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                        {getTypeIcon(account.account_type)}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-base leading-tight capitalize">{account.account_name}</h4>
                        {account.account_number && <span className="text-xs font-mono text-muted-foreground">{account.account_number}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(account)} className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"><Pencil size={16} /></button>
                      {account.is_active && (
                        <button onClick={() => setDeleteId(account.id)} className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-3 border-t border-border/50">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold  capitalize tracking-wider border ${typeColor(account.account_type)}`}>
                        {account.account_type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Provider</span>
                      <span className="font-medium text-foreground">{account.provider_name || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-border/30">
                      <span className="text-muted-foreground">Visibility in checkout</span>
                      <Switch
                        checked={account.is_active}
                        onCheckedChange={() => toggleActive(account)}
                        className="data-[state=checked]:bg-success scale-90"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
          </>
        )}

        {activeTab === 'history' && (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border/50">
              <h3 className="text-lg font-bold">Transfer History Log</h3>
            </div>
            {accountTransfers.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <ArrowRightLeft size={24} className="text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground text-sm">No transfers have been recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/10">
                      <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest">Date & Time</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest">Reference</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest">From Account</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest">To Account</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest">Amount</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest">Staff / User</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground capitalize tracking-widest">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {accountTransfers.map((t) => {
                      const fromAcc = accounts.find(a => a.id === t.from_account_id);
                      const toAcc = accounts.find(a => a.id === t.to_account_id);
                      
                      return (
                        <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground text-sm">{new Date(t.created_at).toLocaleDateString()}</span>
                              <span className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleTimeString()}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                            {t.reference}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground text-sm">{fromAcc?.account_name || 'Unknown'}</span>
                              <span className="text-[10px] text-muted-foreground uppercase">{fromAcc?.account_type || ''}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground text-sm">{toAcc?.account_name || 'Unknown'}</span>
                              <span className="text-[10px] text-muted-foreground uppercase">{toAcc?.account_type || ''}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-foreground">
                            {formatCurrency(t.amount)}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {t.employee_name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {t.notes || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-border bg-muted/10">
              <h3 className="text-xl font-bold text-foreground capitalize">{editingId ? 'Edit Account' : 'New Account'}</h3>
              <button 
                onClick={resetForm}
                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors capitalize"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Account Name <span className="text-destructive">*</span></label>
                <input
                  value={form.account_name}
                  onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                  placeholder="e.g. Main Cash, M-Pesa Till"
                  className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Account Type</label>
                <select
                  value={form.account_type}
                  onChange={(e) => setForm({ ...form, account_type: e.target.value })}
                  className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all appearance-none"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Account Number <span className="lowercase font-medium">(optional)</span></label>
                <input
                  value={form.account_number}
                  onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                  placeholder="e.g. 25261XXXXXX, Till 12345"
                  className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Provider Name <span className="lowercase font-medium">(optional)</span></label>
                <input
                  value={form.provider_name}
                  onChange={(e) => setForm({ ...form, provider_name: e.target.value })}
                  placeholder="e.g. Hormuud Telecom, Equity Bank"
                  className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all"
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-border mt-8">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 rounded-xl bg-muted text-foreground text-sm font-bold hover:bg-accent transition-colors capitalize"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-opacity capitalize"
                >
                  {editingId ? 'Save Changes' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Deactivate Account</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to deactivate <span className="font-semibold text-foreground">"{accountToDelete?.account_name}"</span>? It will be hidden from checkout.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-xl h-11 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-11 font-bold">
              Yes, Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showTransferForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-border bg-muted/10">
              <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <ArrowRightLeft size={20} className="text-primary" />
                Transfer Funds
              </h3>
              <button 
                onClick={() => setShowTransferForm(false)}
                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleTransferSubmit} className="p-6 sm:p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">From Account <span className="text-destructive">*</span></label>
                <SearchableSelect
                  value={transferForm.fromAccountId}
                  onChange={(val) => setTransferForm({ ...transferForm, fromAccountId: val })}
                  options={accounts.filter(a => a.is_active).map(a => ({
                    value: a.id,
                    label: `${a.account_name} (${a.account_type})`,
                    subLabel: a.id === transferForm.toAccountId ? '(Selected as Destination)' : undefined,
                    disabled: a.id === transferForm.toAccountId
                  }))}
                  placeholder="Select Source Account"
                  searchPlaceholder="Search account..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">To Account <span className="text-destructive">*</span></label>
                <SearchableSelect
                  value={transferForm.toAccountId}
                  onChange={(val) => setTransferForm({ ...transferForm, toAccountId: val })}
                  options={accounts.filter(a => a.is_active).map(a => ({
                    value: a.id,
                    label: `${a.account_name} (${a.account_type})`,
                    subLabel: a.id === transferForm.fromAccountId ? '(Selected as Source)' : undefined,
                    disabled: a.id === transferForm.fromAccountId
                  }))}
                  placeholder="Select Destination Account"
                  searchPlaceholder="Search account..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Amount <span className="text-destructive">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black">$</span>
                  <input 
                    type="number" 
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Note <span className="lowercase font-medium">(optional)</span></label>
                <input 
                  type="text" 
                  value={transferForm.note}
                  onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                  placeholder="e.g. Replenishing petty cash"
                  className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-border mt-8">
                <button 
                  type="button" 
                  onClick={() => setShowTransferForm(false)}
                  className="flex-1 py-3 rounded-xl bg-muted text-foreground text-sm font-bold hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
                >
                  Transfer Funds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingAccount && (
        <PaymentAccountLedger account={viewingAccount} onClose={() => setViewingAccount(null)} />
      )}
    </div>
  );
}
