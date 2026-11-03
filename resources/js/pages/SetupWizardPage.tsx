import { useState } from 'react';
import { router } from '@inertiajs/react';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Package, Users, UserPlus, CreditCard, Rocket, Plus, Trash2 } from 'lucide-react';

const STARTER_TEMPLATES: Record<string, { name: string; cost: number; sell: number }[]> = {
  'Phone Accessories': [
    { name: 'Phone Case', cost: 200, sell: 500 },
    { name: 'Screen Protector', cost: 100, sell: 300 },
    { name: 'USB Cable', cost: 150, sell: 400 },
    { name: 'Earphones', cost: 300, sell: 700 },
    { name: 'Phone Charger', cost: 250, sell: 600 },
  ],
  'Electronics': [
    { name: 'Bluetooth Speaker', cost: 800, sell: 1500 },
    { name: 'Power Bank', cost: 600, sell: 1200 },
    { name: 'LED Bulb', cost: 100, sell: 250 },
    { name: 'Extension Cable', cost: 300, sell: 600 },
  ],
  'Grocery': [
    { name: 'Rice (1kg)', cost: 120, sell: 180 },
    { name: 'Sugar (1kg)', cost: 130, sell: 170 },
    { name: 'Cooking Oil (1L)', cost: 250, sell: 320 },
    { name: 'Flour (2kg)', cost: 150, sell: 200 },
    { name: 'Milk (500ml)', cost: 50, sell: 70 },
  ],
  'Clothing': [
    { name: 'T-Shirt', cost: 300, sell: 700 },
    { name: 'Jeans', cost: 800, sell: 1500 },
    { name: 'Socks (pair)', cost: 50, sell: 150 },
    { name: 'Cap', cost: 200, sell: 500 },
  ],
};

const PAYMENT_METHODS = ['Cash', 'Mobile Money', 'Card'];

interface ProductEntry { name: string; barcode: string; cost: number; sell: number; quantity: number }
interface CustomerEntry { name: string; phone: string; address: string }
interface StaffEntry { name: string; email: string; role: string }

export default function SetupWizardPage() {
  const [step, setStep] = useState(0);
  const totalSteps = 6;
  const navigate = (url, options) => router.visit(url, options);
  const { currentStore, addItem, addCustomer, addStaffAccount } = useApp();

  // Step 2: Products
  const [products, setProducts] = useState<ProductEntry[]>([{ name: '', barcode: '', cost: 0, sell: 0, quantity: 0 }]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Step 3: Customer
  const [customer, setCustomer] = useState<CustomerEntry>({ name: '', phone: '', address: '' });

  // Step 4: Staff
  const [staff, setStaff] = useState<StaffEntry>({ name: '', email: '', role: 'cashier' });

  // Step 5: Payment methods
  const [paymentMethods, setPaymentMethods] = useState<Record<string, boolean>>({ Cash: true, 'Mobile Money': false, Card: false });

  const [saving, setSaving] = useState(false);

  const handleImportTemplate = (category: string) => {
    const items = STARTER_TEMPLATES[category];
    if (items) {
      setProducts(items.map(i => ({ name: i.name, barcode: '', cost: i.cost, sell: i.sell, quantity: 10 })));
      setSelectedTemplate(category);
      toast.success(`${category} template loaded!`);
    }
  };

  const addProductRow = () => {
    setProducts([...products, { name: '', barcode: '', cost: 0, sell: 0, quantity: 0 }]);
  };

  const removeProductRow = (idx: number) => {
    if (products.length > 1) setProducts(products.filter((_, i) => i !== idx));
  };

  const updateProduct = (idx: number, field: keyof ProductEntry, value: string | number) => {
    setProducts(products.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const saveProducts = async () => {
    if (!currentStore) return;
    setSaving(true);
    const validProducts = products.filter(p => p.name.trim());
    for (const p of validProducts) {
      await addItem({
        store_id: currentStore.id,
        name: p.name,
        barcode: p.barcode,
        cost_price: p.cost,
        sell_price: p.sell,
        quantity: p.quantity,
        item_code: '',
        type: 'product',
        low_stock_threshold: 5,
        is_active: true,
      });
    }
    if (validProducts.length > 0) toast.success(`${validProducts.length} products added!`);
    setSaving(false);
    setStep(3);
  };

  const saveCustomer = async () => {
    if (!currentStore || !customer.name.trim()) { setStep(4); return; }
    setSaving(true);
    await addCustomer({
      store_id: currentStore.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      customer_code: '',
    });
    toast.success('Customer added!');
    setSaving(false);
    setStep(4);
  };

  const saveStaff = async () => {
    if (!currentStore || !staff.name.trim()) { setStep(5); return; }
    setSaving(true);
    await addStaffAccount({
      store_id: currentStore.id,
      full_name: staff.name,
      email: staff.email,
      phone: '',
      role: staff.role as any,
      is_active: true,
    });
    toast.success('Staff member added!');
    setSaving(false);
    setStep(5);
  };

  const finishSetup = () => {
    localStorage.setItem('onboarding_complete', 'false');
    localStorage.setItem('setup_wizard_done', 'true');
    toast.success('Your store is ready! Start selling now.');
    navigate('/dashboard');
  };

  const inputClass = "w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm";
  const btnPrimary = "h-11 rounded-md bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center";
  const btnSecondary = "h-11 rounded-md bg-muted text-foreground text-sm font-bold hover:bg-accent transition-colors flex items-center justify-center border border-border shadow-sm";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card rounded-md border border-border shadow-sm overflow-hidden">
        {step > 0 && (
          <div className="px-6 pt-6 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground  capitalize tracking-wider">Setup {step}/{totalSteps - 1}</span>
              <span className="text-xs font-bold text-primary">{Math.round((step / (totalSteps - 1)) * 100)}%</span>
            </div>
            <Progress value={(step / (totalSteps - 1)) * 100} className="h-1.5" />
          </div>
        )}

        <div className="px-6 py-8">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="flex flex-col items-center justify-center text-center animate-fade-in py-8">
              <div className="w-16 h-16 rounded bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                <Sparkles size={32} className="text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-2  capitalize tracking-wider">Welcome to Your POS</h1>
              <p className="text-sm text-muted-foreground mb-8 max-w-sm">Let's set up your store in a few simple steps. This will only take a couple of minutes.</p>
              <button onClick={() => setStep(1)} className={`${btnPrimary} w-full max-w-xs px-8`}>
                Start Setup
              </button>
            </div>
          )}

          {/* Step 1: Store confirmation */}
          {step === 1 && (
            <div className="animate-fade-in space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Package size={18} className="text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground  capitalize tracking-wider">Store Profile</h2>
                </div>
                <p className="text-xs text-muted-foreground">Your store has been created. You can edit these details later in settings.</p>
              </div>

              <div className="bg-background rounded-md border border-border p-4 space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs font-medium text-muted-foreground ">Store Name</span>
                  <span className="text-sm font-semibold text-foreground">{currentStore?.store_name}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-border pt-3">
                  <span className="text-xs font-medium text-muted-foreground ">Location</span>
                  <span className="text-sm font-semibold text-foreground">{currentStore?.location || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-border pt-3">
                  <span className="text-xs font-medium text-muted-foreground ">Currency</span>
                  <span className="text-sm font-semibold text-foreground">{currentStore?.currency}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-border pt-3">
                  <span className="text-xs font-medium text-muted-foreground ">Store Code</span>
                  <span className="text-sm font-semibold text-foreground">{currentStore?.store_code}</span>
                </div>
              </div>
              <button onClick={() => setStep(2)} className={`${btnPrimary} w-full`}>Next — Add Products</button>
            </div>
          )}

          {/* Step 2: Inventory */}
          {step === 2 && (
            <div className="animate-fade-in space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Package size={18} className="text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground  capitalize tracking-wider">Add First Products</h2>
                </div>
                <p className="text-xs text-muted-foreground">Add products or import a starter template.</p>
              </div>

              {/* Templates */}
              <div className="flex flex-wrap gap-2">
                {Object.keys(STARTER_TEMPLATES).map(cat => (
                  <button key={cat} onClick={() => handleImportTemplate(cat)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold  capitalize tracking-wider border transition-colors ${selectedTemplate === cat ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/50'}`}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Product rows */}
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                {products.map((p, i) => (
                  <div key={i} className="bg-background rounded-md border border-border p-3 space-y-2">
                    <div className="flex gap-2">
                      <input value={p.name} onChange={e => updateProduct(i, 'name', e.target.value)} placeholder="Product name" className={`${inputClass} flex-1`} />
                      {products.length > 1 && (
                        <button onClick={() => removeProductRow(i)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" value={p.cost || ''} onChange={e => updateProduct(i, 'cost', Number(e.target.value))} placeholder="Cost" className={inputClass} />
                      <input type="number" value={p.sell || ''} onChange={e => updateProduct(i, 'sell', Number(e.target.value))} placeholder="Sell" className={inputClass} />
                      <input type="number" value={p.quantity || ''} onChange={e => updateProduct(i, 'quantity', Number(e.target.value))} placeholder="Qty" className={inputClass} />
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={addProductRow} className="flex items-center gap-1.5 text-xs font-semibold text-primary capitalize">
                <Plus size={14} /> Add another product
              </button>

              <div className="flex gap-3 border-t border-border pt-4 mt-4">
                <button onClick={() => setStep(3)} className={`${btnSecondary} flex-1`}>Skip</button>
                <button onClick={saveProducts} disabled={saving} className={`${btnPrimary} flex-[2]`}>
                  {saving ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Customer */}
          {step === 3 && (
            <div className="animate-fade-in space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users size={18} className="text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground  capitalize tracking-wider">Add First Customer</h2>
                </div>
                <p className="text-xs text-muted-foreground">Optional — useful for credit sales.</p>
              </div>

              <div className="flex flex-col gap-3">
                <input value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} placeholder="Customer name" className={inputClass} />
                <input value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} placeholder="Phone number" className={inputClass} />
                <input value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} placeholder="Address (optional)" className={inputClass} />
              </div>

              <div className="flex gap-3 border-t border-border pt-4 mt-4">
                <button onClick={() => setStep(4)} className={`${btnSecondary} flex-1`}>Skip</button>
                <button onClick={saveCustomer} disabled={saving} className={`${btnPrimary} flex-[2]`}>
                  {saving ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Staff */}
          {step === 4 && (
            <div className="animate-fade-in space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <UserPlus size={18} className="text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground  capitalize tracking-wider">Add Staff Member</h2>
                </div>
                <p className="text-xs text-muted-foreground">Optional — add your team members.</p>
              </div>

              <div className="flex flex-col gap-3">
                <input value={staff.name} onChange={e => setStaff({ ...staff, name: e.target.value })} placeholder="Staff name" className={inputClass} />
                <input value={staff.email} onChange={e => setStaff({ ...staff, email: e.target.value })} placeholder="Email" className={inputClass} />
                <select value={staff.role} onChange={e => setStaff({ ...staff, role: e.target.value })} className={inputClass}>
                  <option value="admin">Admin</option>
                  <option value="cashier">Cashier</option>
                  <option value="inventory_manager">Inventory Manager</option>
                </select>
              </div>

              <div className="flex gap-3 border-t border-border pt-4 mt-4">
                <button onClick={() => setStep(5)} className={`${btnSecondary} flex-1`}>Skip</button>
                <button onClick={saveStaff} disabled={saving} className={`${btnPrimary} flex-[2]`}>
                  {saving ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Payment methods */}
          {step === 5 && (
            <div className="animate-fade-in space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard size={18} className="text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground  capitalize tracking-wider">Payment Settings</h2>
                </div>
                <p className="text-xs text-muted-foreground">Enable your accepted payment methods.</p>
              </div>

              <div className="flex flex-col gap-2">
                {PAYMENT_METHODS.map(method => (
                  <label key={method} className="flex items-center gap-3 bg-background rounded-md p-3 border border-border cursor-pointer hover:border-primary/50 transition-colors capitalize">
                    <input type="checkbox" checked={paymentMethods[method]}
                      onChange={() => setPaymentMethods({ ...paymentMethods, [method]: !paymentMethods[method] })}
                      className="w-4 h-4 rounded border-input accent-primary" />
                    <span className="text-sm font-medium text-foreground">{method}</span>
                  </label>
                ))}
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <button onClick={finishSetup} className={`${btnPrimary} w-full gap-2`}>
                  <Rocket size={16} /> Finish Setup — Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

