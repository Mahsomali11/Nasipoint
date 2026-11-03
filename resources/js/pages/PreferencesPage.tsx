import PageHeader from '@/components/PageHeader';
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { useApp } from '@/context/AppContext';
import { getExchangeRates, type ExchangeRate } from '@/lib/currency';
import { toast } from 'sonner';
import { Monitor, Save, Settings, Receipt, Calculator, Bell, ArrowRight } from 'lucide-react';

export default function PreferencesPage() {
  const { currentStore, updateStore } = useApp();
  const [currency, setCurrency] = useState(currentStore?.currency || 'KSh');
  const [taxEnabled, setTaxEnabled] = useState(currentStore?.tax_enabled || false);
  const [taxRate, setTaxRate] = useState((currentStore?.tax_rate || 0).toString());
  const [receiptFooter, setReceiptFooter] = useState(currentStore?.receipt_footer_text || 'Thank you for shopping with us!');
  const [lowStockThreshold, setLowStockThreshold] = useState((currentStore?.low_stock_threshold || 5).toString());
  const [currencies, setCurrencies] = useState<ExchangeRate[]>([]);
  const navigate = (url, options) => router.visit(url, options);

  useEffect(() => {
    getExchangeRates().then(setCurrencies);
  }, []);

  const handleSave = async () => {
    if (currentStore) {
      await updateStore(currentStore.id, {
        currency,
        tax_enabled: taxEnabled,
        tax_rate: parseFloat(taxRate) || 0,
        receipt_footer_text: receiptFooter,
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5
      });
      toast.success('Preferences saved');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <PageHeader 
        title="Store Preferences" 
        rightAction={
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-bold shadow-sm hover:opacity-90 transition-opacity capitalize"
          >
            <Save size={16} />
            <span className="hidden sm:inline">Save Changes</span>
          </button>
        }
      />
      
      <div className="p-6 md:px-8 max-w-5xl mx-auto w-full mt-6 space-y-12">

        {/* Section 1: General Preferences */}
        <div className="flex flex-col md:flex-row gap-8 pb-10 border-b border-border">
          <div className="w-full md:w-1/3 shrink-0">
            <h2 className="text-base font-semibold text-foreground mb-2 capitalize">General Settings</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Configure the primary currency and inventory thresholds for your store.
            </p>
          </div>
          <div className="w-full md:w-2/3">
             <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden">
                <div className="p-6 space-y-5">
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Store Currency</label>
                    <select 
                      value={currency} 
                      onChange={e => setCurrency(e.target.value)}
                      className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm appearance-none"
                    >
                      {currencies.map(c => (
                         <option key={c.currency_code} value={c.currency_symbol}>
                          {c.currency_symbol} — {c.currency_name} ({c.currency_code})
                        </option>
                      ))}
                      {currencies.length === 0 && (
                        <>
                          <option value="KSh">KSh (Kenya Shilling)</option>
                          <option value="$">$ (US Dollar)</option>
                          <option value="€">€ (Euro)</option>
                        </>
                      )}
                    </select>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      All store operations use this currency. Platform analytics are converted to USD automatically.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Low Stock Threshold</label>
                    <input 
                      type="number" 
                      value={lowStockThreshold} 
                      onChange={e => setLowStockThreshold(e.target.value)}
                      className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm" 
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      You will receive dashboard warnings when item quantities fall below this number.
                    </p>
                  </div>

                </div>
             </div>
          </div>
        </div>

        {/* Section 2: Financial & Tax */}
        <div className="flex flex-col md:flex-row gap-8 pb-10 border-b border-border">
          <div className="w-full md:w-1/3 shrink-0">
            <h2 className="text-base font-semibold text-foreground mb-2 capitalize">Tax & VAT</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enable automatic tax calculations on your receipts and sales reports.
            </p>
          </div>
          <div className="w-full md:w-2/3">
             <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden">
                <div className="p-6 space-y-6">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-semibold text-foreground block capitalize">Enable Tax Calculation</label>
                      <p className="text-xs text-muted-foreground mt-1">Apply tax automatically to all sales</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setTaxEnabled(!taxEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${taxEnabled ? 'bg-primary' : 'bg-muted border border-border'}`}
                    >
                      <div className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${taxEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {taxEnabled && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Default Tax Rate (%)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={taxRate} 
                        onChange={e => setTaxRate(e.target.value)}
                        className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm" 
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        This percentage will be automatically applied to subtotal on all sales.
                      </p>
                    </div>
                  )}

                </div>
             </div>
          </div>
        </div>

        {/* Section 3: Device Management */}
        <div className="flex flex-col md:flex-row gap-8 pb-10">
          <div className="w-full md:w-1/3 shrink-0">
            <h2 className="text-base font-semibold text-foreground mb-2 capitalize">Linked Devices</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Manage the physical devices (phones, tablets, laptops) that are authorized to access this store.
            </p>
          </div>
          <div className="w-full md:w-2/3">
             <div className="bg-card rounded-md border border-border shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Monitor size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground capitalize">Device Management</h3>
                    <p className="text-xs text-muted-foreground">View or revoke active device sessions</p>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate('/devices')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                >
                  Manage Devices <ArrowRight size={16} />
                </button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
