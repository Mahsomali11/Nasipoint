import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { useApp } from '@/context/AppContext';
import { api as apiClient } from '@/api';
import PageHeader from '@/components/PageHeader';
import { toast } from 'sonner';
import { Store, MapPin, Phone, Globe, DollarSign, Ban, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getExchangeRates } from '@/lib/currency';

export default function CreateStorePage() {
  const [storeName, setStoreName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const { addStore, user } = useApp();
  const navigate = (url: string, options?: any) => router.visit(url, options);

  useEffect(() => {
    getExchangeRates().then(setCurrencies);
  }, []);

  // Check store creation limits on mount
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data, error } = await apiClient.rpc('check_store_creation_allowed', {
        _user_id: user.id,
      });
      if (!error && data && typeof data === 'object') {
        const result = data as any;
        if (!result.allowed) {
          setBlocked(result.reason);
        }
      }
    })();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) { toast.error('You must be logged in to create a store'); return; }

    // Double-check server-side before creating
    const { data: check } = await apiClient.rpc('check_store_creation_allowed', { _user_id: user.id });
    const checkResult = check as any;
    if (checkResult && !checkResult.allowed) {
      toast.error(checkResult.reason);
      setBlocked(checkResult.reason);
      return;
    }

    setLoading(true);
    try {
      const selectedCurrency = currencies.find(c => c.currency_code === currency);
      const store = {
        owner_user_id: user.id,
        store_name: storeName,
        store_code: String(Math.floor(10000 + Math.random() * 90000)),
        location,
        phone,
        currency: selectedCurrency?.currency_symbol || currency,
        country,
      };
      const newStore = await addStore(store as any);
      if (newStore) {
        toast.success('Store created successfully!');
        navigate('/dashboard');
      } else {
        toast.error('Failed to create store. Please try again.');
      }
    } catch (error: any) {
      console.error('Store creation error:', error);
      toast.error(error?.message || 'An error occurred while creating the store');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-16">
      <PageHeader 
        title="Create New Store" 
        leftAction={
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-1.5 rounded-lg transition-all mr-2">
            <ArrowLeft size={16} /> Back
          </button>
        }
      />
      
      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
        
        {blocked ? (
           <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-lg mx-auto bg-card rounded-3xl border border-border shadow-sm">
              <div className="w-24 h-24 rounded-3xl bg-destructive/10 flex items-center justify-center mb-6 border border-destructive/20 ring-8 ring-destructive/5">
                <Ban size={40} className="text-destructive" />
              </div>
              <h2 className="text-3xl font-black text-foreground tracking-tight mb-3 capitalize">Limit Reached</h2>
              <p className="text-sm font-medium text-muted-foreground mb-8">{blocked}</p>
              <button
                onClick={() => navigate('/upgrade')}
                className="w-full sm:w-auto h-12 px-8 rounded-xl bg-primary text-primary-foreground text-sm font-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all"
              >
                Upgrade Plan
              </button>
           </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Section 1: Basic Info */}
            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
               <div className="p-8 border-b border-border bg-muted/10">
                  <div className="flex items-center gap-4 mb-2">
                     <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <Store size={24} />
                     </div>
                     <div>
                        <h2 className="text-xl font-black text-foreground capitalize">Store Details</h2>
                        <p className="text-sm font-medium text-muted-foreground mt-0.5">Basic information for your new store.</p>
                     </div>
                  </div>
               </div>
               
               <div className="p-8 space-y-6">
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-start gap-4">
                     <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5 text-primary">
                        <ShieldCheck size={16} />
                     </div>
                     <p className="text-sm font-bold text-primary/90 leading-relaxed pt-1">
                       As the creator, you will automatically be assigned the <span className=" capitalize tracking-widest text-primary font-black mx-1">Owner</span> role for this new store.
                     </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Store Name <span className="text-destructive">*</span></label>
                      <input 
                        value={storeName} 
                        onChange={e => setStoreName(e.target.value)} 
                        placeholder="e.g. Downtown Supermarket"
                        className="w-full px-5 h-14 rounded-2xl border-2 border-border bg-background text-base font-medium text-foreground focus:outline-none focus:ring-0 focus:border-primary transition-all shadow-sm" 
                        required 
                        disabled={loading} 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">City / Location <span className="text-destructive">*</span></label>
                      <input 
                        value={location} 
                        onChange={e => setLocation(e.target.value)} 
                        placeholder="e.g. Mogadishu"
                        className="w-full px-5 h-14 rounded-2xl border-2 border-border bg-background text-base font-medium text-foreground focus:outline-none focus:ring-0 focus:border-primary transition-all shadow-sm" 
                        required 
                        disabled={loading} 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Business Phone <span className="text-destructive">*</span></label>
                      <input 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        placeholder="e.g. +25261..."
                        className="w-full px-5 h-14 rounded-2xl border-2 border-border bg-background text-base font-medium text-foreground focus:outline-none focus:ring-0 focus:border-primary transition-all shadow-sm" 
                        required 
                        disabled={loading} 
                      />
                    </div>
                  </div>
               </div>
            </div>

            {/* Section 2: Localization */}
            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
               <div className="p-8 border-b border-border bg-muted/10">
                  <div className="flex items-center gap-4 mb-2">
                     <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <Globe size={24} />
                     </div>
                     <div>
                        <h2 className="text-xl font-black text-foreground capitalize">Localization</h2>
                        <p className="text-sm font-medium text-muted-foreground mt-0.5">Set the default country and currency.</p>
                     </div>
                  </div>
               </div>
               
               <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Country</label>
                      <input 
                        value={country} 
                        onChange={e => setCountry(e.target.value)} 
                        placeholder="e.g. Somalia"
                        className="w-full px-5 h-14 rounded-2xl border-2 border-border bg-background text-base font-medium text-foreground focus:outline-none focus:ring-0 focus:border-primary transition-all shadow-sm" 
                        disabled={loading} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Primary Currency</label>
                      <select 
                        value={currency} 
                        onChange={e => setCurrency(e.target.value)}
                        className="w-full px-5 h-14 rounded-2xl border-2 border-border bg-background text-base font-bold text-foreground focus:outline-none focus:ring-0 focus:border-primary transition-all shadow-sm" 
                        disabled={loading}
                      >
                        {currencies.map(c => (
                          <option key={c.currency_code} value={c.currency_code}>
                            {c.currency_symbol} — {c.currency_name} ({c.currency_code})
                          </option>
                        ))}
                        {currencies.length === 0 && <option value="KES">KSh — Kenya Shilling</option>}
                      </select>
                      <p className="text-xs font-medium text-muted-foreground mt-2 pl-2">All sales and reports will use this currency.</p>
                    </div>
                  </div>
               </div>
               
               <div className="p-8 border-t border-border bg-muted/5 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl text-base font-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 capitalize"
                  >
                    {loading ? (
                       <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                          Creating...
                       </span>
                    ) : (
                       <span className="flex items-center gap-2">
                          <CheckCircle2 size={20} />
                          Create Store
                       </span>
                    )}
                  </button>
               </div>
            </div>
            
          </form>
        )}

      </div>
    </div>
  );
}
