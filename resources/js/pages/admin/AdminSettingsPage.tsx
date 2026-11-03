import PageHeader from '@/components/PageHeader';
import { useEffect, useState, useRef } from 'react';
import { api as apiClient } from '@/api';
import { toast } from 'sonner';
import { Save, Upload, X, Store, Globe, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { clearPlatformNameCache, updateBrandingCache, useSystemBranding } from '@/hooks/usePlatformName';

const BRANDING_KEYS = ['platform_name', 'system_logo', 'system_favicon'];

export default function AdminSettingsPage() {
  const { systemName: initialName, systemLogo: initialLogo, systemFavicon: initialFavicon } = useSystemBranding();

  const [systemName, setSystemName] = useState(initialName || 'Nasri Account System');
  const [savedSystemName, setSavedSystemName] = useState(initialName || 'Nasri Account System');
  const [systemLogo, setSystemLogo] = useState(initialLogo || '');
  const [systemFavicon, setSystemFavicon] = useState(initialFavicon || '');

  const [savingName, setSavingName] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [otherSettings, setOtherSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [edited, setEdited] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const getCsrfToken = () => {
    return decodeURIComponent(
      document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1] || ''
    );
  };

  const loadSettings = async () => {
    try {
      const [{ data: rows }, brandingRes] = await Promise.all([
        apiClient.from('system_settings').select('*').order('setting_key'),
        fetch('/api/system-branding', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);

      const allRows = rows || [];
      const nameRow = allRows.find((r: any) => r.setting_key === 'platform_name');
      const logoRow = allRows.find((r: any) => r.setting_key === 'system_logo');
      const favRow = allRows.find((r: any) => r.setting_key === 'system_favicon');

      const resolvedName = nameRow?.setting_value || brandingRes?.platform_name || initialName || 'Nasri Account System';
      const resolvedLogo = logoRow?.setting_value ?? brandingRes?.system_logo ?? initialLogo ?? '';
      const resolvedFavicon = favRow?.setting_value ?? brandingRes?.system_favicon ?? initialFavicon ?? '';

      setSystemName(resolvedName);
      setSavedSystemName(resolvedName);
      setSystemLogo(resolvedLogo);
      setSystemFavicon(resolvedFavicon);

      updateBrandingCache({
        platform_name: resolvedName,
        system_logo: resolvedLogo,
        system_favicon: resolvedFavicon,
      });

      setOtherSettings(allRows.filter((r: any) => !BRANDING_KEYS.includes(r.setting_key)));
    } finally {
      setLoading(false);
    }
  };

  const persistBranding = async (payload: Partial<{ platform_name: string; system_logo: string; system_favicon: string }>) => {
    const res = await fetch('/api/system-branding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': getCsrfToken(),
      },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to update branding settings');
    }

    const updated = await res.json();
    clearPlatformNameCache();
    updateBrandingCache(updated);
    return updated;
  };

  const handleSaveSystemName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = systemName.trim();
    if (!trimmed) {
      toast.error('System name cannot be empty');
      return;
    }

    setSavingName(true);
    try {
      const updated = await persistBranding({ platform_name: trimmed });
      setSystemName(updated.platform_name);
      setSavedSystemName(updated.platform_name);
      toast.success('System name updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update system name');
    } finally {
      setSavingName(false);
    }
  };

  const uploadBrandingFile = async (file: File): Promise<string> => {
    if (file.size > 350000) {
      throw new Error('Image size must not exceed 350KB.');
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'system-branding');

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'X-XSRF-TOKEN': getCsrfToken(),
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to upload image');
    }

    const { url } = await response.json();
    return url;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExts = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExts.includes(ext)) {
      toast.error('Logo must be a PNG, JPG, JPEG, WEBP, or SVG file.');
      return;
    }

    if (file.size > 350000) {
      toast.error('Image size must not exceed 350KB.');
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }

    setUploadingLogo(true);
    try {
      const url = await uploadBrandingFile(file);
      const updated = await persistBranding({ system_logo: url });
      setSystemLogo(updated.system_logo);
      toast.success('System logo updated across the application');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload system logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    setUploadingLogo(true);
    try {
      await persistBranding({ system_logo: '' });
      setSystemLogo('');
      toast.success('System logo removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove system logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExts = ['ico', 'png', 'svg', 'webp', 'jpg', 'jpeg'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExts.includes(ext)) {
      toast.error('Favicon must be an ICO, PNG, SVG, WEBP, or JPG file.');
      return;
    }

    if (file.size > 350000) {
      toast.error('Image size must not exceed 350KB.');
      if (faviconInputRef.current) faviconInputRef.current.value = '';
      return;
    }

    setUploadingFavicon(true);
    try {
      const url = await uploadBrandingFile(file);
      const updated = await persistBranding({ system_favicon: url });
      setSystemFavicon(updated.system_favicon);
      toast.success('Web icon (favicon) updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload favicon');
    } finally {
      setUploadingFavicon(false);
      if (faviconInputRef.current) faviconInputRef.current.value = '';
    }
  };

  const handleRemoveFavicon = async () => {
    setUploadingFavicon(true);
    try {
      await persistBranding({ system_favicon: '' });
      setSystemFavicon('');
      toast.success('Web icon (favicon) reset to default');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset favicon');
    } finally {
      setUploadingFavicon(false);
    }
  };

  const saveOtherSetting = async (id: string, key: string) => {
    if (!(key in edited)) return;
    const { error } = await apiClient.from('system_settings').update({ setting_value: edited[key] } as any).eq('id', id);
    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success(`${key} updated`);
      setOtherSettings(otherSettings.map((s: any) => (s.id === id ? { ...s, setting_value: edited[key] } : s)));
      const next = { ...edited };
      delete next[key];
      setEdited(next);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isNameChanged = systemName.trim() !== savedSystemName;

  return (
    <div className="p-4 sm:p-6 lg:px-8 space-y-8 max-w-5xl mx-auto w-full pb-16">
      <PageHeader title="System Settings" />

      {/* Section 1: System Name */}
      <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-border">
        <div className="w-full md:w-1/3 shrink-0">
          <h2 className="text-base font-bold text-foreground mb-2">System Name</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Set the official system name. Updating this immediately changes the brand name displayed across the sidebar, mobile header, and browser page titles.
          </p>
        </div>

        <div className="w-full md:w-2/3">
          <form onSubmit={handleSaveSystemName} className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Official System Name
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={systemName}
                  onChange={e => setSystemName(e.target.value)}
                  placeholder="e.g. Nasri Account System"
                  className="flex-1 px-4 h-11 rounded-xl bg-background border border-input text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  required
                />
                <button
                  type="submit"
                  disabled={savingName || !systemName.trim()}
                  className="h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                >
                  <Save size={16} />
                  <span>{savingName ? 'Saving...' : 'Save Name'}</span>
                </button>
              </div>
              <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                <CheckCircle2 size={14} className="text-primary shrink-0" />
                <span>
                  Active across layout &amp; headers: <strong className="text-foreground">{savedSystemName}</strong>
                  {isNameChanged && <span className="text-amber-500 ml-2">(Unsaved changes)</span>}
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Section 2: System Logo */}
      <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-border">
        <div className="w-full md:w-1/3 shrink-0">
          <h2 className="text-base font-bold text-foreground mb-2">System Logo</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Upload the official System Logo displayed in the main application sidebar, mobile top bar, and authentication headers.
          </p>
        </div>

        <div className="w-full md:w-2/3">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Logo Preview Box */}
              <div className="w-24 h-24 rounded-2xl bg-muted/40 border border-border flex items-center justify-center overflow-hidden relative shrink-0 shadow-inner">
                {systemLogo ? (
                  <img src={systemLogo} alt={savedSystemName} className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-md">
                    <Store size={24} className="text-primary-foreground" />
                  </div>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="space-y-3 flex-1">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    <Upload size={16} />
                    <span>{systemLogo ? 'Change System Logo' : 'Upload System Logo'}</span>
                  </button>

                  {systemLogo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      disabled={uploadingLogo}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-bold hover:bg-destructive/20 transition-all disabled:opacity-50"
                    >
                      <X size={16} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: Square or transparent PNG, SVG, WEBP, or JPG (Max 350KB).
                </p>
              </div>
            </div>

            {/* Live Sidebar Header Preview */}
            <div className="pt-4 border-t border-border">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Sidebar Header Preview
              </p>
              <div className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-background border border-border shadow-sm">
                {systemLogo ? (
                  <img src={systemLogo} alt={systemName} className="w-10 h-10 rounded-2xl object-contain bg-card border border-border p-1 shadow-sm shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                    <Store size={20} className="text-primary-foreground" />
                  </div>
                )}
                <div className="flex flex-col pr-2">
                  <span className="font-black text-lg tracking-tight text-foreground leading-none">
                    {systemName || 'Nasri Account System'}
                  </span>
                  <span className="text-[10px] font-bold text-primary capitalize tracking-widest mt-1 leading-none">
                    POS System
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Web Icon (Favicon) */}
      <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-border">
        <div className="w-full md:w-1/3 shrink-0">
          <h2 className="text-base font-bold text-foreground mb-2">Web Icon (Favicon)</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Upload the browser tab icon (favicon) displayed in browser tabs, bookmarks, and shortcuts across all pages.
          </p>
        </div>

        <div className="w-full md:w-2/3">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Favicon Preview Box */}
              <div className="w-20 h-20 rounded-2xl bg-muted/40 border border-border flex items-center justify-center overflow-hidden relative shrink-0 shadow-inner">
                {systemFavicon ? (
                  <img src={systemFavicon} alt="Favicon" className="w-10 h-10 object-contain" />
                ) : (
                  <Globe size={28} className="text-muted-foreground" />
                )}
                {uploadingFavicon && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="space-y-3 flex-1">
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept=".ico,image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/webp,image/jpeg"
                  onChange={handleFaviconUpload}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={uploadingFavicon}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    <ImageIcon size={16} />
                    <span>{systemFavicon ? 'Change Web Icon' : 'Upload Web Icon'}</span>
                  </button>

                  {systemFavicon && (
                    <button
                      type="button"
                      onClick={handleRemoveFavicon}
                      disabled={uploadingFavicon}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-bold hover:bg-destructive/20 transition-all disabled:opacity-50"
                    >
                      <X size={16} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: 32×32px or 64×64px ICO, PNG, or SVG file (Max 350KB).
                </p>
              </div>
            </div>

            {/* Browser Tab Mock Preview */}
            <div className="pt-4 border-t border-border">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Browser Tab Preview
              </p>
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-t-xl bg-muted/60 border border-border max-w-xs">
                {systemFavicon ? (
                  <img src={systemFavicon} alt="" className="w-4 h-4 object-contain shrink-0" />
                ) : (
                  <Globe size={14} className="text-muted-foreground shrink-0" />
                )}
                <span className="text-xs font-semibold text-foreground truncate">
                  Dashboard - {systemName || 'Nasri Account System'}
                </span>
                <span className="text-xs text-muted-foreground ml-2">×</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional System Settings (if any exist beyond branding) */}
      {otherSettings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground">Additional System Parameters</h2>
          <div className="bg-card rounded-2xl border border-border divide-y divide-border shadow-sm">
            {otherSettings.map((s: any) => (
              <div key={s.id} className="p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{s.setting_key.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
                <input
                  type="text"
                  value={s.setting_key in edited ? edited[s.setting_key] : s.setting_value}
                  onChange={e => setEdited({ ...edited, [s.setting_key]: e.target.value })}
                  className="w-64 px-3 py-2 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {s.setting_key in edited && (
                  <button
                    onClick={() => saveOtherSetting(s.id, s.setting_key)}
                    className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
                  >
                    <Save size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
