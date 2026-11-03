import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/PageHeader';
import { Search, Trash2, Download, Plus, ScanBarcode, AlertTriangle, Package, Pencil, Upload, X, Box, BarChart2 } from 'lucide-react';
import * as XLSX from 'xlsx';
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
import BarcodeScanner from '@/components/BarcodeScanner';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/searchable-select';

type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

function getStockStatus(item: { type: string; quantity: number; low_stock_threshold: number }) {
  if (item.type !== 'product') return 'service';
  if (item.quantity === 0) return 'out_of_stock';
  if (item.quantity <= item.low_stock_threshold) return 'low_stock';
  return 'in_stock';
}

function StockBadge({ status }: { status: string }) {
  if (status === 'out_of_stock') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold  capitalize tracking-wider bg-destructive/10 text-destructive border border-destructive/20">
        Out of Stock
      </span>
    );
  }
  if (status === 'low_stock') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold  capitalize tracking-wider bg-warning/10 text-warning border border-warning/20">
        Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold  capitalize tracking-wider bg-success/10 text-success border border-success/20">
      In Stock
    </span>
  );
}

export default function InventoryPage() {
  const { items, categories, addItem, addItemsBulk, updateItem, deleteItem, currentStore, formatCurrency } = useApp();
  const [tab, setTab] = useState<'product' | 'service'>('product');
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', sub_category_id: '', barcode: '', cost_price: '', sell_price: '', quantity: '', low_stock_threshold: '5', image_path: '' });
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const storeItems = items.filter(i => i.store_id === currentStore?.id && i.type === tab && i.is_active);
  const storeCategories = categories.filter(c => c.store_id === currentStore?.id);
  const existingItemCategories = Array.from(new Set(storeItems.map(i => i.category).filter(Boolean)));
  const allCategoryNames = Array.from(new Set([...storeCategories.filter(c => !c.parent_id).map(c => c.name), ...existingItemCategories]));

  let filtered = storeItems.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    (i.category || '').toLowerCase().includes(search.toLowerCase()) || 
    (i.barcode || '').includes(search)
  );

  if (categoryFilter !== 'all') {
    filtered = filtered.filter(i => i.category === categoryFilter);
  }

  if (tab === 'product' && stockFilter !== 'all') {
    filtered = filtered.filter(i => getStockStatus(i) === stockFilter);
  }

  const lowStockItems = storeItems.filter(i => getStockStatus(i) === 'low_stock');
  const outOfStockItems = storeItems.filter(i => getStockStatus(i) === 'out_of_stock');
  const inStockItems = storeItems.filter(i => getStockStatus(i) === 'in_stock');

  const openEdit = (item: any) => {
    setEditingItem(item.id);
    setForm({
      name: item.name,
      category: item.category || '',
      sub_category_id: item.sub_category_id || '',
      barcode: item.barcode || '',
      cost_price: String(item.cost_price),
      sell_price: String(item.sell_price),
      quantity: String(item.quantity),
      low_stock_threshold: String(item.low_stock_threshold),
      image_path: item.image_path || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateItem(editingItem, {
          name: form.name,
          category: form.category.trim(),
          sub_category_id: form.sub_category_id || null,
          barcode: form.barcode,
          cost_price: Number(form.cost_price),
          sell_price: Number(form.sell_price),
          quantity: tab === 'product' ? Number(form.quantity) : 0,
          low_stock_threshold: Number(form.low_stock_threshold),
          image_path: form.image_path,
        });
        toast.success('Item updated successfully');
        setEditingItem(null);
      } else {
        await addItem({
          store_id: currentStore?.id || '',
          item_code: `#${String(items.length + 1).padStart(3, '0')}`,
          name: form.name,
          category: form.category.trim(),
          sub_category_id: form.sub_category_id || null,
          type: tab,
          barcode: form.barcode,
          cost_price: Number(form.cost_price),
          sell_price: Number(form.sell_price),
          quantity: tab === 'product' ? Number(form.quantity) : 0,
          low_stock_threshold: Number(form.low_stock_threshold),
          is_active: true,
          image_path: form.image_path,
        });
        toast.success('Item added successfully');
      }
      setForm({ name: '', category: '', sub_category_id: '', barcode: '', cost_price: '', sell_price: '', quantity: '', low_stock_threshold: '5', image_path: '' });
      setShowForm(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadExcel = () => {
    if (storeItems.length === 0) {
      toast.error('No items to export');
      return;
    }
    const dataToExport = storeItems.map(item => ({
      Type: item.type,
      Name: item.name,
      Category: item.category || '',
      SubCategory: item.sub_category_id ? (storeCategories.find(c => c.id === item.sub_category_id)?.name || item.sub_category?.name || '') : (item.sub_category?.name || ''),
      Barcode: item.barcode || '',
      CostPrice: item.cost_price,
      SellPrice: item.sell_price,
      Quantity: item.quantity || 0,
      LowStockThreshold: item.low_stock_threshold || 5,
    }));
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `inventory_${currentStore?.store_name || 'export'}.xlsx`);
  };

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (!data || data.length === 0) {
          toast.error('No valid data found in file');
          return;
        }

        const newItems = data.map((row: any) => {
          let subCategoryId = null;
          if (row.SubCategory) {
            const subCat = storeCategories.find(c => c.name.toLowerCase() === String(row.SubCategory).toLowerCase() && c.parent_id);
            if (subCat) subCategoryId = subCat.id;
          }
          
          return {
            store_id: currentStore?.id || '',
            type: (row.Type || 'product').toLowerCase(),
            name: String(row.Name || ''),
            category: String(row.Category || '').trim(),
            sub_category_id: subCategoryId,
            barcode: String(row.Barcode || ''),
            cost_price: Number(row.CostPrice) || 0,
            sell_price: Number(row.SellPrice) || 0,
            quantity: Number(row.Quantity) || 0,
            low_stock_threshold: Number(row.LowStockThreshold) || 5,
            is_active: true
          };
        }).filter((item: any) => item.name); 
        
        if (newItems.length === 0) {
          toast.error('No valid items found to import');
          return;
        }
        
        await addItemsBulk(newItems);
        toast.success(`Successfully imported ${newItems.length} items`);
      } catch (err: any) {
        console.error(err);
        toast.error('Failed to import file: ' + err.message);
      }
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadSample = () => {
    const sampleData = [{
      Type: 'product',
      Name: 'Sample Product Name',
      Category: 'Electronics',
      SubCategory: 'Phones',
      Barcode: '1234567890',
      CostPrice: 50,
      SellPrice: 100,
      Quantity: 20,
      LowStockThreshold: 5,
    }, {
      Type: 'service',
      Name: 'Repair Service',
      Category: 'Services',
      SubCategory: '',
      Barcode: '',
      CostPrice: 0,
      SellPrice: 30,
      Quantity: 0,
      LowStockThreshold: 0,
    }];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `inventory_import_template.xlsx`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-12">
      <PageHeader 
        title="Inventory Management" 
        rightAction={
          <button onClick={handleDownloadExcel} className="p-2 text-muted-foreground hover:text-foreground transition-colors hidden sm:block capitalize">
            <Download size={20} />
          </button>
        } 
      />
      
      <div className="p-6 md:px-8 space-y-8 max-w-7xl mx-auto w-full">

        {/* Stock Summary Cards */}
        {tab === 'product' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <button
              onClick={() => setStockFilter(stockFilter === 'in_stock' ? 'all' : 'in_stock')}
              className={`rounded-2xl p-6 text-left transition-all border shadow-sm ${
                stockFilter === 'in_stock' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                 <div className={`p-2.5 rounded-xl ${stockFilter === 'in_stock' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Box size={20} />
                 </div>
              </div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">In Stock</p>
              <p className="text-3xl font-bold text-foreground">{inStockItems.length}</p>
            </button>
            <button
              onClick={() => setStockFilter(stockFilter === 'low_stock' ? 'all' : 'low_stock')}
              className={`rounded-2xl p-6 text-left transition-all border shadow-sm ${
                stockFilter === 'low_stock' ? 'border-warning bg-warning/5 ring-1 ring-warning/20' : 'border-border bg-card hover:border-warning/50'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                 <div className={`p-2.5 rounded-xl ${stockFilter === 'low_stock' ? 'bg-warning/20 text-warning' : 'bg-warning/10 text-warning'}`}>
                    <BarChart2 size={20} />
                 </div>
              </div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Low Stock</p>
              <p className="text-3xl font-bold text-warning">{lowStockItems.length}</p>
            </button>
            <button
              onClick={() => setStockFilter(stockFilter === 'out_of_stock' ? 'all' : 'out_of_stock')}
              className={`rounded-2xl p-6 text-left transition-all border shadow-sm ${
                stockFilter === 'out_of_stock' ? 'border-destructive bg-destructive/5 ring-1 ring-destructive/20' : 'border-border bg-card hover:border-destructive/50'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                 <div className={`p-2.5 rounded-xl ${stockFilter === 'out_of_stock' ? 'bg-destructive/20 text-destructive' : 'bg-destructive/10 text-destructive'}`}>
                    <AlertTriangle size={20} />
                 </div>
              </div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Out of Stock</p>
              <p className="text-3xl font-bold text-destructive">{outOfStockItems.length}</p>
            </button>
          </div>
        )}

        {tab === 'product' && (lowStockItems.length > 0 || outOfStockItems.length > 0) && stockFilter === 'all' && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-5 py-4 flex items-center gap-3">
            <AlertTriangle size={20} className="text-destructive shrink-0" />
            <p className="text-sm font-semibold text-destructive flex-1">
              Action Required: {outOfStockItems.length > 0 && `${outOfStockItems.length} items are out of stock`}
              {outOfStockItems.length > 0 && lowStockItems.length > 0 && ' and '}
              {lowStockItems.length > 0 && `${lowStockItems.length} items are running low`}
            </p>
            <button
              onClick={() => setStockFilter('low_stock')}
              className="text-sm font-bold text-destructive hover:underline shrink-0"
            >
              Review Now
            </button>
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
          {/* Controls Bar */}
          <div className="p-4 border-b border-border bg-muted/20 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            
            <div className="flex bg-muted/50 p-1 rounded-xl">
              <button onClick={() => { setTab('product'); setStockFilter('all'); }}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${tab === 'product' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                Products
              </button>
              <button onClick={() => { setTab('service'); setStockFilter('all'); }}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${tab === 'service' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                Services
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory..."
                  className="w-full pl-9 pr-3 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" />
              </div>
              
              <div className="hidden sm:block w-48">
                <SearchableSelect 
                  value={categoryFilter} 
                  onChange={setCategoryFilter}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...allCategoryNames.map(c => ({ value: c, label: c }))
                  ]}
                  placeholder="All Categories"
                  searchPlaceholder="Filter category..."
                  triggerClassName="h-11 rounded-xl font-medium"
                />
              </div>
              
              {(stockFilter !== 'all' || categoryFilter !== 'all') && (
                <button
                  onClick={() => { setStockFilter('all'); setCategoryFilter('all'); }}
                  className="h-11 px-4 rounded-xl border border-input bg-muted text-foreground text-sm font-bold hover:bg-accent transition-colors flex items-center shadow-sm"
                >
                  Clear
                </button>
              )}
              
              <button onClick={handleDownloadSample} className="hidden lg:flex h-11 items-center gap-2 px-4 rounded-xl bg-background text-foreground hover:bg-accent border border-input text-sm font-bold cursor-pointer transition-colors shadow-sm capitalize">
                <Download size={16} /> Sample
              </button>
              <label className="hidden lg:flex h-11 items-center gap-2 px-4 rounded-xl bg-background text-foreground hover:bg-accent border border-input text-sm font-bold cursor-pointer transition-colors shadow-sm capitalize">
                <Upload size={16} /> Import Excel
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUploadExcel} />
              </label>
              
              <button onClick={() => setShowForm(true)} className="h-11 flex items-center gap-2 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-opacity ml-auto md:ml-0">
                <Plus size={18} /> <span className="hidden sm:inline">Add Item</span>
              </button>
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <Package size={32} className="text-muted-foreground/50" />
              </div>
              <p className="text-foreground font-semibold text-lg">
                {stockFilter !== 'all' ? `No ${stockFilter.replace('_', ' ')} items found.` : `No ${tab}s found.`}
              </p>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                Try clearing your filters or add a new item to get started.
              </p>
              {stockFilter !== 'all' && (
                <button onClick={() => setStockFilter('all')} className="mt-4 px-4 py-2 bg-muted text-foreground font-bold rounded-lg text-sm hover:bg-accent transition-colors">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/10">
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest whitespace-nowrap">Code</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest whitespace-nowrap">Product Name</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest whitespace-nowrap">Category</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest whitespace-nowrap">Sub-Category</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest whitespace-nowrap text-right">Cost Price</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest whitespace-nowrap text-right">Sell Price</th>
                    {tab === 'product' && (
                      <>
                        <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest whitespace-nowrap text-right">Qty</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest whitespace-nowrap text-center">Status</th>
                      </>
                    )}
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map(item => {
                    const status = getStockStatus(item);
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{item.item_code}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-foreground flex items-center gap-3">
                          {item.image_path ? (
                            <img src={item.image_path} alt={item.name} className="w-8 h-8 rounded-md object-cover bg-muted" />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center">
                              <Package size={14} className="text-muted-foreground/50" />
                            </div>
                          )}
                          {item.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{item.category || '—'}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {item.sub_category_id 
                            ? (storeCategories.find(c => c.id === item.sub_category_id)?.name || item.sub_category?.name || '—')
                            : (item.sub_category?.name || '—')}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground text-right">{formatCurrency(item.cost_price)}</td>
                        <td className="px-6 py-4 text-sm font-bold text-foreground text-right">{formatCurrency(item.sell_price)}</td>
                        {tab === 'product' && (
                          <>
                            <td className={`px-6 py-4 text-sm font-bold text-right ${
                              status === 'out_of_stock' ? 'text-destructive' :
                              status === 'low_stock' ? 'text-warning' :
                              'text-foreground'
                            }`}>
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <StockBadge status={status} />
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(item)} className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-sm"><Pencil size={14} /></button>
                            <button onClick={() => setDeleteTarget(item)} className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors shadow-sm"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-lg bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="px-6 py-5 border-b border-border bg-muted/10 flex justify-between items-center">
               <h3 className="text-lg font-bold text-foreground capitalize">{editingItem ? 'Edit' : 'Add'} {tab === 'product' ? 'Product' : 'Service'}</h3>
               <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="w-8 h-8 rounded-full flex items-center justify-center bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><X size={16} /></button>
             </div>
             <div className="p-6 max-h-[75vh] overflow-y-auto">
               <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Item Name <span className="text-destructive">*</span></label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Wireless Mouse"
                    className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" required />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Product Image (Max 2MB)</label>
                  <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB.'); return; }
                      
                      const toastId = toast.loading('Uploading image...');
                      try {
                        const formData = new FormData();
                        formData.append('image', file);
                        formData.append('folder', 'product-images');
                        const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '';
                        
                        const response = await fetch('/api/upload-image', {
                          method: 'POST',
                          headers: { 'X-XSRF-TOKEN': decodeURIComponent(csrfToken), 'Accept': 'application/json' },
                          body: formData
                        });
                        
                        if (!response.ok) throw new Error('Upload failed');
                        const { url } = await response.json();
                        setForm(f => ({ ...f, image_path: url }));
                        toast.success('Image uploaded', { id: toastId });
                      } catch (err) {
                        toast.error('Upload failed', { id: toastId });
                      }
                    }}
                    className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                    {form.image_path && (
                      <div className="mt-2 relative inline-block">
                        <img src={form.image_path} alt="Preview" className="w-16 h-16 object-cover rounded-md border border-border" />
                        <button type="button" onClick={() => setForm(f => ({ ...f, image_path: '' }))} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"><X size={12} /></button>
                      </div>
                    )}
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Category</label>
                  <SearchableSelect 
                    value={form.category} 
                    onChange={val => setForm(f => ({ ...f, category: val, sub_category_id: '' }))}
                    options={allCategoryNames}
                    placeholder="Select Category (Optional)"
                    searchPlaceholder="Search category..."
                    clearLabel="No Category"
                    allowClear
                  />
                </div>

                {/* Sub-Category dynamic rendering */}
                {(() => {
                  const selectedCatObj = storeCategories.find(c => c.name === form.category && !c.parent_id);
                  if (!selectedCatObj) return null;
                  const availableSubcategories = storeCategories.filter(c => c.parent_id === selectedCatObj.id);
                  if (availableSubcategories.length === 0) return null;
                  
                  return (
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Sub-Category</label>
                      <SearchableSelect 
                        value={form.sub_category_id} 
                        onChange={val => setForm(f => ({ ...f, sub_category_id: val }))}
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
                  <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Barcode</label>
                  <div className="relative flex gap-2">
                    <input value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} placeholder="Optional barcode"
                      className="flex-1 px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" />
                    <button type="button" onClick={() => setShowScanner(true)}
                      className="w-11 h-11 rounded-xl border border-border bg-background shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      <ScanBarcode size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Cost Price <span className="text-destructive">*</span></label>
                    <input type="number" step="0.01" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))} placeholder="0.00"
                      className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Sell Price <span className="text-destructive">*</span></label>
                    <input type="number" step="0.01" value={form.sell_price} onChange={e => setForm(f => ({ ...f, sell_price: e.target.value }))} placeholder="0.00"
                      className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" required />
                  </div>
                </div>

                {tab === 'product' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Initial Quantity <span className="text-destructive">*</span></label>
                      <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0"
                        className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Low Stock Alert</label>
                      <input type="number" value={form.low_stock_threshold} onChange={e => setForm(f => ({ ...f, low_stock_threshold: e.target.value }))} placeholder="5"
                        className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-6 border-t border-border mt-6">
                  <button type="button" onClick={() => { setShowForm(false); setEditingItem(null); setForm({ name: '', category: '', sub_category_id: '', barcode: '', cost_price: '', sell_price: '', quantity: '', low_stock_threshold: '5', image_path: '' }); }} className="flex-1 py-3 rounded-xl bg-muted text-foreground text-sm font-bold hover:bg-accent transition-colors">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity shadow-sm capitalize disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      editingItem ? 'Save Changes' : 'Add Item'
                    )}
                  </button>
                </div>
               </form>
             </div>
           </div>
        </div>
      )}
      
      {showScanner && (
        <BarcodeScanner
          onScan={(code) => {
            setForm(f => ({ ...f, barcode: code }));
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete Item</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-xl h-11 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteItem(deleteTarget?.id); setDeleteTarget(null); }} className="bg-destructive text-destructive-foreground rounded-xl h-11 font-bold">Yes, Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
