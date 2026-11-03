import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { api as apiClient } from '@/api';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/PageHeader';
import { Crown, Check, Zap, Shield, Star, Loader2, Smartphone, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  max_users: number;
  max_devices: number;
  max_stores: number;
  features: any;
  storage_limit: number;
  is_active: boolean;
}

export default function UpgradePage() {
  const navigate = (url: string, options?: any) => router.visit(url, options);
  const { currentStore, licenseStatus, currency } = useApp();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'manual' | 'mpesa'>('manual');
  const [mpesaEnabled, setMpesaEnabled] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [stkPending, setStkPending] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<{ rate_to_usd: number; currency_symbol: string } | null>(null);

  // Convert USD amount to local currency
  const convertFromUsd = (usdAmount: number): number => {
    if (!exchangeRate || exchangeRate.rate_to_usd === 0 || exchangeRate.rate_to_usd === 1) return usdAmount;
    return Math.round(usdAmount / exchangeRate.rate_to_usd);
  };

  const formatLocalPrice = (usdAmount: number): string => {
    const localAmount = convertFromUsd(usdAmount);
    const symbol = exchangeRate?.currency_symbol || currency || '$';
    return `${symbol}${localAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  useEffect(() => {
    // Load plans
    apiClient
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('monthly_price', { ascending: true })
      .then(({ data }) => {
        const filtered = (data || []).filter((p: any) => p.name.toLowerCase() !== 'trial');
        setPlans(filtered as unknown as Plan[]);
        setLoading(false);
      });

    // Check if M-Pesa is enabled platform-wide
    apiClient
      .from('payment_integrations')
      .select('is_enabled, status')
      .eq('provider_name', 'mpesa_platform')
      .eq('is_enabled', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data && data.is_enabled && data.status === 'connected') {
          setMpesaEnabled(true);
        }
      });

    // Load exchange rate for the store's currency
    const storeCurrency = currentStore?.currency || 'KSh';
    apiClient
      .from('exchange_rates')
      .select('rate_to_usd, currency_symbol, currency_code')
      .eq('currency_symbol', storeCurrency)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExchangeRate({ rate_to_usd: Number(data.rate_to_usd), currency_symbol: data.currency_symbol });
        }
      });
  }, [currentStore?.currency]);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleProceedToPayment = async () => {
    if (!selectedPlan || !currentStore) return;
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    if (paymentMethod === 'mpesa') {
      if (!mpesaPhone || mpesaPhone.length < 10) {
        toast.error('Please enter a valid phone number');
        return;
      }
      await handleMpesaPayment(plan);
      return;
    }

    setProcessing(true);
    try {
      const price = billingCycle === 'monthly' ? plan.monthly_price : plan.yearly_price;
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (billingCycle === 'monthly' ? 1 : 12));

      const { error: subError } = await apiClient.from('subscriptions').insert({
        store_id: currentStore.id,
        plan_id: plan.id,
        billing_cycle: billingCycle,
        start_date: startDate,
        end_date: endDate.toISOString().split('T')[0],
        status: 'pending',
      } as any);
      if (subError) throw subError;

      const { error: payError } = await apiClient.from('platform_payments').insert({
        store_id: currentStore.id,
        amount: price,
        method: 'manual',
        status: 'pending',
        transaction_reference: `UP-${Date.now()}`,
        next_due_date: endDate.toISOString().split('T')[0],
      } as any);
      if (payError) throw payError;

      toast.success('Subscription request submitted! The admin will activate your license after payment confirmation.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to process upgrade');
    } finally {
      setProcessing(false);
    }
  };

  const handleMpesaPayment = async (plan: Plan) => {
    setStkPending(true);
    try {
      const price = billingCycle === 'monthly' ? plan.monthly_price : plan.yearly_price;

      // Format phone: ensure 254 prefix
      let phone = mpesaPhone.replace(/\s+/g, '');
      if (phone.startsWith('0')) phone = '254' + phone.slice(1);
      if (!phone.startsWith('254')) phone = '254' + phone;

      const { data, error } = await apiClient.functions.invoke('mpesa-stk-push', {
        body: {
          store_id: currentStore!.id,
          phone_number: phone,
          amount: price,
          account_reference: `License-${plan.name}`,
          sale_id: null,
        },
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'M-Pesa payment request failed. Please try again.');
        setStkPending(false);
        return;
      }

      toast.success('STK Push sent! Please check your phone and enter your M-Pesa PIN.');

      // Create pending subscription + payment
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (billingCycle === 'monthly' ? 1 : 12));

      await apiClient.from('subscriptions').insert({
        store_id: currentStore!.id,
        plan_id: plan.id,
        billing_cycle: billingCycle,
        start_date: startDate,
        end_date: endDate.toISOString().split('T')[0],
        status: 'pending',
      } as any);

      await apiClient.from('platform_payments').insert({
        store_id: currentStore!.id,
        amount: price,
        method: 'mpesa',
        status: 'pending',
        transaction_reference: data.checkout_request_id || `MPESA-${Date.now()}`,
        next_due_date: endDate.toISOString().split('T')[0],
      } as any);

      toast.info('Your payment is being processed. You will be notified once confirmed.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'M-Pesa payment failed');
    } finally {
      setStkPending(false);
    }
  };

  const planIcons = [Zap, Star, Crown, Shield];
  const currentPlanName = licenseStatus?.plan_name?.toLowerCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-20 lg:pb-0">
        <PageHeader title="Upgrade Plan" />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-24 lg:pb-12">
      <PageHeader title="Upgrade Plan" />

      <div className="px-4 md:px-8 py-8 max-w-6xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
           <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground capitalize">Choose your plan</h1>
           <p className="text-lg text-muted-foreground font-medium">Unlock premium features and scale your business with the right tools for your store.</p>
        </div>

        {/* Current plan info */}
        {licenseStatus && licenseStatus.status !== 'none' && (
          <div className="bg-card rounded-3xl p-6 border border-border shadow-sm max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <ShieldCheck size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground  capitalize tracking-widest mb-1">
                  Current Plan
                </p>
                <div className="flex items-center gap-2">
                   <span className="text-lg font-black text-foreground capitalize">{licenseStatus.plan_name || 'Trial'}</span>
                   {licenseStatus.days_remaining !== undefined && licenseStatus.days_remaining >= 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold  capitalize tracking-widest">
                         {licenseStatus.days_remaining} days left
                      </span>
                   ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold  capitalize tracking-widest">
                         Expired
                      </span>
                   )}
                </div>
              </div>
            </div>
            {licenseStatus.expiry_date && (
               <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold text-muted-foreground  capitalize tracking-widest mb-1">Expires On</p>
                  <p className="text-sm font-semibold text-foreground">{licenseStatus.expiry_date}</p>
               </div>
            )}
          </div>
        )}

        {/* Billing toggle */}
        <div className="flex items-center justify-center">
           <div className="bg-card border border-border rounded-2xl p-1.5 flex items-center shadow-sm">
             <button onClick={() => setBillingCycle('monthly')}
               className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
               Monthly
             </button>
             <button onClick={() => setBillingCycle('yearly')}
               className={`relative px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
               Yearly
               <span className={`px-2 py-0.5 rounded-md text-[10px]  capitalize tracking-widest font-black ${billingCycle === 'yearly' ? 'bg-background text-primary' : 'bg-primary text-primary-foreground'}`}>Save 20%</span>
             </button>
           </div>
        </div>

        {/* Plans grid */}
        {plans.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm">
            <Crown size={48} className="text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2 capitalize">No Plans Available</h3>
            <p className="text-muted-foreground font-medium text-sm">Please contact your administrator to set up subscription plans.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const Icon = planIcons[index % planIcons.length];
              const price = billingCycle === 'monthly' ? plan.monthly_price : plan.yearly_price;
              const isCurrentPlan = currentPlanName === plan.name.toLowerCase();
              const isSelected = selectedPlan === plan.id;
              const canRenew = isCurrentPlan && licenseStatus && (licenseStatus.days_remaining !== undefined && licenseStatus.days_remaining <= 7);
              const features = Array.isArray(plan.features) ? plan.features : [];

              return (
                <div key={plan.id}
                  onClick={() => (canRenew || !isCurrentPlan) && handleSelectPlan(plan.id)}
                  className={`relative flex flex-col bg-card rounded-3xl p-8 transition-all cursor-pointer border-2 ${
                    isSelected ? 'border-primary shadow-xl shadow-primary/10 ring-4 ring-primary/5 translate-y-[-4px]'
                    : isCurrentPlan && !canRenew ? 'border-border opacity-75 cursor-not-allowed bg-muted/30'
                    : isCurrentPlan && canRenew ? 'border-warning shadow-lg bg-warning/5 hover:-translate-y-1'
                    : 'border-border shadow-sm hover:border-primary/50 hover:shadow-lg hover:-translate-y-1'
                  }`}>
                  
                  {isCurrentPlan && (
                    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black  capitalize tracking-widest shadow-sm ${canRenew ? 'bg-warning text-warning-foreground' : 'bg-foreground text-background'}`}>
                      {canRenew ? 'Time to Renew' : 'Current Plan'}
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Icon size={28} />
                    </div>
                    {isSelected && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm animate-in zoom-in">
                        <Check size={16} className="text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-2xl font-black text-foreground mb-1 capitalize">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-foreground tracking-tight">{formatLocalPrice(price)}</span>
                      <span className="text-sm font-bold text-muted-foreground">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8 flex-1">
                    <div className="bg-muted/30 rounded-2xl p-4 grid grid-cols-2 gap-4">
                       <div>
                          <p className="text-[10px] font-bold text-muted-foreground  capitalize tracking-widest mb-1">Users</p>
                          <p className="text-sm font-bold text-foreground">{plan.max_users === -1 ? 'Unlimited' : plan.max_users}</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-muted-foreground  capitalize tracking-widest mb-1">Stores</p>
                          <p className="text-sm font-bold text-foreground">{plan.max_stores === -1 ? 'Unlimited' : plan.max_stores}</p>
                       </div>
                    </div>
                    
                    {features.length > 0 && (
                      <ul className="space-y-3 pt-4">
                        {features.map((feature: string, fi: number) => (
                          <li key={fi} className="flex items-start gap-3 text-sm font-medium text-muted-foreground">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                               <Check size={12} className="text-primary" />
                            </div>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button 
                    disabled={isCurrentPlan && !canRenew}
                    className={`w-full py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                       isSelected ? 'bg-primary text-primary-foreground shadow-md'
                       : isCurrentPlan && !canRenew ? 'bg-muted text-muted-foreground'
                       : 'bg-foreground text-background hover:opacity-90 shadow-md'
                    }`}>
                    {isSelected ? 'Selected' : isCurrentPlan && !canRenew ? 'Current Plan' : 'Select Plan'}
                    {!isSelected && !(isCurrentPlan && !canRenew) && <ArrowRight size={16} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Payment section */}
        {selectedPlan && (
          <div className="max-w-2xl mx-auto bg-card rounded-3xl p-6 md:p-10 border border-border shadow-xl animate-in slide-in-from-bottom-8 duration-500">
            <h3 className="text-2xl font-black text-foreground mb-8 text-center capitalize">
              {currentPlanName === plans.find(p => p.id === selectedPlan)?.name.toLowerCase() ? 'Complete Renewal' : 'Complete Upgrade'}
            </h3>

            {/* Payment Method Selection */}
            <div className="space-y-4 mb-8">
              <label className="text-xs font-bold text-muted-foreground  capitalize tracking-widest">Select Payment Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => setPaymentMethod('manual')}
                  className={`py-4 px-6 rounded-2xl font-bold text-sm flex items-center gap-3 transition-all border-2 ${
                    paymentMethod === 'manual' ? 'border-primary bg-primary/5 text-foreground shadow-sm ring-2 ring-primary/20' : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                  }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'manual' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                     <Crown size={20} />
                  </div>
                  Manual Payment
                </button>
                {mpesaEnabled && (
                  <button onClick={() => setPaymentMethod('mpesa')}
                    className={`py-4 px-6 rounded-2xl font-bold text-sm flex items-center gap-3 transition-all border-2 ${
                      paymentMethod === 'mpesa' ? 'border-success bg-success/5 text-foreground shadow-sm ring-2 ring-success/20' : 'border-border bg-card text-muted-foreground hover:border-success/30'
                    }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'mpesa' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
                       <Smartphone size={20} />
                    </div>
                    M-Pesa
                  </button>
                )}
              </div>
            </div>

            {/* M-Pesa Phone Input */}
            {paymentMethod === 'mpesa' && (
              <div className="space-y-3 mb-8 bg-success/5 border border-success/20 p-6 rounded-2xl">
                <label className="text-xs font-bold text-success  capitalize tracking-widest">M-Pesa Phone Number</label>
                <div className="relative">
                  <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={e => setMpesaPhone(e.target.value)}
                    placeholder="e.g. 0712345678 or 254712345678"
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-input bg-background text-foreground font-bold shadow-sm placeholder:text-muted-foreground placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success transition-all text-lg"
                  />
                </div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                   <ShieldCheck size={14} className="text-success" />
                   You will receive a secure STK Push on this number to complete payment.
                </p>
              </div>
            )}

            {paymentMethod === 'manual' && (
              <div className="mb-8 p-6 bg-muted/20 border border-border rounded-2xl flex items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} className="text-primary" />
                 </div>
                 <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                   After submitting, the platform administrator will review and activate your license once payment is confirmed via offline channels (Bank Transfer, Cash, etc).
                 </p>
              </div>
            )}

            <div className="bg-muted/10 border border-border/50 rounded-2xl p-6 space-y-4 mb-8 shadow-inner">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Selected Plan</span>
                <span className="font-bold text-foreground">{plans.find(p => p.id === selectedPlan)?.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Billing Cycle</span>
                <span className="font-bold text-foreground capitalize">{billingCycle}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Payment Method</span>
                <span className="font-bold text-foreground capitalize">{paymentMethod === 'mpesa' ? 'M-Pesa' : 'Manual'}</span>
              </div>
              <div className="h-px w-full bg-border/50"></div>
              <div className="flex justify-between items-end">
                <span className="font-black text-foreground  capitalize tracking-widest text-xs mb-1">Total Due</span>
                <span className="font-black text-foreground text-3xl tracking-tight">
                  {formatLocalPrice(
                    billingCycle === 'monthly'
                      ? plans.find(p => p.id === selectedPlan)?.monthly_price || 0
                      : plans.find(p => p.id === selectedPlan)?.yearly_price || 0
                  )}
                </span>
              </div>
            </div>

            <button onClick={handleProceedToPayment} disabled={processing || stkPending}
              className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${
                 paymentMethod === 'mpesa' ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground'
              }`}>
              {processing || stkPending ? (
                <>
                  <div className="w-6 h-6 border-4 border-current border-t-transparent rounded-full animate-spin" />
                  {stkPending ? 'Sending STK Push...' : 'Processing...'}
                </>
              ) : paymentMethod === 'mpesa' ? (
                <>
                  <Smartphone size={24} />
                  Pay with M-Pesa
                </>
              ) : (
                <>
                  <Crown size={24} />
                  {currentPlanName === plans.find(p => p.id === selectedPlan)?.name.toLowerCase() ? 'Submit Renewal Request' : 'Submit Upgrade Request'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
