import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/PageHeader';
import { Search, Trash2, Plus, X, Building2, MapPin, Phone } from 'lucide-react';
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

export default function SuppliersPage() {
  const { suppliers, addSupplier, deleteSupplier, currentStore } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const storeSuppliers = suppliers.filter(s => s.store_id === currentStore?.id);
  const filtered = storeSuppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.phone.includes(search)
  );
  const supplierToDelete = deleteId ? suppliers.find(s => s.id === deleteId) : null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addSupplier({
      store_id: currentStore?.id || '',
      supplier_code: String(suppliers.length + 1).padStart(3, '0'),
      name: form.name,
      phone: form.phone,
      address: form.address,
    });
    toast.success('Supplier added');
    setForm({ name: '', phone: '', address: '' });
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteSupplier(deleteId);
    toast.success('Supplier deleted');
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-12">
      <PageHeader 
        title="Suppliers" 
        rightAction={
          <button 
            onClick={() => { setForm({ name: '', phone: '', address: '' }); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Supplier</span>
          </button>
        }
      />
      
      <div className="p-4 sm:p-6 md:px-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Controls Bar */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search by name or phone..."
              className="w-full pl-11 pr-4 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" 
            />
          </div>
          <div className="text-sm font-bold text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg w-full sm:w-auto text-center">
            {filtered.length} Suppliers
          </div>
        </div>

        {/* Data Table / Cards */}
        {filtered.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-16 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Building2 size={32} className="text-muted-foreground/50" />
            </div>
            <h3 className="text-foreground font-semibold text-lg capitalize">No suppliers found</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              {search ? 'Try adjusting your search criteria.' : 'Add your first supplier to manage inventory sources.'}
            </p>
            {!search && (
              <button 
                onClick={() => { setForm({ name: '', phone: '', address: '' }); setShowForm(true); }}
                className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm"
              >
                Add Supplier
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/10">
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">ID</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Supplier Name</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Contact Info</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Address</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{s.supplier_code}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-foreground">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-muted-foreground">{s.phone || '—'}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground truncate max-w-[250px]">{s.address || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setDeleteId(s.id)} 
                          className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                          title="Delete Supplier"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacking Cards */}
            <div className="md:hidden space-y-4">
              {filtered.map((s) => (
                <div key={s.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground capitalize">{s.name}</h4>
                        <span className="text-xs font-mono text-muted-foreground">ID: {s.supplier_code}</span>
                      </div>
                    </div>
                    <button onClick={() => setDeleteId(s.id)} className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={16} /></button>
                  </div>
                  
                  <div className="space-y-2.5 pt-4 border-t border-border/50">
                    {s.phone && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Phone size={14} className="text-muted-foreground/70" />
                        <span className="font-medium text-foreground">{s.phone}</span>
                      </div>
                    )}
                    {s.address && (
                      <div className="flex items-start gap-3 text-sm text-muted-foreground">
                        <MapPin size={14} className="text-muted-foreground/70 shrink-0 mt-0.5" />
                        <span>{s.address}</span>
                      </div>
                    )}
                    {!s.phone && !s.address && (
                      <span className="text-xs text-muted-foreground italic">No contact details provided</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-border bg-muted/10">
              <h3 className="text-xl font-bold text-foreground capitalize">Add New Supplier</h3>
              <button 
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 sm:p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Supplier Name <span className="text-destructive">*</span></label>
                <input 
                  value={form.name} 
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                  placeholder="e.g. Acme Corp"
                  className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Phone Number</label>
                <input 
                  value={form.phone} 
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} 
                  placeholder="e.g. 0700123456"
                  className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Address</label>
                <input 
                  value={form.address} 
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))} 
                  placeholder="Full physical address"
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
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-opacity capitalize"
                >
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{supplierToDelete?.name}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-xl h-11 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-11 font-bold">
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
