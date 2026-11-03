import { useState } from 'react';
import { router } from '@inertiajs/react';
import { useApp } from '@/context/AppContext';
import { Store, Plus, Trash2, MapPin, ArrowRight, Building2, Store as StoreIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function SelectStorePage() {
  const { stores, setCurrentStore, deleteStore, user } = useApp();
  const navigate = (url: string, options?: any) => router.visit(url, options);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSelect = (store: typeof stores[0]) => {
    setCurrentStore(store);
    navigate('/dashboard');
  };

  const handleDelete = async (e: React.MouseEvent, storeId: string, storeName: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${storeName}"? This will permanently remove all store data including sales, inventory, and customers.`)) return;
    setDeleting(storeId);
    try {
      const success = await deleteStore(storeId);
      if (success) {
        toast.success(`"${storeName}" deleted successfully`);
        if (stores.length <= 1) navigate('/create-store');
      } else {
        toast.error('Failed to delete store');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete store');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background abstract elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl opacity-50"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="w-full max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20 ring-8 ring-primary/10">
            <Building2 size={36} className="text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-3 capitalize">Welcome, {user?.full_name?.split(' ')[0] || 'User'}!</h1>
          <p className="text-sm font-medium text-muted-foreground  capitalize tracking-widest">Select a workspace to continue</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map(store => (
            <div key={store.id} className="relative group">
              <button 
                onClick={() => handleSelect(store)}
                className="w-full h-full bg-card rounded-3xl border border-border p-6 sm:p-8 text-left hover:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-6">
                   <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                     <StoreIcon size={24} />
                   </div>
                   <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <ArrowRight size={14} />
                   </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors capitalize">{store.store_name}</h3>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                     <MapPin size={14} className="shrink-0" />
                     <span className="truncate">{store.location || 'No location set'}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                     <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-[10px] font-bold text-muted-foreground  capitalize tracking-widest">
                        ID: {store.store_code}
                     </span>
                  </div>
                </div>
              </button>
              
              <button
                onClick={(e) => handleDelete(e, store.id, store.store_name)}
                disabled={deleting === store.id}
                className="absolute right-4 bottom-4 w-10 h-10 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all disabled:opacity-50 z-20 shadow-sm"
                title="Delete store"
              >
                {deleting === store.id ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </div>
          ))}
          
          <button 
            onClick={() => navigate('/create-store')}
            className="w-full h-full min-h-[220px] bg-muted/10 rounded-3xl border-2 border-dashed border-border p-6 flex flex-col items-center justify-center text-center hover:bg-primary/5 hover:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all group shadow-sm"
          >
            <div className="w-14 h-14 rounded-full bg-background border border-border flex items-center justify-center mb-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 group-hover:border-primary/30 transition-all shadow-sm">
              <Plus size={24} />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors capitalize">Add New Store</h3>
            <p className="text-xs font-medium text-muted-foreground">Create another workspace</p>
          </button>
        </div>
      </div>
    </div>
  );
}
