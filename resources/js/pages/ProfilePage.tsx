import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/PageHeader';
import { User, Phone, Mail, Lock, Shield, Store, Crown, Eye, EyeOff, Save, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';

export default function ProfilePage() {
  const { profile, currentStore, licenseStatus, updateProfile, changePassword, logout } = useApp();
  const navigate = (url, options) => router.visit(url, options);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    const success = await updateProfile({ full_name: fullName, phone });
    if (success) {
      toast.success('Profile updated successfully');
    } else {
      toast.error('Failed to update profile');
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setChangingPassword(true);
    const success = await changePassword(newPassword);
    if (success) {
      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error('Failed to change password');
    }
    setChangingPassword(false);
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <PageHeader 
        title="Personal Profile" 
        rightAction={
          <button 
            onClick={logout}
            className="px-5 py-2 rounded-md bg-destructive/10 text-destructive text-sm font-bold hover:bg-destructive/20 transition-colors shadow-sm capitalize"
          >
            Sign Out
          </button>
        }
      />

      <div className="p-6 md:px-8 max-w-5xl mx-auto w-full mt-6 space-y-12">
        
        {/* Section 1: Overview */}
        <div className="flex flex-col md:flex-row gap-8 pb-10 border-b border-border">
          <div className="w-full md:w-1/3 shrink-0">
            <h2 className="text-base font-semibold text-foreground mb-2 capitalize">Account Overview</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your personal account details and current subscription status.
            </p>
          </div>
          <div className="w-full md:w-2/3">
             <div className="bg-card rounded-md border border-border shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6">
                {currentStore?.logo_url ? (
                  <img src={currentStore.logo_url} alt={currentStore.store_name} className="w-24 h-24 rounded-full object-cover shrink-0 border border-border shadow-sm" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <User size={40} className="text-primary" />
                  </div>
                )}
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-light tracking-tight text-foreground capitalize">{profile?.full_name || 'User'}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{profile?.email}</p>
                  
                  {licenseStatus && (
                    <div className="mt-4 inline-flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-warning/10 border border-warning/20">
                        <Crown size={14} className="text-warning" />
                        <span className="text-xs font-bold capitalize tracking-wider  text-warning">{licenseStatus.plan_name || 'Free'} Plan</span>
                      </div>
                      
                      <button
                          onClick={() => navigate('/upgrade')}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Upgrade Plan
                        </button>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>

        {/* Section 2: Personal Information */}
        <div className="flex flex-col md:flex-row gap-8 pb-10 border-b border-border">
          <div className="w-full md:w-1/3 shrink-0">
            <h2 className="text-base font-semibold text-foreground mb-2 capitalize">Personal Details</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Update your basic profile information. Your email address cannot be changed from this screen.
            </p>
          </div>
          <div className="w-full md:w-2/3">
            <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden">
               <div className="p-6 space-y-5">
                 
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Full Name</label>
                    <input 
                      value={fullName} 
                      onChange={e => setFullName(e.target.value)}
                      className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Phone Number</label>
                    <input 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Email Address</label>
                    <input 
                      value={profile?.email || ''} 
                      disabled
                      className="w-full px-4 h-11 rounded-md border border-border bg-muted/50 text-sm text-muted-foreground cursor-not-allowed shadow-sm" 
                    />
                  </div>
                  
               </div>
               
               <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={saving || (!fullName && !phone)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 capitalize"
                  >
                    <Save size={16} />
                    <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                  </button>
               </div>
            </div>
          </div>
        </div>

        {/* Section 3: Security */}
        <div className="flex flex-col md:flex-row gap-8 pb-10">
          <div className="w-full md:w-1/3 shrink-0">
            <h2 className="text-base font-semibold text-foreground mb-2 capitalize">Security</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ensure your account is using a long, random password to stay secure.
            </p>
          </div>
          <div className="w-full md:w-2/3">
            <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden">
               <div className="p-6 space-y-5">
                 
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full px-4 pr-10 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground  capitalize tracking-wider">Confirm Password</label>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm" 
                      placeholder="Repeat new password"
                    />
                  </div>
                  
               </div>
               
               <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
                  <button 
                    onClick={handleChangePassword}
                    disabled={changingPassword || !newPassword}
                    className="flex items-center gap-2 bg-foreground text-background px-5 py-2 rounded-md text-sm font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 capitalize"
                  >
                    <KeyRound size={16} />
                    <span>{changingPassword ? 'Updating...' : 'Update Password'}</span>
                  </button>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
