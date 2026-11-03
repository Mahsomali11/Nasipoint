import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { useApp } from '@/context/AppContext';
import { Trash2, UserPlus, X, Pencil, Plus, Search, ShieldAlert, BadgeCheck, LayoutGrid, Eye } from 'lucide-react';
import StaffActivityDashboard from '@/components/StaffActivityDashboard';
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

export default function StaffAccountsPage() {
  const { staffAccounts, addStaffAccount, deleteStaffAccount, updateStaffAccount, currentStore, stores, user } = useApp();
  const navigate = (url: string) => router.visit(url);
  const userRole = user?.role || 'owner';

  useEffect(() => {
    if (userRole !== 'owner' && userRole !== 'admin') {
      toast.error('Forbidden: You do not have permission to manage Staff Accounts.');
      navigate('/dashboard');
    }
  }, [userRole]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'cashier' | 'inventory_manager'>('cashier');
  const [storeId, setStoreId] = useState<string>(currentStore?.id || '');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingStaffId, setViewingStaffId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const storeStaff = staffAccounts.filter(s => 
     s.store_id === currentStore?.id &&
     (s.full_name?.toLowerCase().includes(search.toLowerCase()) || 
      s.email?.toLowerCase().includes(search.toLowerCase()))
  );
  
  const staffToDelete = deleteId ? staffAccounts.find(s => s.id === deleteId) : null;

  const resetForm = () => {
    setName(''); setEmail(''); setPhone(''); setPassword(''); setRole('cashier'); setStoreId(currentStore?.id || ''); setEditingId(null);
  };

  const openEdit = (staff: typeof staffAccounts[0]) => {
    setEditingId(staff.id);
    setName(staff.full_name);
    setEmail(staff.email);
    setPhone(staff.phone || '');
    setPassword('');
    setRole(staff.role as typeof role);
    setStoreId(staff.store_id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    try {
      if (editingId) {
        await updateStaffAccount(editingId, {
          full_name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role,
          store_id: storeId,
          ...(password.trim() ? { password: password.trim() } : {}),
        });
        toast.success('Staff account updated!');
      } else {
        if (!password.trim()) {
          toast.error('Password is required for new staff');
          return;
        }
        await addStaffAccount({
          store_id: storeId || currentStore?.id || '',
          full_name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role,
          is_active: true,
          password,
        });
        toast.success('Staff account created!');
      }
      resetForm();
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteStaffAccount(deleteId);
    toast.success('Staff account removed');
    setDeleteId(null);
  };

  const getRoleBadge = (r: string) => {
     if (r === 'admin') return <span className="inline-flex items-center gap-1 bg-info/10 text-info border border-info/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold  capitalize tracking-widest"><ShieldAlert size={10} /> Admin</span>;
     if (r === 'inventory_manager') return <span className="inline-flex items-center gap-1 bg-warning/10 text-warning border border-warning/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold  capitalize tracking-widest"><LayoutGrid size={10} /> Inventory</span>;
     return <span className="inline-flex items-center gap-1 bg-success/10 text-success border border-success/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold  capitalize tracking-widest"><BadgeCheck size={10} /> Cashier</span>;
  };

  const viewingStaff = viewingStaffId ? staffAccounts.find(s => s.id === viewingStaffId) : null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-12">
      {viewingStaff && <StaffActivityDashboard staff={viewingStaff} onClose={() => setViewingStaffId(null)} />}
      <PageHeader 
        title="Staff Accounts" 
        rightAction={
          <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus size={18} />
            Add Staff
          </button>
        }
      />
      
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Main layout grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 xl:gap-8">
          
          {/* Main Table Column */}
          <div className="xl:col-span-3 space-y-6">
             {/* Search and filters */}
             <div className="bg-card p-4 rounded-3xl border border-border shadow-sm flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative w-full">
                   <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                   <input
                      type="text"
                      placeholder="Search staff by name or email..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-11 pr-4 h-12 rounded-xl bg-background border border-input text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-sm"
                   />
                </div>
             </div>

            <div className="hidden md:block bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/10">
                    <th className="px-6 py-5 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Name & Email</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-center">Role</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Phone</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {storeStaff.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center">
                        <UserPlus size={40} className="mx-auto mb-4 text-muted-foreground/30" />
                        <p className="text-lg font-bold text-foreground mb-1">No staff found</p>
                        <p className="text-sm text-muted-foreground">Add staff to help manage this store.</p>
                      </td>
                    </tr>
                  ) : (
                    storeStaff.map((staff) => (
                      <tr key={staff.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-lg shrink-0">
                                {staff.full_name.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{staff.full_name}</div>
                                <div className="text-xs font-medium text-muted-foreground">{staff.email}</div>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          {getRoleBadge(staff.role)}
                        </td>
                        <td className="px-6 py-5 text-sm font-medium text-foreground">
                          {staff.phone || '—'}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setViewingStaffId(staff.id)} 
                              className="w-10 h-10 rounded-xl bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors"
                              title="View Activity"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={() => openEdit(staff)} 
                              className="w-10 h-10 rounded-xl bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors"
                              title="Edit Staff"
                            >
                              <Pencil size={16} />
                            </button>
                            <button 
                              onClick={() => setDeleteId(staff.id)} 
                              className="w-10 h-10 rounded-xl bg-muted text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
                              title="Remove Staff"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
               {storeStaff.map((staff) => (
                  <div key={staff.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-lg shrink-0">
                              {staff.full_name.charAt(0).toUpperCase()}
                           </div>
                           <div className="flex flex-col">
                              <span className="font-bold text-foreground text-sm leading-tight">{staff.full_name}</span>
                              <span className="text-xs font-medium text-muted-foreground">{staff.email}</span>
                           </div>
                        </div>
                     </div>
                     <div className="bg-muted/20 rounded-xl p-4 border border-border/50 space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-bold text-muted-foreground  capitalize tracking-widest">Role</span>
                           {getRoleBadge(staff.role)}
                        </div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/50">
                           <span className="text-[10px] font-bold text-muted-foreground  capitalize tracking-widest">Phone</span>
                           <span className="text-xs font-bold text-foreground">{staff.phone || '—'}</span>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button 
                          onClick={() => setViewingStaffId(staff.id)} 
                          className="flex-1 py-2.5 rounded-xl bg-muted text-foreground hover:bg-accent text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                          <Eye size={14} /> View
                        </button>
                        <button 
                          onClick={() => openEdit(staff)} 
                          className="flex-1 py-2.5 rounded-xl bg-muted text-foreground hover:bg-accent text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button 
                          onClick={() => setDeleteId(staff.id)} 
                          className="flex-1 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                     </div>
                  </div>
               ))}
               {storeStaff.length === 0 && (
                  <div className="bg-card rounded-2xl border border-border p-10 text-center shadow-sm">
                     <UserPlus size={40} className="mx-auto mb-4 text-muted-foreground/30" />
                     <p className="text-lg font-bold text-foreground mb-1">No staff found</p>
                     <p className="text-sm text-muted-foreground">Adjust your search or add staff.</p>
                  </div>
               )}
            </div>
          </div>

          {/* Sidebar Info Column */}
          <div className="xl:col-span-1">
            <div className="bg-card rounded-3xl border border-border shadow-sm p-6 sm:p-8 sticky top-6">
              <h4 className="text-[11px] font-bold text-primary  capitalize tracking-widest mb-6 flex items-center gap-2">
                 <ShieldAlert size={14} /> Role Permissions
              </h4>
              <div className="space-y-6">
                {[
                  { name: 'Owner', desc: 'Full access to everything', icon: ShieldAlert, color: 'text-primary bg-primary/10' },
                  { name: 'Admin', desc: 'Manage staff, inventory, and reports', icon: ShieldAlert, color: 'text-info bg-info/10' },
                  { name: 'Inventory Manager', desc: 'Manage stock and transfers', icon: LayoutGrid, color: 'text-warning bg-warning/10' },
                  { name: 'Cashier', desc: 'Process sales and handle payments', icon: BadgeCheck, color: 'text-success bg-success/10' },
                ].map(r => (
                  <div key={r.name} className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${r.color}`}>
                       <r.icon size={14} />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-foreground block mb-0.5">{r.name}</span>
                      <p className="text-xs font-medium text-muted-foreground leading-relaxed">{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-border bg-muted/10">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 capitalize">
                 {editingId ? <Pencil size={18} className="text-primary"/> : <UserPlus size={18} className="text-primary"/>}
                 {editingId ? 'Edit Staff Account' : 'Add New Staff'}
              </h3>
              <button 
                onClick={() => { setShowForm(false); resetForm(); }}
                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 overflow-y-auto max-h-[80vh]">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest block">Full Name <span className="text-destructive">*</span></label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Jane Doe"
                  className="w-full px-4 py-3 h-12 rounded-xl border border-input bg-background text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" 
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest block">Email Address <span className="text-destructive">*</span></label>
                <input 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="jane@example.com"
                  type="email"
                  className="w-full px-4 py-3 h-12 rounded-xl border border-input bg-background text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" 
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest block">Phone Number</label>
                <input 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="Optional"
                  className="w-full px-4 py-3 h-12 rounded-xl border border-input bg-background text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest block">
                  {editingId ? 'New Password' : 'Password'} {!editingId && <span className="text-destructive">*</span>}
                </label>
                <input 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder={editingId ? "Leave blank to keep current" : "Set initial password"}
                  type="password"
                  className="w-full px-4 py-3 h-12 rounded-xl border border-input bg-background text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" 
                  required={!editingId} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest block">Store Assignment</label>
                  <select 
                    value={storeId} 
                    onChange={e => setStoreId(e.target.value)}
                    className="w-full px-4 h-12 rounded-xl border border-input bg-background text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  >
                    <option value="" disabled>Select Store</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.store_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest block">Role Assignment</label>
                  <select 
                    value={role} 
                    onChange={e => setRole(e.target.value as typeof role)}
                    className="w-full px-4 h-12 rounded-xl border border-input bg-background text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="admin">Admin</option>
                    <option value="inventory_manager">Inventory</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-border/50 mt-6">
                <button 
                  type="button" 
                  onClick={() => { setShowForm(false); resetForm(); }} 
                  className="flex-1 py-3 rounded-xl bg-muted text-foreground text-sm font-bold hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity shadow-sm capitalize"
                >
                  {editingId ? 'Save Changes' : 'Create Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl p-0 overflow-hidden border-border">
          <AlertDialogHeader className="p-6 pb-0">
            <AlertDialogTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
               <ShieldAlert size={20} />
               Remove Staff Account
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-sm font-medium">
              Are you sure you want to remove <span className="font-bold text-foreground">"{staffToDelete?.full_name}"</span>? 
              They will lose all access to the system immediately. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-6 bg-muted/10 mt-4 border-t border-border/50 sm:justify-between">
            <AlertDialogCancel className="rounded-xl border-border bg-background hover:bg-muted font-bold px-6 h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold px-6 h-11 shadow-sm">
              Yes, Remove Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
