import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { api as apiClient } from '@/api';
import PageHeader from '@/components/PageHeader';
import { Plus, X, Package, Search, PlusCircle, Trash2, CheckCircle2, Clock, FileText, ScanBarcode } from 'lucide-react';
import BarcodeScanner from '@/components/BarcodeScanner';
import { SearchableSelect } from '@/components/ui/searchable-select';
export default function PurchasesPage() {
  const { purchases, purchaseItems: globalPurchaseItems, suppliers, items, categories, currentStore, formatCurrency, recordPurchase, refreshData } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'pending' | 'completed'>('completed');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<{ item_id: string; quantity: number; cost_price: number; sell_price: number }[]>([]);
  const [updateCostPrice, setUpdateCostPrice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Add Product State
  const [showQuickAddProduct, setShowQuickAddProduct] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddCategory, setQuickAddCategory] = useState('');
  const [quickAddSubCategory, setQuickAddSubCategory] = useState('');
  const [quickAddBarcode, setQuickAddBarcode] = useState('');
  const [quickAddCostPrice, setQuickAddCostPrice] = useState('');
  const [quickAddSellingPrice, setQuickAddSellingPrice] = useState('');
  const [quickAddInitialQuantity, setQuickAddInitialQuantity] = useState('');
  const [quickAddLowStock, setQuickAddLowStock] = useState('5');
  const [showScanner, setShowScanner] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Category computation
  const storeItems = useMemo(() => items.filter(i => i.store_id === currentStore?.id && i.type === 'product' && i.is_active), [items, currentStore]);
  const storeCategories = useMemo(() => categories.filter(c => c.store_id === currentStore?.id), [categories, currentStore]);
  const allCategoryNames = useMemo(() => {
      const existingItemCategories = Array.from(new Set(storeItems.map(i => i.category).filter(Boolean)));
      return Array.from(new Set([...storeCategories.filter(c => !c.parent_id).map(c => c.name), ...existingItemCategories]));
  }, [storeCategories, storeItems]);

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

  // Derived Values
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const sup = suppliers.find(s => s.id === p.supplier_id);
      const matchesSearch = p.reference_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (sup && sup.name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [purchases, searchTerm, suppliers]);

  const totalPurchaseAmount = useMemo(() => {
    return purchaseItems.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0);
  }, [purchaseItems]);

  const handleAddItem = () => {
    setPurchaseItems([...purchaseItems, { item_id: '', quantity: 1, cost_price: 0, sell_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...purchaseItems];
    if (field === 'item_id') {
      const selectedItem = items.find(i => i.id === value);
      newItems[index] = { 
        ...newItems[index], 
        item_id: value,
        cost_price: selectedItem ? selectedItem.cost_price : 0,
        sell_price: selectedItem ? selectedItem.sell_price : 0
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setPurchaseItems(newItems);
  };

  const handleQuickAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore || isSubmittingProduct) return;
    setIsSubmittingProduct(true);
    
    try {
        const { data, error } = await apiClient.from('items').insert({
            store_id: currentStore.id,
            name: quickAddName,
            type: 'product',
            category: quickAddCategory || 'General',
            sub_category_id: quickAddSubCategory || null,
            barcode: quickAddBarcode,
            low_stock_threshold: Number(quickAddLowStock) || 5,
            cost_price: Number(quickAddCostPrice) || 0,
            sell_price: Number(quickAddSellingPrice) || 0,
            quantity: 0,
            is_active: true
        });

        if (error) throw new Error(error.message || 'Failed to add product');
        
        // Ensure data exists
        const newItem = Array.isArray(data) ? data[0] : data;
        
        // Add to global items temporarily so dropdown finds it immediately
        if (newItem) {
           items.push(newItem);
           
           // Add to purchase line items
           const newItems = [...purchaseItems];
           newItems.push({
               item_id: newItem.id,
               quantity: Number(quickAddInitialQuantity) || 1,
               cost_price: Number(quickAddCostPrice) || 0,
               sell_price: Number(quickAddSellingPrice) || 0
           });
           setPurchaseItems(newItems);
        }

        // trigger global data refresh in background
        if (refreshData) refreshData();
        
        setShowQuickAddProduct(false);
        setQuickAddName('');
        setQuickAddCategory('');
        setQuickAddSubCategory('');
        setQuickAddBarcode('');
        setQuickAddCostPrice('');
        setQuickAddSellingPrice('');
        setQuickAddInitialQuantity('');
        setQuickAddLowStock('5');
    } catch (err: any) {
        alert(err.message || 'Error saving product');
    } finally {
        setIsSubmittingProduct(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!currentStore) return;
    if (purchaseItems.length === 0) {
      alert("Please add at least one item to the purchase.");
      return;
    }

    const hasInvalidItems = purchaseItems.some(i => !i.item_id || i.quantity <= 0 || i.cost_price < 0);
    if (hasInvalidItems) {
      alert("Please ensure all selected items have a valid quantity and cost price.");
      return;
    }

    setIsSubmitting(true);
    try {
      await recordPurchase({
        store_id: currentStore.id,
        supplier_id: supplierId,
        payment_account_id: paymentAccountId || null,
        date,
        paid_amount: Number(paidAmount) || 0,
        status,
        items: purchaseItems,
        update_cost_price: updateCostPrice,
        notes
      });
      setShowForm(false);
      
      // Reset form
      setSupplierId('');
      setDate(new Date().toISOString().split('T')[0]);
      setStatus('completed');
      setPaymentAccountId('');
      setPaidAmount('');
      setNotes('');
      setPurchaseItems([]);
      setUpdateCostPrice(false);

    } catch (err: any) {
      alert(err.message || "Failed to record purchase.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-12">
      <PageHeader 
        title="Purchases" 
        rightAction={
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Purchase</span>
          </button>
        }
      />
      
      <div className="p-4 sm:p-6 md:px-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Search Bar */}
        <div className="flex items-center bg-card rounded-2xl border border-border px-4 py-2 shadow-sm max-w-md">
            <Search size={18} className="text-muted-foreground mr-3" />
            <input 
              type="text" 
              placeholder="Search by reference or supplier..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full h-10 text-foreground"
            />
        </div>

        {/* Purchases Table */}
        {filteredPurchases.length === 0 ? (
           <div className="bg-card rounded-3xl border border-border p-16 text-center shadow-sm flex flex-col items-center">
             <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
               <Package size={32} className="text-primary" />
             </div>
             <h3 className="text-xl font-bold text-foreground mb-2">No purchases found</h3>
             <p className="text-muted-foreground text-sm max-w-sm">Record new incoming stock from your suppliers.</p>
             <button 
                onClick={() => setShowForm(true)}
                className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm"
              >
                Add Purchase
              </button>
           </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-border/50 bg-muted/10">
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Reference</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Supplier</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Total</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredPurchases.map(purchase => {
                  const sup = suppliers.find(s => s.id === purchase.supplier_id);
                  return (
                    <tr 
                      key={purchase.id} 
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedPurchase(purchase)}
                    >
                      <td className="px-6 py-4">
                         <span className="font-bold text-foreground text-sm">{purchase.reference_no}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                        {new Date(purchase.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                         {sup?.name || 'Unknown Supplier'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {(purchase.status === 'completed' || purchase.status === 'Completed') ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                               <CheckCircle2 size={12} />
                               Completed
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold">
                               <Clock size={12} />
                               Pending
                            </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-foreground text-right">
                        {formatCurrency(purchase.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-muted-foreground text-right">
                        {formatCurrency(purchase.paid_amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Purchase Details Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-5 border-b border-border bg-muted/10 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <FileText size={20} className="text-primary" />
                  Purchase Details
                </h3>
                <p className="text-sm font-mono text-muted-foreground mt-1">Ref: {selectedPurchase.reference_no}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors"
                >
                  Print
                </button>
                <button 
                  onClick={() => setSelectedPurchase(null)}
                  className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Summary Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-muted/30 border border-border">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Supplier</p>
                  <p className="font-medium text-sm text-foreground">
                    {suppliers.find(s => s.id === selectedPurchase.supplier_id)?.name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Date</p>
                  <p className="font-medium text-sm text-foreground">
                    {new Date(selectedPurchase.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                  <div className="font-medium text-sm text-foreground">
                    {(selectedPurchase.status === 'completed' || selectedPurchase.status === 'Completed') ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-500 font-bold">
                           <CheckCircle2 size={12} /> Completed
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-500 font-bold">
                           <Clock size={12} /> Pending
                        </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Account</p>
                  <p className="font-medium text-sm text-foreground">
                    {paymentAccounts.find(a => a.id === selectedPurchase.payment_account_id)?.account_name || 'None'}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-bold text-foreground mb-3 text-sm">Line Items</h4>
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/10">
                        <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Item Name</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Qty</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Cost</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {globalPurchaseItems.filter((pi: any) => pi.purchase_id === selectedPurchase.id).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">No items found for this purchase.</td>
                        </tr>
                      ) : (
                        globalPurchaseItems.filter((pi: any) => pi.purchase_id === selectedPurchase.id).map((item: any) => {
                          const product = items.find(i => i.id === item.item_id);
                          return (
                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 text-sm font-bold text-foreground">{product?.name || 'Unknown Item'}</td>
                              <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                              <td className="px-4 py-3 text-sm text-right text-muted-foreground">{formatCurrency(item.cost_price)}</td>
                              <td className="px-4 py-3 text-sm font-bold text-foreground text-right">{formatCurrency(item.subtotal)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3 max-w-sm ml-auto">
                <div className="flex justify-between items-center text-sm text-muted-foreground font-medium">
                  <span>Total Amount</span>
                  <span>{formatCurrency(selectedPurchase.total_amount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground font-medium">
                  <span>Paid Amount</span>
                  <span>{formatCurrency(selectedPurchase.paid_amount)}</span>
                </div>
                <div className="h-px bg-border w-full"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground uppercase tracking-widest">Balance Due</span>
                  <span className="text-lg font-black text-destructive">
                    {formatCurrency(Math.max(0, Number(selectedPurchase.total_amount) - Number(selectedPurchase.paid_amount)))}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Add Purchase Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-border bg-muted/10 shrink-0">
              <h3 className="text-xl font-bold text-foreground">Record Purchase</h3>
              <button 
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                
                {/* Header Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Supplier <span className="text-destructive">*</span></label>
                        <SearchableSelect 
                            value={supplierId} 
                            onChange={setSupplierId}
                            options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                            placeholder="Select Supplier"
                            searchPlaceholder="Search supplier name..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Date <span className="text-destructive">*</span></label>
                        <input 
                            type="date" 
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                            className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm" 
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Status <span className="text-destructive">*</span></label>
                        <select 
                            value={status} 
                            onChange={e => setStatus(e.target.value as any)} 
                            className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm appearance-none" 
                            required
                        >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed (Updates Stock)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Notes</label>
                        <input 
                            type="text" 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)} 
                            placeholder="Optional notes"
                            className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm" 
                        />
                    </div>
                </div>

                {/* Line Items */}
                <div className="bg-muted/30 rounded-2xl p-4 border border-border">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-foreground">Purchase Items <span className="text-destructive">*</span></h4>
                        <div className="flex items-center gap-2">
                            <button 
                                type="button" 
                                onClick={() => {
                                    setQuickAddName('');
                                    setQuickAddCategory('');
                                    setQuickAddCostPrice('');
                                    setQuickAddSellingPrice('');
                                    setQuickAddInitialQuantity('');
                                    setShowQuickAddProduct(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                            >
                                <Plus size={14} /> Quick Add Product
                            </button>
                            <button 
                                type="button" 
                                onClick={handleAddItem}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
                            >
                                <PlusCircle size={14} /> Add Item Row
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        {purchaseItems.map((item, index) => (
                            <div key={index} className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-background p-3 rounded-xl border border-border shadow-sm">
                                <div className="flex-1 min-w-[200px]">
                                    <SearchableSelect 
                                        value={item.item_id}
                                        onChange={val => handleItemChange(index, 'item_id', val)}
                                        options={items.filter(i => i.type === 'product').map(i => ({
                                            value: i.id,
                                            label: i.name,
                                            subLabel: `Stock: ${i.quantity}`,
                                            badge: i.barcode ? `Barcode: ${i.barcode}` : undefined
                                        }))}
                                        placeholder="Select Inventory Item"
                                        searchPlaceholder="Search item name or barcode..."
                                        triggerClassName="h-10 text-xs sm:text-sm rounded-lg"
                                        required
                                    />
                                </div>
                                <div className="w-24 shrink-0">
                                    <input 
                                        type="number"
                                        placeholder="Qty"
                                        min="0.01"
                                        step="0.01"
                                        value={item.quantity || ''}
                                        onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))}
                                        className="w-full px-3 py-2 h-10 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        required
                                    />
                                </div>
                                <div className="w-32 shrink-0">
                                    <input 
                                        type="number"
                                        placeholder="Cost Price"
                                        min="0"
                                        step="0.01"
                                        value={item.cost_price === 0 ? '' : item.cost_price}
                                        onChange={e => handleItemChange(index, 'cost_price', Number(e.target.value))}
                                        className="w-full px-3 py-2 h-10 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        required
                                    />
                                </div>
                                <div className="w-32 shrink-0">
                                    <input 
                                        type="number"
                                        placeholder="Sell Price"
                                        min="0"
                                        step="0.01"
                                        value={item.sell_price === 0 ? '' : item.sell_price}
                                        onChange={e => handleItemChange(index, 'sell_price', Number(e.target.value))}
                                        className="w-full px-3 py-2 h-10 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="w-24 shrink-0 text-right font-bold text-foreground pr-2">
                                    {formatCurrency(item.quantity * item.cost_price)}
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => handleRemoveItem(index)}
                                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {purchaseItems.length === 0 && (
                            <div className="text-center py-6 text-sm font-medium text-muted-foreground border-2 border-dashed border-border rounded-xl">
                                No items added yet. Click "Add Item" to begin.
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex justify-end text-lg font-black text-foreground pt-4 border-t border-border">
                        Total: {formatCurrency(totalPurchaseAmount)}
                    </div>
                </div>

                {/* Financial Tracking */}
                <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10">
                    <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                        <FileText size={16} /> Financial Recording
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="paymentStatus" 
                                    value="paid"
                                    checked={paidAmount !== '0' && paidAmount !== ''}
                                    onChange={() => setPaidAmount(String(totalPurchaseAmount))}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-bold text-foreground">Paid (Now)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="paymentStatus" 
                                    value="credit"
                                    checked={paidAmount === '0' || paidAmount === ''}
                                    onChange={() => {
                                        setPaidAmount('0');
                                        setPaymentAccountId('');
                                    }}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-bold text-foreground">Credit / Pay Later</span>
                            </label>
                        </div>

                        {(paidAmount !== '0' && paidAmount !== '') && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Amount Paid Now</label>
                                    <input 
                                        type="number" 
                                        value={paidAmount} 
                                        onChange={e => setPaidAmount(e.target.value)} 
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        max={totalPurchaseAmount}
                                        className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm" 
                                    />
                                </div>
                                {Number(paidAmount) > 0 && paymentAccounts.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Payment Account</label>
                                        <SearchableSelect 
                                            value={paymentAccountId} 
                                            onChange={setPaymentAccountId}
                                            options={paymentAccounts.map(pa => ({
                                                value: pa.id,
                                                label: `${pa.account_name} (${pa.account_type})`
                                            }))}
                                            placeholder="Select Account"
                                            searchPlaceholder="Search payment account..."
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </form>

            <div className="flex gap-3 px-6 py-5 border-t border-border bg-muted/10 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="flex-1 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-bold hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  data-submit-guard="true"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    'Process Purchase'
                  )}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Product Modal */}
      {showQuickAddProduct && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-border bg-muted/10 shrink-0">
              <h3 className="text-xl font-bold text-foreground">Quick Add Product</h3>
              <button 
                onClick={() => setShowQuickAddProduct(false)}
                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleQuickAddProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Item Name <span className="text-destructive">*</span></label>
                <input 
                    type="text" 
                    value={quickAddName} 
                    onChange={e => setQuickAddName(e.target.value)} 
                    placeholder="Enter item name"
                    className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" 
                    required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Category</label>
                <SearchableSelect 
                  value={quickAddCategory} 
                  onChange={val => { setQuickAddCategory(val); setQuickAddSubCategory(''); }}
                  options={allCategoryNames}
                  placeholder="Select Category (Optional)"
                  searchPlaceholder="Search category..."
                  clearLabel="No Category"
                  allowClear
                />
              </div>

              {/* Sub-Category dynamic rendering */}
              {(() => {
                const selectedCatObj = storeCategories.find(c => c.name === quickAddCategory && !c.parent_id);
                if (!selectedCatObj) return null;
                const availableSubcategories = storeCategories.filter(c => c.parent_id === selectedCatObj.id);
                if (availableSubcategories.length === 0) return null;
                
                return (
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Sub-Category</label>
                    <SearchableSelect 
                      value={quickAddSubCategory} 
                      onChange={setQuickAddSubCategory}
                      options={availableSubcategories.map(sub => ({ value: sub.id, label: sub.name }))}
                      placeholder="Select Sub-Category (Optional)"
                      searchPlaceholder="Search sub-category..."
                      clearLabel="No Sub-Category"
                      allowClear
                    />
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Barcode</label>
                <div className="relative flex gap-2">
                  <input 
                      value={quickAddBarcode} 
                      onChange={e => setQuickAddBarcode(e.target.value)} 
                      placeholder="Optional barcode"
                      className="flex-1 px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" 
                  />
                  <button 
                      type="button" 
                      onClick={() => setShowScanner(true)}
                      className="w-11 h-11 rounded-xl border border-border bg-background shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <ScanBarcode size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Cost Price <span className="text-destructive">*</span></label>
                    <input 
                        type="number" 
                        step="0.01"
                        value={quickAddCostPrice} 
                        onChange={e => setQuickAddCostPrice(e.target.value)} 
                        placeholder="0.00"
                        className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" 
                        required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Sell Price <span className="text-destructive">*</span></label>
                    <input 
                        type="number" 
                        step="0.01"
                        value={quickAddSellingPrice} 
                        onChange={e => setQuickAddSellingPrice(e.target.value)} 
                        placeholder="0.00"
                        className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" 
                        required
                    />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Initial Quantity <span className="text-destructive">*</span></label>
                    <input 
                        type="number" 
                        value={quickAddInitialQuantity} 
                        onChange={e => setQuickAddInitialQuantity(e.target.value)} 
                        placeholder="0"
                        className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" 
                        required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground capitalize tracking-wider mb-2">Low Stock Alert</label>
                    <input 
                        type="number" 
                        value={quickAddLowStock} 
                        onChange={e => setQuickAddLowStock(e.target.value)} 
                        placeholder="5"
                        className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" 
                    />
                  </div>
              </div>
              <div className="pt-4 flex gap-3">
                 <button 
                   type="button" 
                   onClick={() => setShowQuickAddProduct(false)} 
                   className="flex-1 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-bold hover:bg-accent transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit" 
                   disabled={isSubmittingProduct}
                   className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                 >
                   {isSubmittingProduct ? 'Saving...' : 'Save & Select'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showScanner && (
        <BarcodeScanner
          onScan={(code) => {
            setQuickAddBarcode(code);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
