import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/PageHeader';
import { Search, Pencil, X, Plus, Trash2, Users, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomersPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, currentStore } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });

  const storeCustomers = customers.filter(c => c.store_id === currentStore?.id);
  const filtered = storeCustomers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  const openEdit = (c: typeof customers[0]) => {
    setEditingId(c.id);
    setForm({ name: c.name, phone: c.phone, address: c.address || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateCustomer(editingId, { name: form.name, phone: form.phone, address: form.address });
      toast.success('Customer updated');
      setEditingId(null);
    } else {
      await addCustomer({
        store_id: currentStore?.id || '',
        customer_code: String(customers.length + 1).padStart(3, '0'),
        name: form.name,
        phone: form.phone,
        address: form.address,
      });
      toast.success('Customer added');
    }
    setForm({ name: '', phone: '', address: '' });
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      await deleteCustomer(id);
      toast.success('Customer deleted');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-12">
      <PageHeader 
        title="Customers" 
        rightAction={
          <button 
            onClick={() => { setEditingId(null); setForm({ name: '', phone: '', address: '' }); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Customer</span>
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
            {filtered.length} Customers
          </div>
        </div>

        {/* Data Table / Cards */}
        {filtered.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-16 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Users size={32} className="text-muted-foreground/50" />
            </div>
            <h3 className="text-foreground font-semibold text-lg capitalize">No customers found</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              {search ? 'Try adjusting your search criteria.' : 'Add your first customer to get started.'}
            </p>
            {!search && (
              <button 
                onClick={() => { setEditingId(null); setForm({ name: '', phone: '', address: '' }); setShowForm(true); }}
                className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm"
              >
                Add Customer
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
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Customer Name</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Contact Info</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Address</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{c.customer_code}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-foreground">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-muted-foreground">{c.phone || '—'}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground truncate max-w-[250px]">{c.address || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(c)} className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-sm"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors shadow-sm"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacking Cards */}
            <div className="md:hidden space-y-4">
              {filtered.map((c) => (
                <div key={c.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground capitalize">{c.name}</h4>
                        <span className="text-xs font-mono text-muted-foreground">ID: {c.customer_code}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  
                  <div className="space-y-2.5 pt-4 border-t border-border/50">
                    {c.phone && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Phone size={14} className="text-muted-foreground/70" />
                        <span className="font-medium text-foreground">{c.phone}</span>
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-start gap-3 text-sm text-muted-foreground">
                        <MapPin size={14} className="text-muted-foreground/70 shrink-0 mt-0.5" />
                        <span>{c.address}</span>
                      </div>
                    )}
                    {!c.phone && !c.address && (
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
              <h3 className="text-xl font-bold text-foreground capitalize">{editingId ? 'Edit Customer' : 'Add Customer'}</h3>
              <button 
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Full Name <span className="text-destructive">*</span></label>
                <input 
                  value={form.name} 
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                  placeholder="e.g. John Doe"
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
                  placeholder="Full physical address (optional)"
                  className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" 
                />
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-border mt-8">
                <button 
                  type="button" 
                  onClick={() => { setShowForm(false); setEditingId(null); }} 
                  className="flex-1 py-3 rounded-xl bg-muted text-foreground text-sm font-bold hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-opacity capitalize"
                >
                  {editingId ? 'Save Changes' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
