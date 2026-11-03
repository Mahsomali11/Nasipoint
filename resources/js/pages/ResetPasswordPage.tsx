import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { api as apiClient } from '@/api';
import { Head, Link } from '@inertiajs/react';
import { KeyRound, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const navigate = (url, options) => router.visit(url, options);

  useEffect(() => {
    // Check if this is a password reset link with token
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlEmail = params.get('email');
    if (urlToken && urlEmail) {
      setIsRecovery(true);
      setToken(urlToken);
      setEmail(urlEmail);
    }
  }, []);

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await apiClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setSent(true);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setMessage('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error } = await apiClient.auth.resetPassword({ email, token, password: newPassword });
    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Password updated successfully!');
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      <Head title="Reset Password" />
      
      {/* Left Panel: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 relative z-10">
        
        <div className="w-full max-w-[420px]">
          <div className="mb-10">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} /> Back to login
            </Link>
          </div>
          
          <div className="flex flex-col items-start mb-8">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
               <KeyRound size={24} className="text-primary" />
            </div>
            <h1 className="text-3xl font-light text-foreground tracking-tight capitalize">
              Reset <span className="font-semibold">Password</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {isRecovery ? 'Create a new password for your account.' : 'Enter your email to receive a reset link.'}
            </p>
          </div>

          {isRecovery ? (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              {message && (
                <div className={`text-sm p-3 rounded-md border ${message.includes('success') ? 'bg-success/10 border-success/20 text-success' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
                  {message}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  placeholder="Enter new password"
                  className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm" 
                  required 
                />
              </div>

              <button type="submit" disabled={loading}
                className="w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-bold mt-4 shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 capitalize">
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          ) : sent ? (
            <div className="py-2">
              <div className="bg-success/10 text-success text-sm font-medium p-4 rounded-md mb-6 border border-success/20">
                Reset link sent! Check your email inbox for the password reset instructions.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendReset} className="space-y-5">
              {message && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
                  {message}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="Enter your email address"
                  className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm" 
                  required 
                />
              </div>

              <button type="submit" disabled={loading}
                className="w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-bold mt-4 shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 capitalize">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
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
          <h2 className="text-4xl font-light text-foreground leading-tight tracking-tight mb-6 capitalize">
            Secure <span className="font-semibold">Access</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            We employ industry-standard encryption to ensure your data and your customer's data remains private and secure.
          </p>
        </div>
      </div>
      
    </div>
  );
}
