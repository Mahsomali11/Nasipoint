import PageHeader from '@/components/PageHeader';
import { useState, useEffect } from 'react';
import { api as apiClient } from '@/api';
import { toast } from 'sonner';
import {
  Save, TestTube, RotateCcw, Eye, EyeOff,
  CheckCircle2, XCircle, AlertCircle, Loader2, WifiOff, Smartphone
} from 'lucide-react';

type IntegrationStatus = 'not_configured' | 'connected' | 'connection_failed' | 'disabled';

interface MpesaConfig {
  id?: string;
  environment: 'sandbox' | 'production';
  consumer_key: string;
  consumer_secret_encrypted: string;
  shortcode: string;
  passkey_encrypted: string;
  callback_url: string;
  confirmation_url: string;
  validation_url: string;
  initiator_name: string;
  security_credential_encrypted: string;
  status: IntegrationStatus;
  is_enabled: boolean;
  last_tested_at: string | null;
}

const emptyConfig: MpesaConfig = {
  environment: 'sandbox',
  consumer_key: '',
  consumer_secret_encrypted: '',
  shortcode: '',
  passkey_encrypted: '',
  callback_url: '',
  confirmation_url: '',
  validation_url: '',
  initiator_name: '',
  security_credential_encrypted: '',
  status: 'not_configured',
  is_enabled: false,
  last_tested_at: null,
};

// This is a platform-level M-Pesa config stored with store_id = null-like sentinel
// We use the system_settings or a dedicated row with a known sentinel store_id
// For simplicity, we store as provider_name='mpesa_platform' with a sentinel

export default function AdminMpesaSettingsPage() {
  const [config, setConfig] = useState<MpesaConfig>(emptyConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    // Platform-level M-Pesa config — uses provider_name 'mpesa_platform'
    const { data } = await apiClient
      .from('payment_integrations')
      .select('*')
      .eq('provider_name', 'mpesa_platform')
      .maybeSingle();

    if (data) {
      setConfig({
        id: data.id,
        environment: data.environment as 'sandbox' | 'production',
        consumer_key: data.consumer_key,
        consumer_secret_encrypted: data.consumer_secret_encrypted,
        shortcode: data.shortcode,
        passkey_encrypted: data.passkey_encrypted,
        callback_url: data.callback_url,
        confirmation_url: data.confirmation_url,
        validation_url: data.validation_url,
        initiator_name: data.initiator_name,
        security_credential_encrypted: data.security_credential_encrypted,
        status: data.status as IntegrationStatus,
        is_enabled: data.is_enabled,
        last_tested_at: data.last_tested_at,
      });
      setHasExisting(true);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!config.consumer_key || !config.consumer_secret_encrypted || !config.shortcode || !config.passkey_encrypted) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);

    // We need a store_id for the FK — use a sentinel approach via edge function
    const { data, error } = await apiClient.functions.invoke('mpesa-save-platform-config', {
      body: {
        id: config.id || undefined,
        environment: config.environment,
        consumer_key: config.consumer_key,
        consumer_secret_encrypted: config.consumer_secret_encrypted,
        shortcode: config.shortcode,
        passkey_encrypted: config.passkey_encrypted,
        callback_url: config.callback_url,
        confirmation_url: config.confirmation_url,
        validation_url: config.validation_url,
        initiator_name: config.initiator_name,
        security_credential_encrypted: config.security_credential_encrypted,
        is_enabled: config.is_enabled,
      },
    });

    setSaving(false);
    if (error || !data?.success) {
      toast.error(data?.error || 'Failed to save settings');
    } else {
      if (data.id) setConfig(prev => ({ ...prev, id: data.id }));
      setHasExisting(true);
      toast.success('M-Pesa platform settings saved');
    }
  };

  const handleTest = async () => {
    if (!config.consumer_key || !config.consumer_secret_encrypted) {
      toast.error('Please save credentials first');
      return;
    }
    setTesting(true);
    try {
      const { data, error } = await apiClient.functions.invoke('mpesa-test-connection', {
        body: {
          environment: config.environment,
          consumer_key: config.consumer_key,
          consumer_secret: config.consumer_secret_encrypted,
        },
      });

      const newStatus: IntegrationStatus = error || !data?.success ? 'connection_failed' : 'connected';
      setConfig(prev => ({ ...prev, status: newStatus, last_tested_at: new Date().toISOString() }));

      if (config.id) {
        await apiClient.functions.invoke('mpesa-save-platform-config', {
          body: { id: config.id, status: newStatus, last_tested_at: new Date().toISOString() },
        });
      }

      if (newStatus === 'connected') {
        toast.success('M-Pesa connection successful!');
      } else {
        toast.error(data?.error || 'M-Pesa connection failed. Check credentials.');
      }
    } catch {
      toast.error('Connection test failed');
    }
    setTesting(false);
  };

  const handleReset = async () => {
    if (!config.id) return;
    await apiClient.functions.invoke('mpesa-save-platform-config', {
      body: { id: config.id, delete: true },
    });
    setConfig(emptyConfig);
    setHasExisting(false);
    toast.success('M-Pesa credentials reset');
  };

  const handleToggle = async () => {
    const next = !config.is_enabled;
    setConfig(prev => ({ ...prev, is_enabled: next }));
    if (config.id) {
      await apiClient.functions.invoke('mpesa-save-platform-config', {
        body: { id: config.id, is_enabled: next },
      });
    }
  };

  const toggleSecret = (field: string) => setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));

  const statusConfig: Record<IntegrationStatus, { label: string; icon: any; color: string }> = {
    not_configured: { label: 'Not Configured', icon: AlertCircle, color: 'text-muted-foreground' },
    connected: { label: 'Connected', icon: CheckCircle2, color: 'text-[hsl(145,63%,50%)]' },
    connection_failed: { label: 'Connection Failed', icon: XCircle, color: 'text-red-400' },
    disabled: { label: 'Disabled', icon: WifiOff, color: 'text-yellow-400' },
  };
  const currentStatus = statusConfig[config.status] || statusConfig.not_configured;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
      <PageHeader title="M-Pesa Config" />
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(145,63%,42%)]";

  const renderSecretField = (label: string, field: keyof MpesaConfig, required?: boolean) => (
    <div key={field}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5 capitalize">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <input
          type={showSecrets[field] ? 'text' : 'password'}
          value={config[field] as string}
          onChange={e => setConfig(prev => ({ ...prev, [field]: e.target.value }))}
          className={`${inputClass} pr-10`}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        <button type="button" onClick={() => toggleSecret(field)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {showSecrets[field] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  const renderTextField = (label: string, field: keyof MpesaConfig, required?: boolean, placeholder?: string) => (
    <div key={field}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5 capitalize">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type="text"
        value={config[field] as string}
        onChange={e => setConfig(prev => ({ ...prev, [field]: e.target.value }))}
        className={inputClass}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
      />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:px-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <Smartphone size={24} className="text-[hsl(145,63%,50%)]" />
              </div>
      <p className="text-sm text-muted-foreground">
        Configure M-Pesa for license/subscription payments. Clients will be able to pay via M-Pesa STK Push when upgrading their plan.
      </p>

      {/* Status + Toggle */}
      <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <currentStatus.icon size={22} className={currentStatus.color} />
          <div>
            <p className={`font-semibold text-sm ${currentStatus.color}`}>{currentStatus.label}</p>
            {config.last_tested_at && (
              <p className="text-xs text-muted-foreground">Last tested: {new Date(config.last_tested_at).toLocaleString()}</p>
            )}
          </div>
        </div>
        <button onClick={handleToggle} className={`relative inline-flex items-center w-12 h-7 rounded-full transition-colors shrink-0 ${config.is_enabled ? 'bg-primary text-primary-foreground' : 'bg-[hsl(220,15%,30%)]'}`}>
          <span className={`inline-block w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${config.is_enabled ? 'translate-x-[26px]' : 'translate-x-[3px]'}`} />
        </button>
      </div>

      {/* Environment */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 capitalize">Environment</h3>
        <div className="flex gap-3">
          {(['sandbox', 'production'] as const).map(env => (
            <button key={env} onClick={() => setConfig(prev => ({ ...prev, environment: env }))}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                config.environment === env ? 'bg-primary text-primary-foreground text-foreground' : 'bg-background text-muted-foreground hover:text-foreground'
              }`}>
              {env}
            </button>
          ))}
        </div>
      </div>

      {/* Credentials */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground capitalize">API Credentials</h3>
        {renderTextField('Consumer Key', 'consumer_key', true)}
        {renderSecretField('Consumer Secret', 'consumer_secret_encrypted', true)}
        {renderTextField('Shortcode / Business Short Code', 'shortcode', true)}
        {renderSecretField('Passkey', 'passkey_encrypted', true)}
      </div>

      {/* URLs */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground capitalize">URLs</h3>
        {renderTextField('Callback URL', 'callback_url', false, 'https://your-domain.com/api/mpesa/callback')}
        {renderTextField('Confirmation URL', 'confirmation_url', false, 'Optional')}
        {renderTextField('Validation URL', 'validation_url', false, 'Optional')}
      </div>

      {/* Optional */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground capitalize">Optional Settings</h3>
        {renderTextField('Initiator Name', 'initiator_name', false, 'Optional')}
        {renderSecretField('Security Credential', 'security_credential_encrypted')}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity capitalize">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Settings
        </button>
        <div className="flex gap-3">
          <button onClick={handleTest} disabled={testing || !hasExisting}
            className="flex-1 py-2.5 rounded-xl bg-background border border-input text-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-muted/80 capitalize">
            {testing ? <Loader2 size={16} className="animate-spin" /> : <TestTube size={16} />}
            Test Connection
          </button>
          <button onClick={handleReset} disabled={!hasExisting}
            className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-red-500/15 capitalize">
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
