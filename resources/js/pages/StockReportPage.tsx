import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/PageHeader';
import { Calendar, PackageOpen, LayoutGrid, AlertCircle, ArrowDown, ArrowUp } from 'lucide-react';

export default function StockReportPage() {
  const { items, currentStore, formatCurrency } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Note: For a true historical stock report, this would fetch snapshotted data for `selectedDate`. 
  // Currently, this just shows the *current* store inventory.
  const storeItems = items.filter(i => i.store_id === currentStore?.id && i.type === 'product' && i.is_active);
  const totalInventoryCost = storeItems.reduce((s, i) => s + i.quantity * i.cost_price, 0);
  const totalInventoryValue = storeItems.reduce((s, i) => s + i.quantity * i.sell_price, 0);
  const totalPotentialProfit = totalInventoryValue - totalInventoryCost;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-12">
      <PageHeader 
        title="Stock Report" 
        rightAction={
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <Calendar size={18} className="text-primary" />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-foreground focus:outline-none focus:ring-0 w-32 cursor-pointer" 
            />
          </div>
        }
      />
      
      <div className="p-4 sm:p-6 md:px-8 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* Top Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-3xl p-8 border border-border shadow-sm flex flex-col justify-center items-center text-center col-span-1 md:col-span-2 relative overflow-hidden">
             <div className="absolute top-0 w-full h-2 bg-primary"></div>
             <p className="text-sm font-bold text-muted-foreground  capitalize tracking-widest mb-3">Total Inventory Cost</p>
             <p className="text-5xl md:text-6xl font-black text-primary tracking-tighter">
               {formatCurrency(totalInventoryCost)}
             </p>
             <div className="mt-6 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold  capitalize tracking-wider flex items-center gap-2">
               <PackageOpen size={14} />
               {storeItems.length} Products in Stock
             </div>
          </div>
          
          <div className="flex flex-col gap-6">
             <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex-1 flex flex-col justify-center">
               <div className="flex items-center gap-3 mb-2">
                 <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center text-info">
                   <ArrowUp size={16} />
                 </div>
                 <p className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Retail Value</p>
               </div>
               <p className="text-2xl font-black text-foreground">{formatCurrency(totalInventoryValue)}</p>
             </div>
             <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex-1 flex flex-col justify-center">
               <div className="flex items-center gap-3 mb-2">
                 <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
                   <ArrowDown size={16} />
                 </div>
                 <p className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Potential Profit</p>
               </div>
               <p className="text-2xl font-black text-success">{formatCurrency(totalPotentialProfit)}</p>
             </div>
          </div>
        </div>

        {/* Note Box */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-600/80 dark:text-blue-400 font-medium">
            This report reflects the current inventory snapshot based on today's stock levels. Note that historical stock reports are currently simulated using live inventory data.
          </p>
        </div>

        {/* Data */}
        {storeItems.length === 0 ? (
           <div className="bg-card rounded-3xl border border-border p-16 text-center shadow-sm flex flex-col items-center">
             <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
               <LayoutGrid size={40} className="text-muted-foreground/50" />
             </div>
             <h3 className="text-xl font-bold text-foreground mb-2 capitalize">No products found</h3>
             <p className="text-muted-foreground">Your store has no active products in inventory.</p>
           </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/10">
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest">Item Details</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-right">Quantity</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-right">Unit Cost</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-right">Total Cost Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {storeItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="font-bold text-foreground text-sm">{item.name}</span>
                           <span className="text-xs font-mono text-muted-foreground mt-0.5">{item.item_code || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold ${item.quantity <= (item.low_stock_threshold || 5) ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-muted-foreground text-right">
                        {formatCurrency(item.cost_price)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-foreground text-right">
                        {formatCurrency(item.quantity * item.cost_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacking Cards */}
            <div className="md:hidden space-y-4">
              {storeItems.map((item) => (
                <div key={item.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm flex flex-col gap-4">
                   <div className="flex justify-between items-start">
                     <div>
                        <h4 className="font-bold text-foreground text-base leading-tight capitalize">{item.name}</h4>
                        <span className="text-xs font-mono text-muted-foreground mt-1 inline-block">{item.item_code || '—'}</span>
                     </div>
                     <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${item.quantity <= (item.low_stock_threshold || 5) ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'}`}>
                        {item.quantity} in stock
                     </span>
                   </div>
                   <div className="pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
                      <div>
                         <p className="text-[10px] font-bold text-muted-foreground  capitalize tracking-widest mb-1">Unit Cost</p>
                         <p className="font-medium text-sm text-foreground">{formatCurrency(item.cost_price)}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-muted-foreground  capitalize tracking-widest mb-1">Total Value</p>
                         <p className="font-bold text-sm text-primary">{formatCurrency(item.quantity * item.cost_price)}</p>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
