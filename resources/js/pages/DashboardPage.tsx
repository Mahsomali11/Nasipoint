import { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { ShoppingCart, Receipt, TrendingUp, CreditCard, Package, Clock, MapPin, Wallet, ArrowUpRight, ArrowDownRight, Store, Plus, Bell, ChevronRight, Activity, Calendar } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import TrialExpiryBanner from '@/components/TrialExpiryBanner';
import OnboardingCards from '@/components/OnboardingCards';
import { toast } from 'sonner';

export default function DashboardPage() {
  const navigate = (url, options) => router.visit(url, options);
  const { currentStore, items, sales, customers, payments, customerDebts, expenses, formatCurrency, user } = useApp();
  const userRole = user?.role || 'owner';
  const { hasFeature } = useFeatureAccess();

  const recentSales = [...sales]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map(sale => {
      const customer = customers?.find(c => c.id === sale.customer_id);
      const payment = payments?.find(p => p.sale_id === sale.id);
      return {
        ...sale,
        customer_name: customer ? customer.name : 'Walk-in Customer',
        payment_method: payment ? (payment.method || 'Cash') : 'Cash'
      };
    });

  const totalStock = items.reduce((sum, i) => sum + i.quantity, 0);
  const lowStockItems = items.filter(i => i.type === 'product' && i.quantity > 0 && i.quantity <= i.low_stock_threshold);
  const outOfStockItems = items.filter(i => i.type === 'product' && i.quantity === 0);
  const lowStockCount = lowStockItems.length + outOfStockItems.length;
  const hasInventoryFeature = hasFeature('inventory');
  
  const todaySales = sales.filter(s => {
    const d = new Date(s.sold_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const openDebts = customerDebts.filter(d => d.status !== 'paid').reduce((sum, d) => sum + d.balance_amount, 0);
  const todayExpenses = expenses.filter(e => e.status !== 'reversed' && new Date(e.created_at).toDateString() === new Date().toDateString() && e.expense_type !== 'Purchase' && e.expense_type !== 'Supplier Payment').reduce((sum, e) => sum + e.amount, 0);

  const startSale = () => {
    if (!hasFeature('pos_sales')) {
      toast.error('This feature is not included in your current plan. Please upgrade.');
      navigate('/upgrade');
      return;
    }
    navigate('/start-sale');
  };

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-background">
      {/* Bespoke Dashboard Header */}
      <div className="bg-card border-b border-border px-6 md:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Calendar size={14} />
              <span className="text-xs font-semibold  capitalize tracking-wider">{currentDate}</span>
            </div>
            <h1 className="text-3xl font-light text-foreground tracking-tight capitalize">
              Welcome back, <span className="font-semibold">{currentStore?.store_name || 'Owner'}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Here is what's happening with your store today. Review your daily metrics, inventory alerts, and quick actions to manage your business.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0 mt-4 md:mt-0">
            {(userRole === 'owner' || userRole === 'admin') && (
              <button
                onClick={() => navigate('/store-edit')}
                className="flex-1 md:flex-none h-10 px-4 rounded-md bg-muted text-foreground text-sm font-medium hover:bg-accent transition-colors flex items-center justify-center gap-2 border border-border"
              >
                <Store size={16} />
                Store Settings
              </button>
            )}
            {(userRole === 'owner' || userRole === 'admin' || userRole === 'cashier') && (
              <button
                onClick={startSale}
                className="flex-1 md:flex-none h-10 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2 capitalize"
              >
                <Plus size={16} />
                New Sale
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 md:px-8 max-w-7xl mx-auto w-full space-y-8">
        
        <TrialExpiryBanner />
        <OnboardingCards />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Left Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Primary Metrics Grid - Restructured */}
            <div>
              <h2 className="text-sm font-bold text-foreground  capitalize tracking-wider mb-4 flex items-center gap-2">
                <Activity size={16} className="text-muted-foreground" />
                Today's Performance
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Hero Revenue Card */}
                <div className="bg-primary text-primary-foreground rounded-md p-6 border border-primary shadow-sm flex flex-col justify-between relative overflow-hidden sm:col-span-2 md:col-span-1">
                  <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
                    <TrendingUp size={120} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold  capitalize tracking-wider text-primary-foreground/70 mb-2">Net Revenue</p>
                    <h3 className="text-4xl font-light tracking-tight capitalize">{formatCurrency(todayRevenue)}</h3>
                  </div>
                  <div className="mt-8 flex items-center gap-2 text-sm text-primary-foreground/80">
                    <span className="flex items-center gap-1 bg-primary-foreground/20 px-2 py-0.5 rounded text-xs font-medium">
                      <ArrowUpRight size={14} /> {todaySales.length}
                    </span>
                    <span className="text-xs">Completed transactions today</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Expenses Card */}
                  <div className="bg-card rounded-md p-5 border border-border shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Operating Expenses</p>
                      <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0 border border-border/50 shadow-sm">
                        <ArrowDownRight size={14} className="text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-foreground tracking-tight capitalize">{formatCurrency(todayExpenses)}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Recorded today</p>
                    </div>
                  </div>

                  {/* Open Debts Card */}
                  <div className="bg-card rounded-md p-5 border border-border shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Outstanding Debts</p>
                      <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0 border border-border/50 shadow-sm">
                        <Wallet size={14} className="text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-foreground tracking-tight capitalize">{formatCurrency(openDebts)}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Total unpaid customer credit</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Navigation Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(userRole === 'owner' || userRole === 'admin') && (
                <button onClick={() => navigate('/sales-report')} className="flex flex-col items-center justify-center gap-2 p-4 bg-muted/30 rounded-md border border-border hover:bg-muted/50 hover:border-primary/50 transition-all group">
                  <TrendingUp size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-semibold text-foreground  capitalize tracking-wider">Reports</span>
                </button>
              )}
              {(userRole === 'owner' || userRole === 'admin' || userRole === 'inventory_manager') && (
                <button onClick={() => navigate('/inventory')} className="flex flex-col items-center justify-center gap-2 p-4 bg-muted/30 rounded-md border border-border hover:bg-muted/50 hover:border-primary/50 transition-all group">
                  <Package size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-semibold text-foreground  capitalize tracking-wider">Inventory</span>
                </button>
              )}
              {(userRole === 'owner' || userRole === 'admin' || userRole === 'cashier') && (
                <button onClick={() => navigate('/customers')} className="flex flex-col items-center justify-center gap-2 p-4 bg-muted/30 rounded-md border border-border hover:bg-muted/50 hover:border-primary/50 transition-all group">
                  <CreditCard size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-semibold text-foreground  capitalize tracking-wider">Customers</span>
                </button>
              )}
              {(userRole === 'owner' || userRole === 'admin') && (
                <button onClick={() => navigate('/expenses')} className="flex flex-col items-center justify-center gap-2 p-4 bg-muted/30 rounded-md border border-border hover:bg-muted/50 hover:border-primary/50 transition-all group">
                  <Receipt size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-semibold text-foreground  capitalize tracking-wider">Expenses</span>
                </button>
              )}
            </div>

            {/* Recent Activity / Feed */}
            <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm capitalize">Activity Feed</h3>
                <span className="text-xs font-medium text-muted-foreground  capitalize tracking-wider">Live</span>
              </div>
              {recentSales && recentSales.length > 0 ? (
                <div className="divide-y divide-border">
                  {recentSales.map((sale: any) => (
                    <div key={sale.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-border/50 shadow-sm shrink-0">
                          <Receipt size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{sale.customer_name}</p>
                          <p className="text-xs text-muted-foreground">Receipt: {sale.receipt_no} &bull; {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{formatCurrency(sale.total)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{sale.payment_method}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 flex flex-col items-center justify-center text-center bg-muted/10">
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center mb-4 border border-border">
                    <Clock size={20} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No recent activity</p>
                  <p className="text-xs text-muted-foreground max-w-xs">Your latest transactions, updates, and events will appear here chronologically.</p>
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar Column */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Store Badge Component */}
            <div className="bg-background rounded-md border border-border shadow-sm p-6 flex items-center gap-5">
              <div className="shrink-0">
                {currentStore?.logo_url ? (
                  <img src={currentStore.logo_url} alt={currentStore.store_name} className="w-20 h-20 rounded-xl object-cover border border-border shadow-sm bg-card" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-card flex items-center justify-center border border-border shadow-sm">
                    <Store size={28} className="text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black text-foreground mb-2 break-words leading-tight truncate capitalize">{currentStore?.store_name || 'My Store'}</h3>
                <div className="space-y-1.5 mt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin size={14} className="text-muted-foreground/70 shrink-0" />
                    <span className="truncate">{currentStore?.location || 'No location set'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border text-[10px] shrink-0">ID: {currentStore?.store_code}</span>
                    <span className="truncate">System Reference</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Status Widget */}
            <div className="bg-card rounded-md border border-border shadow-sm flex flex-col">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 capitalize">
                  <Bell size={16} className="text-muted-foreground" />
                  Stock Alerts
                </h3>
                {lowStockCount > 0 && (
                  <span className="bg-secondary text-primary border border-border/50 shadow-sm text-[10px] px-2 py-0.5 rounded font-bold  capitalize tracking-wider">
                    {lowStockCount} Issues
                  </span>
                )}
              </div>
              
              <div className="p-5 flex items-center justify-between bg-muted/10 border-b border-border">
                <div>
                  <p className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Total Inventory</p>
                  <p className="text-xl font-semibold text-foreground mt-1">{items.length} <span className="text-sm font-normal text-muted-foreground">items</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Stock Units</p>
                  <p className="text-xl font-semibold text-foreground mt-1">{totalStock}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[300px]">
                {lowStockCount === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    All inventory levels are healthy.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {[...outOfStockItems, ...lowStockItems].slice(0, 8).map(item => (
                      <div key={item.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.quantity === 0 ? 'bg-primary' : 'bg-primary/50'}`}></div>
                          <p className="font-medium text-foreground text-xs truncate pr-2">{item.name}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`font-bold text-xs ${item.quantity === 0 ? 'text-primary' : 'text-foreground'}`}>
                            {item.quantity} left
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {lowStockCount > 8 && (
                <div className="p-3 border-t border-border bg-muted/10 text-center">
                  <button onClick={() => navigate('/inventory')} className="text-xs font-medium text-primary hover:underline">
                    View all {lowStockCount} alerts
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

