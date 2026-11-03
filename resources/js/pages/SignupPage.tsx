import { useState, useEffect } from 'react';
import { Store, User, MapPin, DollarSign, Mail, Lock, CheckCircle2, MapPinned, ArrowRight, ArrowLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import PhoneInput, { COUNTRY_CODES, useGeoCountry, getInternationalPhone, type CountryCode } from '@/components/PhoneInput';
import { useForm, Head, Link } from '@inertiajs/react';
import { toast } from 'sonner';

const CURRENCIES = ['KSh', 'USD', 'EUR', 'GBP', 'TZS', 'UGX', 'ETB', 'SSP', 'RWF', 'BIF'];

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const totalSteps = 2;

  const { data, setData, post, processing, errors, clearErrors } = useForm({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    storePhone: '',
    storeLocation: '',
    currency: 'KSh',
  });

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [phoneError, setPhoneError] = useState('');

  const { detect, detecting } = useGeoCountry((country) => {
    setSelectedCountry(country);
    toast.success(`Country detected: ${country.country} (${country.dialCode})`);
  });

  useEffect(() => {
    detect();
  }, []);

  const validateStep1 = () => {
    clearErrors();
    let valid = true;
    if (!data.fullName.trim()) { setData('fullName', data.fullName); valid = false; }
    if (!data.email.trim()) { valid = false; }
    if (data.password.length < 6) { valid = false; }
    if (data.password !== data.confirmPassword) { valid = false; }
    return valid;
  };

  const validateStep2 = () => {
    clearErrors();
    if (!data.storeName.trim()) return false;
    if (data.storePhone && data.storePhone.length !== selectedCountry.phoneLength) {
      setPhoneError(`Phone number must contain exactly ${selectedCountry.phoneLength} digits for ${selectedCountry.country}.`);
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleBack = () => {
    clearErrors();
    setPhoneError('');
    setStep(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    const internationalPhone = data.storePhone ? getInternationalPhone(selectedCountry, data.storePhone) : '';
    
    // Convert to the shape the controller expects
    setData('storePhone', internationalPhone);
    
    post('/signup-with-store', {
        onSuccess: () => {
            toast.success('Account created! Your store is ready.');
        }
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      <Head title="Create Account" />
      
      {/* Left Panel: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 relative z-10 overflow-y-auto">
        <div className="w-full max-w-[420px]">
          
          <div className="flex flex-col items-start mb-8">
            <h1 className="text-3xl font-light text-foreground tracking-tight capitalize">Create <span className="font-semibold">Account</span></h1>
            <p className="text-sm text-muted-foreground mt-2">Start your 14-day free trial. No credit card required.</p>
            
            <div className="w-full mt-6">
               <div className="flex justify-between text-xs font-semibold text-muted-foreground  capitalize tracking-wider mb-2">
                 <span>{step === 1 ? 'Your Details' : 'Store Details'}</span>
                 <span>Step {step} of {totalSteps}</span>
               </div>
               <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-primary transition-all duration-500 ease-in-out"
                   style={{ width: `${(step / totalSteps) * 100}%` }}
                 />
               </div>
            </div>
          </div>

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-5">
                {errors.email && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
                    {errors.email}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Full Name *</label>
                  <input 
                    type="text" 
                    value={data.fullName} 
                    onChange={e => setData('fullName', e.target.value)} 
                    placeholder="Enter your full name"
                    className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Email Address *</label>
                  <input 
                    type="email" 
                    value={data.email} 
                    onChange={e => setData('email', e.target.value)} 
                    placeholder="Enter your email"
                    className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm" 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Password *</label>
                    <input 
                      type="password" 
                      value={data.password} 
                      onChange={e => setData('password', e.target.value)} 
                      placeholder="Min 6 chars"
                      className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Confirm *</label>
                    <input 
                      type="password" 
                      value={data.confirmPassword} 
                      onChange={e => setData('confirmPassword', e.target.value)} 
                      placeholder="Repeat password"
                      className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm" 
                      required 
                    />
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={handleNext}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-opacity mt-6 capitalize"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>

              <div className="pt-6 border-t border-border mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="text-foreground hover:text-primary font-semibold transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-5">
                {errors.storeName && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
                    {errors.storeName}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Store Name *</label>
                  <input 
                    type="text" 
                    value={data.storeName} 
                    onChange={e => setData('storeName', e.target.value)} 
                    placeholder="What is your business called?"
                    className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center justify-between text-xs font-bold text-muted-foreground  capitalize tracking-wider">
                    <span>Business Phone</span>
                    {detecting && (
                      <span className="flex items-center gap-1 text-primary lowercase normal-case text-[10px]">
                        <MapPinned size={10} className="animate-pulse" /> detecting country...
                      </span>
                    )}
                  </label>
                  <PhoneInput
                    value={data.storePhone}
                    onChange={(digits) => { setData('storePhone', digits); setPhoneError(''); }}
                    selectedCountry={selectedCountry}
                    onCountryChange={setSelectedCountry}
                    error={phoneError}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Store Location</label>
                  <input 
                    type="text" 
                    value={data.storeLocation} 
                    onChange={e => setData('storeLocation', e.target.value)} 
                    placeholder="City, Area, or full address"
                    className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Primary Currency</label>
                  <select 
                    value={data.currency} 
                    onChange={e => setData('currency', e.target.value)}
                    className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm appearance-none"
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-md p-4 flex items-start gap-3 mt-4">
                  <CheckCircle2 size={18} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">14-day free trial included</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Get full access to all POS features. No credit card required. Cancel anytime.</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={handleBack}
                    className="flex-1 h-11 flex items-center justify-center gap-2 rounded-md bg-muted text-foreground text-sm font-semibold hover:bg-accent transition-colors capitalize"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button 
                    type="submit" 
                    disabled={processing}
                    className="flex-[2] h-11 flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 capitalize"
                  >
                    {processing ? 'Creating...' : 'Create Store'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Panel: Decorative (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-muted relative overflow-hidden items-center justify-center border-l border-border">
        {/* Subtle architectural/geometric pattern or gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-background/50"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        
        <div className="relative z-10 max-w-lg p-12">
          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                <h3 className="font-semibold text-foreground capitalize">Sign Up</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Create your account in seconds without any payment details.</p>
             </div>
             <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">2</div>
                <h3 className="font-semibold text-foreground capitalize">Setup Store</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Add your business details to configure your receipt branding.</p>
             </div>
             <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">3</div>
                <h3 className="font-semibold text-foreground capitalize">Add Products</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Easily import your inventory or create products individually.</p>
             </div>
             <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">4</div>
                <h3 className="font-semibold text-foreground capitalize">Start Selling</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Use the POS interface to ring up sales and track your cash flow.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
