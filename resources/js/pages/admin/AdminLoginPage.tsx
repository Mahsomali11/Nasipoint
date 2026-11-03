import { Shield } from 'lucide-react';
import { useForm, Head } from '@inertiajs/react';

export default function AdminLoginPage() {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Head title="System Admin Login" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(145,63%,42%)] to-[hsl(180,60%,40%)] flex items-center justify-center mx-auto mb-4 shadow-lg" style={{boxShadow: '0 8px 32px hsl(145,63%,42%,0.3)'}}>
            <Shield size={32} className="text-foreground" />
          </div>
                    <p className="text-muted-foreground text-sm mt-1">Platform Administration Portal</p>
          <p className="text-muted-foreground text-xs mt-1">For platform administrators only</p>
        </div>

        <div className="bg-[hsl(220,20%,12%)] rounded-2xl p-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.email && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
                {errors.email}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-[hsl(220,10%,70%)] mb-1.5 block capitalize">
                Email Address
              </label>
              <input
                type="email"
                value={data.email}
                onChange={e => setData('email', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(145,63%,42%)] focus:border-transparent transition-all"
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[hsl(220,10%,70%)] mb-1.5 block capitalize">
                Password
              </label>
              <input
                type="password"
                value={data.password}
                onChange={e => setData('password', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(145,63%,42%)] focus:border-transparent transition-all"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[hsl(145,63%,42%)] to-[hsl(160,60%,38%)] text-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 mt-2 capitalize"
            >
              {processing ? 'Authenticating...' : 'Sign In to Admin Panel'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-[hsl(220,10%,35%)]">
            This portal is for authorized platform administrators only.
          </p>
          <a href="/login" className="text-xs text-[hsl(220,10%,45%)] hover:text-[hsl(220,10%,65%)] transition-colors underline">
            ← Back to normal user login
          </a>
        </div>
      </div>
    </div>
  );
}
