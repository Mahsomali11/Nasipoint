import { Store as StoreIcon } from 'lucide-react';
import { useForm, Head, Link } from '@inertiajs/react';

export default function LoginPage() {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/login');
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      <Head title="Sign In" />
      
      {/* Left Panel: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 relative z-10">
        <div className="w-full max-w-[420px] space-y-8">
          
          <div className="flex flex-col items-start mb-8">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
               <StoreIcon size={24} className="text-primary" />
            </div>
            <h1 className="text-3xl font-light text-foreground tracking-tight capitalize">Welcome <span className="font-semibold">Back</span></h1>
            <p className="text-sm text-muted-foreground mt-2">Sign in to your point of sale system.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.email && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
                {errors.email}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Email Address</label>
              <input
                type="email"
                value={data.email}
                onChange={e => setData('email', e.target.value)}
                className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Password</label>
                <Link href="/reset-password" className="text-xs text-primary hover:underline font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={data.password}
                onChange={e => setData('password', e.target.value)}
                className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
                placeholder="Enter password"
                required
              />
            </div>

            <div className="flex items-center pt-1">
              <label className="flex items-center gap-3 cursor-pointer group capitalize">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={data.remember}
                    onChange={e => setData('remember', e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-4 h-4 border border-input rounded flex items-center justify-center peer-checked:bg-primary peer-checked:border-primary transition-colors">
                    <svg className="w-3 h-3 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 mt-4 capitalize"
            >
              {processing ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="pt-6 border-t border-border mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="text-foreground hover:text-primary font-semibold transition-colors">
                Create one
              </Link>
            </p>
            <Link 
              href="/admin/login" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin Access &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel: Decorative (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-muted relative overflow-hidden items-center justify-center border-l border-border">
        {/* Subtle architectural/geometric pattern or gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-background/50"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        
        <div className="relative z-10 max-w-lg p-12">
          <h2 className="text-4xl font-light text-foreground leading-tight tracking-tight mb-6 capitalize">
            Empower your <span className="font-semibold">business</span> with modern point of sale.
          </h2>
          <p className="text-lg text-muted-foreground">
            A fast, reliable, and beautifully designed interface to handle sales, inventory, and analytics all in one place.
          </p>
        </div>
      </div>

    </div>
  );
}
