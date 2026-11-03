import React, { useEffect, useState } from 'react';
import { ShoppingBag, Store } from 'lucide-react';
import { Head } from '@inertiajs/react';

interface CartItemData {
  item: {
    id: string;
    name: string;
  };
  quantity: number;
  line_total: number;
}

export default function CustomerDisplayPage() {
  const [cart, setCart] = useState<CartItemData[]>([]);
  const [currency, setCurrency] = useState('KSh');
  const [storeName, setStoreName] = useState('My Store');
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  useEffect(() => {
    document.title = "Customer Display - " + storeName;
  }, [storeName]);

  useEffect(() => {
    const channel = new BroadcastChannel('pos-cart-channel');
    
    channel.onmessage = (event) => {
      if (event.data.type === 'CART_UPDATE') {
        setCart(event.data.cart || []);
        if (event.data.currency) setCurrency(event.data.currency);
        if (event.data.currentStore) {
          setStoreName(event.data.currentStore.store_name || 'My Store');
          setTaxEnabled(event.data.currentStore.tax_enabled || false);
          setTaxRate(event.data.currentStore.tax_rate || 0);
        }
        setLastUpdated(Date.now());
      }
    };
    
    // Request current state from the active POS window
    channel.postMessage({ type: 'REQUEST_STATE' });

    return () => channel.close();
  }, []);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.line_total, 0);
  const taxAmount = taxEnabled ? (cartSubtotal * (taxRate / 100)) : 0;
  const total = cartSubtotal + taxAmount;

  const formatCurrency = (amount: number) => {
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      <Head title="Customer Display" />
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-background flex flex-col lg:flex-row overflow-hidden font-sans">
        
        {/* Left Side: Cart Items */}
        <div className="flex-1 p-8 md:p-16 flex flex-col bg-card overflow-hidden relative">
          
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl opacity-50"></div>
          </div>

          <div className="flex items-center gap-6 mb-12 relative z-10">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <ShoppingBag size={40} />
            </div>
            <div>
               <h1 className="text-5xl font-black text-foreground tracking-tight mb-2 capitalize">Your Order</h1>
               <p className="text-lg font-medium text-muted-foreground">{cart.length} {cart.length === 1 ? 'item' : 'items'} in cart</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-4 space-y-4 relative z-10 scrollbar-hide">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-4 border-dashed border-border/50 rounded-3xl">
                <div className="w-32 h-32 rounded-full bg-muted/50 flex items-center justify-center mb-8">
                   <ShoppingBag size={48} className="opacity-50 text-foreground" />
                </div>
                <p className="text-3xl font-black text-foreground mb-3 tracking-tight">Welcome to {storeName}!</p>
                <p className="text-xl font-medium max-w-sm text-center">Please wait for the cashier to scan your items.</p>
              </div>
            ) : (
              <div className="space-y-4">
                 {cart.map((c, index) => (
                   <div key={c.item.id + index} className="bg-background rounded-3xl p-6 md:p-8 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 shadow-sm border border-border/50 hover:border-primary/30 transition-colors">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center text-muted-foreground shrink-0 border border-border/50">
                           <span className="text-2xl font-black">{c.quantity}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold text-foreground line-clamp-2">{c.item.name}</span>
                          <span className="text-lg font-medium text-muted-foreground mt-1">
                             {formatCurrency(c.line_total / c.quantity)} each
                          </span>
                        </div>
                     </div>
                     <span className="text-4xl font-black text-primary tracking-tight ml-4 shrink-0">{formatCurrency(c.line_total)}</span>
                   </div>
                 ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Total */}
        <div className="w-full lg:w-[480px] xl:w-[560px] bg-primary p-12 flex flex-col justify-between shadow-2xl z-10 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-[150%] h-[150%] bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-14 h-14 rounded-2xl bg-primary-foreground/10 flex items-center justify-center backdrop-blur-md">
                  <Store size={28} className="text-primary-foreground" />
               </div>
               <h2 className="text-4xl font-black text-primary-foreground tracking-tight capitalize">{storeName}</h2>
            </div>
            <div className="w-24 h-2 bg-primary-foreground/20 rounded-full"></div>
          </div>
          
          <div className="my-16 relative z-10">
            <div className="bg-primary-foreground/5 backdrop-blur-md rounded-3xl p-8 mb-8 border border-primary-foreground/10">
               {taxEnabled && taxRate > 0 && (
                 <div className="mb-6 space-y-4 text-primary-foreground/90 font-medium">
                   <div className="flex justify-between items-center text-2xl">
                     <span>Subtotal</span>
                     <span className="font-bold">{formatCurrency(cartSubtotal)}</span>
                   </div>
                   <div className="flex justify-between items-center text-2xl pb-6 border-b border-primary-foreground/20">
                     <span>Tax ({taxRate}%)</span>
                     <span className="font-bold">{formatCurrency(taxAmount)}</span>
                   </div>
                 </div>
               )}
               <div>
                  <p className="text-2xl font-bold text-primary-foreground/80  capitalize tracking-widest mb-4">Total Due</p>
                  <p className="text-7xl xl:text-8xl font-black text-primary-foreground tracking-tight leading-none">{formatCurrency(total)}</p>
               </div>
            </div>
          </div>
          
          <div className="bg-primary-foreground/10 rounded-3xl p-8 backdrop-blur-md border border-primary-foreground/10 relative z-10 text-center">
            <p className="text-2xl font-bold text-primary-foreground tracking-tight">Thank you for shopping with us!</p>
            <p className="text-lg font-medium text-primary-foreground/70 mt-2">Have a great day.</p>
          </div>
        </div>

      </div>
    </>
  );
}
