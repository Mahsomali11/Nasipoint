import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/PageHeader';
import StoreLogoUpload from '@/components/StoreLogoUpload';
import { toast } from 'sonner';
import { Save, Store, MapPin, Phone, Receipt, Info } from 'lucide-react';

export default function StoreEditPage() {
  const { currentStore, updateStore, user } = useApp();
  const navigate = (url, options) => router.visit(url, options);
  
  const userRole = user?.role || 'owner';

  useEffect(() => {
    if (userRole !== 'owner' && userRole !== 'admin') {
      toast.error('Forbidden: You do not have permission to access Store Settings.');
      navigate('/dashboard');
    }
  }, [userRole]);
  
  const [name, setName] = useState(currentStore?.store_name || '');
  const [location, setLocation] = useState(currentStore?.location || '');
  const [phone, setPhone] = useState(currentStore?.phone || '');
  const [logoUrl, setLogoUrl] = useState(currentStore?.logo_url || '');
  const [showLogoOnReceipt, setShowLogoOnReceipt] = useState(currentStore?.show_logo_on_receipt ?? true);
  const [thankYouMessage, setThankYouMessage] = useState(currentStore?.receipt_thank_you_message || 'Thank you for your purchase!');
  const [receiptFooter, setReceiptFooter] = useState(currentStore?.receipt_footer_text || '');
  const [receiptTemplate, setReceiptTemplate] = useState(currentStore?.receipt_template || 'classic');
  const [primaryColor, setPrimaryColor] = useState(currentStore?.primary_color || '#2d7d46');
  const [secondaryColor, setSecondaryColor] = useState(currentStore?.secondary_color || '#1e5c32');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !location || !phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setSaving(true);
    if (currentStore) {
      await updateStore(currentStore.id, {
        store_name: name,
        location,
        phone,
        logo_url: logoUrl,
        show_logo_on_receipt: showLogoOnReceipt,
        receipt_thank_you_message: thankYouMessage,
        receipt_footer_text: receiptFooter,
        receipt_template: receiptTemplate,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      });
      toast.success('Store settings saved');
      window.history.back();
    }
    setSaving(false);
  };

  if (!currentStore) return null;

  return (
    <div className="min-h-screen bg-background pb-16">
      <PageHeader 
        title="Store Settings" 
        rightAction={
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 capitalize"
          >
            <Save size={16} />
            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        }
      />
      
      <div className="p-6 md:px-8 max-w-5xl mx-auto w-full mt-6 space-y-12">
        
        {/* Section 1: Logo */}
        <div className="flex flex-col md:flex-row gap-8 pb-10 border-b border-border">
          <div className="w-full md:w-1/3 shrink-0">
            <h2 className="text-base font-semibold text-foreground mb-2 capitalize">Store Brand</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Upload your store logo. This will be displayed in the application header and optionally on customer receipts.
            </p>
          </div>
          <div className="w-full md:w-2/3">
             <div className="bg-card rounded-md border border-border shadow-sm p-6 max-w-md">
                <StoreLogoUpload
                  storeId={currentStore.id}
                  currentLogoUrl={logoUrl}
                  storeName={currentStore.store_name}
                  onLogoUploaded={setLogoUrl}
                  size="lg"
                />
             </div>
          </div>
        </div>

        {/* Section 2: General Information */}
        <div className="flex flex-col md:flex-row gap-8 pb-10 border-b border-border">
          <div className="w-full md:w-1/3 shrink-0">
            <h2 className="text-base font-semibold text-foreground mb-2 capitalize">General Information</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Basic details about your business. This information helps us identify your store and appears on your receipts.
            </p>
            <div className="mt-6 flex items-start gap-2 bg-muted/30 p-3 rounded-md border border-border">
               <Info size={16} className="text-muted-foreground shrink-0 mt-0.5" />
               <div>
                  <span className="block text-xs font-semibold text-foreground">System Store ID</span>
                  <code className="text-xs text-muted-foreground font-mono mt-1">{currentStore.store_code}</code>
               </div>
            </div>
          </div>
          <div className="w-full md:w-2/3">
            <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden">
               <div className="p-6 space-y-5">
                 
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Store Name <span className="text-destructive">*</span></label>
                    <input 
                      value={name} 
                      onChange={e => setName(e.target.value)}
                      className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm" 
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Business Location <span className="text-destructive">*</span></label>
                    <input 
                      value={location} 
                      onChange={e => setLocation(e.target.value)}
                      className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm" 
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Contact Phone <span className="text-destructive">*</span></label>
                    <input 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm" 
                      required 
                    />
                  </div>
                  
               </div>
            </div>
          </div>
        </div>

        {/* Section 2.5: Store Theme */}
        <div className="flex flex-col md:flex-row gap-8 pb-10 border-b border-border">
          <div className="w-full md:w-1/3 shrink-0">
            <h2 className="text-base font-semibold text-foreground mb-2 capitalize">Store Theme</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Customize the colors of your POS and dashboard. These colors apply automatically to buttons, links, and accents.
            </p>
          </div>
          <div className="w-full md:w-2/3">
            <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden">
               <div className="p-6 space-y-6">
                 
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color"
                        value={primaryColor} 
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="w-12 h-12 p-1 rounded-md border border-input cursor-pointer" 
                      />
                      <input 
                        type="text"
                        value={primaryColor} 
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="w-32 px-3 h-10 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary " 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Secondary Color</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color"
                        value={secondaryColor} 
                        onChange={e => setSecondaryColor(e.target.value)}
                        className="w-12 h-12 p-1 rounded-md border border-input cursor-pointer" 
                      />
                      <input 
                        type="text"
                        value={secondaryColor} 
                        onChange={e => setSecondaryColor(e.target.value)}
                        className="w-32 px-3 h-10 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary " 
                      />
                    </div>
                  </div>
                  
               </div>
            </div>
          </div>
        </div>

        {/* Section 3: Receipt Branding */}
        <div className="flex flex-col md:flex-row gap-8 pb-10">
          <div className="w-full md:w-1/3 shrink-0">
            <h2 className="text-base font-semibold text-foreground mb-2 capitalize">Receipt Configuration</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Customize how your receipts look. You can add a personalized thank you message and a custom footer for policies or Wi-Fi passwords.
            </p>
          </div>
          <div className="w-full md:w-2/3">
            <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden">
               <div className="p-6 space-y-6">
                 
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Receipt Design Template</label>
                    <div className="relative">
                      <select 
                        value={receiptTemplate} 
                        onChange={e => setReceiptTemplate(e.target.value)}
                        className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm appearance-none"
                      >
                        <option value="classic">Classic (Side-by-Side)</option>
                        <option value="modern">Modern (Centered Thermal)</option>
                        <option value="compact">Compact (Minimal)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                 </div>

                 <hr className="border-border" />
                 
                 {/* Toggle Switch */}
                 <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-semibold text-foreground block capitalize">Show Logo on Receipt</label>
                      <p className="text-xs text-muted-foreground mt-1">Print your store brand at the top of receipts</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowLogoOnReceipt(!showLogoOnReceipt)}
                      className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${showLogoOnReceipt ? 'bg-primary' : 'bg-muted border border-border'}`}
                    >
                      <div className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${showLogoOnReceipt ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  
                  <hr className="border-border" />

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Thank You Message</label>
                    <input 
                      value={thankYouMessage} 
                      onChange={e => setThankYouMessage(e.target.value)}
                      className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm" 
                      placeholder="e.g. Thank you for your purchase!"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Custom Footer Text</label>
                    <textarea 
                      value={receiptFooter} 
                      onChange={e => setReceiptFooter(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm resize-none" 
                      placeholder="Optional details (Return policy, social media, etc.)"
                    />
                  </div>
                  
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
