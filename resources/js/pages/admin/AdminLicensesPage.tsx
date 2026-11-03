import PageHeader from '@/components/PageHeader';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { api as apiClient } from '@/api';
import { useAdmin } from '@/context/AdminContext';
import { toast } from 'sonner';
import { Plus, Search, RefreshCw, Users, Store } from 'lucide-react';
import { format, addDays, addMonths, addYears, differenceInDays } from 'date-fns';
import { SearchableSelect } from '@/components/ui/searchable-select';

export default function AdminLicensesPage() {
  const { admin } = useAdmin();
  const [licenses, setLicenses] = useState<any[]>([]);
  const [allStores, setAllStores] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showExtend, setShowExtend] = useState<any>(null);
  const [showChangePlan, setShowChangePlan] = useState<any>(null);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [form, setForm] = useState({ owner_user_id: '', plan_id: '', duration: '30' });

  // Extend modal state
  const [extendMode, setExtendMode] = useState<'duration' | 'exact'>('duration');
  const [extendDays, setExtendDays] = useState('0');
  const [extendMonths, setExtendMonths] = useState('0');
  const [extendYears, setExtendYears] = useState('0');
  const [extendExactDate, setExtendExactDate] = useState('');
  const [extendStartFrom, setExtendStartFrom] = useState<'expiry' | 'today' | 'custom'>('expiry');
  const [extendCustomStart, setExtendCustomStart] = useState('');

  // Change plan modal state
  const [changePlanId, setChangePlanId] = useState('');
  const [changePlanExpiryMode, setChangePlanExpiryMode] = useState<'default' | 'custom_duration' | 'custom_date'>('default');
  const [changePlanDays, setChangePlanDays] = useState('0');
  const [changePlanMonths, setChangePlanMonths] = useState('1');
  const [changePlanYears, setChangePlanYears] = useState('0');
  const [changePlanExactDate, setChangePlanExactDate] = useState('');

  const loadData = useCallback(async () => {
    const [{ data: lic }, { data: st }, { data: pl }, { data: prof }] = await Promise.all([
      apiClient.from('licenses').select('*, plans(name)').order('created_at', { ascending: false }),
      apiClient.from('stores').select('id, store_name, owner_user_id'),
      apiClient.from('plans').select('*').eq('is_active', true),
      apiClient.from('profiles').select('id, email, full_name'),
    ]);
    setLicenses(lic || []);
    setAllStores(st || []);
    setPlans(pl || []);
    setProfiles(prof || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const generateKey = () => `ZHP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Helper: get owner profile for a license
  const getOwnerProfile = (lic: any) => {
    return profiles.find((p: any) => p.id === lic.owner_user_id);
  };

  // Helper: get stores owned by a license's owner
  const getOwnerStores = (lic: any) => {
    return allStores.filter((s: any) => s.owner_user_id === lic.owner_user_id);
  };

  // Helper: get unique owners who don't have a license yet
  const ownersWithoutLicense = useMemo(() => {
    const licensedOwnerIds = new Set(licenses.map((l: any) => l.owner_user_id));
    // Only show owners who actually have stores
    const ownerIdsWithStores = new Set(allStores.map((s: any) => s.owner_user_id));
    return profiles.filter((p: any) => !licensedOwnerIds.has(p.id) && ownerIdsWithStores.has(p.id));
  }, [licenses, profiles, allStores]);

  // All owners (for create license, including those with stores)
  const allOwners = useMemo(() => {
    const ownerIdsWithStores = new Set(allStores.map((s: any) => s.owner_user_id));
    return profiles.filter((p: any) => ownerIdsWithStores.has(p.id));
  }, [profiles, allStores]);

  const createLicense = async () => {
    if (!form.owner_user_id || !form.plan_id) {
      toast.error('Owner and plan are required');
      return;
    }

    const plan = plans.find((p: any) => p.id === form.plan_id);
    const durationDays = parseInt(form.duration, 10) || 30;
    const startDate = new Date().toISOString().split('T')[0];
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + durationDays);
    const expiryDate = expiry.toISOString().split('T')[0];

    // Check if owner already has a license
    const existingLicense = licenses.find((l: any) => l.owner_user_id === form.owner_user_id);

    const licensePatch = {
      plan_id: form.plan_id,
      start_date: startDate,
      expiry_date: expiryDate,
      status: 'active',
      max_users: plan?.max_users || 2,
      max_devices: plan?.max_devices || 1,
      features_enabled: plan?.features || {},
    };

    if (existingLicense) {
      // Update existing owner license
      const { error } = await apiClient.from('licenses').update(licensePatch as any).eq('id', existingLicense.id);
      if (error) {
        toast.error('Failed to update owner license');
        return;
      }
      // Also update subscription
      await apiClient.from('subscriptions').update({
        plan_id: form.plan_id,
        start_date: startDate,
        end_date: expiryDate,
        status: 'active',
      } as any).eq('owner_user_id', form.owner_user_id);

      toast.success('Owner license updated');
    } else {
      // Create new owner license
      const { error: licErr } = await apiClient.from('licenses').insert({
        owner_user_id: form.owner_user_id,
        license_key: generateKey(),
        ...licensePatch,
      } as any);

      if (licErr) {
        toast.error('Failed to create license');
        return;
      }

      // Create subscription too
      await apiClient.from('subscriptions').insert({
        owner_user_id: form.owner_user_id,
        plan_id: form.plan_id,
        start_date: startDate,
        end_date: expiryDate,
        billing_cycle: 'monthly',
        status: 'active',
      } as any);

      toast.success('Owner license created');
    }

    setShowCreate(false);
    loadData();
  };

  const updateStatus = async (id: string, status: string) => {
    const targetLicense = licenses.find((l: any) => l.id === id);
    if (!targetLicense) {
      toast.error('License not found');
      return;
    }

    const [{ error: licenseError }, { error: subError }] = await Promise.all([
      apiClient.from('licenses').update({ status } as any).eq('id', id),
      apiClient.from('subscriptions').update({ status } as any).eq('owner_user_id', targetLicense.owner_user_id),
    ]);

    if (licenseError || subError) {
      toast.error('Failed');
    } else {
      toast.success(`Owner license ${status}`);
      loadData();
    }
  };

  // === EXTEND LICENSE (IMMEDIATE) ===
  const computeExtendPreview = useMemo(() => {
    if (!showExtend) return null;
    const currentExpiry = showExtend.expiry_date;

    if (extendMode === 'exact') {
      if (!extendExactDate) return null;
      return {
        currentExpiry,
        newExpiry: extendExactDate,
        durationLabel: `${differenceInDays(new Date(extendExactDate), new Date(currentExpiry))} days from current expiry`,
      };
    }

    let startDate: Date;
    if (extendStartFrom === 'today') startDate = new Date();
    else if (extendStartFrom === 'custom' && extendCustomStart) startDate = new Date(extendCustomStart);
    else startDate = new Date(currentExpiry);

    let result = startDate;
    const d = parseInt(extendDays) || 0;
    const m = parseInt(extendMonths) || 0;
    const y = parseInt(extendYears) || 0;
    if (d === 0 && m === 0 && y === 0) return null;

    if (y > 0) result = addYears(result, y);
    if (m > 0) result = addMonths(result, m);
    if (d > 0) result = addDays(result, d);

    const parts: string[] = [];
    if (y > 0) parts.push(`${y} year${y > 1 ? 's' : ''}`);
    if (m > 0) parts.push(`${m} month${m > 1 ? 's' : ''}`);
    if (d > 0) parts.push(`${d} day${d > 1 ? 's' : ''}`);

    return {
      currentExpiry,
      newExpiry: format(result, 'yyyy-MM-dd'),
      durationLabel: parts.join(', '),
      startFrom: extendStartFrom === 'today' ? 'today' : extendStartFrom === 'custom' ? extendCustomStart : 'current expiry',
    };
  }, [showExtend, extendMode, extendDays, extendMonths, extendYears, extendExactDate, extendStartFrom, extendCustomStart]);

  const extendLicense = async () => {
    if (!showExtend || !admin || !computeExtendPreview) return;
    const { currentExpiry, newExpiry } = computeExtendPreview;

    if (new Date(newExpiry) <= new Date(currentExpiry) && extendMode === 'exact') {
      toast.error('New expiry date must be after current expiry date');
      return;
    }

    try {
      const [{ error: updateLicenseErr }, { error: updateSubErr }] = await Promise.all([
        apiClient.from('licenses')
          .update({ expiry_date: newExpiry, status: 'active' } as any)
          .eq('id', showExtend.id),
        apiClient.from('subscriptions')
          .update({ end_date: newExpiry, status: 'active' } as any)
          .eq('owner_user_id', showExtend.owner_user_id),
      ]);

      if (updateLicenseErr || updateSubErr) {
        toast.error(`Failed to extend license: ${updateLicenseErr?.message || updateSubErr?.message}`);
        return;
      }

      await apiClient.from('license_extension_logs').insert({
        store_id: getOwnerStores(showExtend)[0]?.id || showExtend.store_id || '00000000-0000-0000-0000-000000000000',
        admin_id: admin.id,
        action: 'extension_applied',
        old_expiry_date: currentExpiry,
        new_expiry_date: newExpiry,
      } as any);

      toast.success(`License extended to ${newExpiry}`);
      setShowExtend(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to extend license');
    }
  };

  // === CHANGE PLAN ===
  const computeChangePlanPreview = useMemo(() => {
    if (!showChangePlan || !changePlanId) return null;
    const newPlan = plans.find((p: any) => p.id === changePlanId);
    if (!newPlan) return null;

    let newExpiry: string;
    if (changePlanExpiryMode === 'custom_date') {
      newExpiry = changePlanExactDate || showChangePlan.expiry_date;
    } else if (changePlanExpiryMode === 'custom_duration') {
      let result = new Date();
      const d = parseInt(changePlanDays) || 0;
      const m = parseInt(changePlanMonths) || 0;
      const y = parseInt(changePlanYears) || 0;
      if (y > 0) result = addYears(result, y);
      if (m > 0) result = addMonths(result, m);
      if (d > 0) result = addDays(result, d);
      newExpiry = format(result, 'yyyy-MM-dd');
    } else {
      newExpiry = format(addDays(new Date(), 30), 'yyyy-MM-dd');
    }

    const ownerProfile = getOwnerProfile(showChangePlan);

    return {
      currentPlan: showChangePlan.plans?.name || '—',
      newPlan: newPlan.name,
      currentExpiry: showChangePlan.expiry_date,
      newExpiry,
      owner: ownerProfile?.full_name || ownerProfile?.email || '—',
    };
  }, [showChangePlan, changePlanId, changePlanExpiryMode, changePlanDays, changePlanMonths, changePlanYears, changePlanExactDate, plans, profiles]);

  const changePlan = async () => {
    if (!showChangePlan || !changePlanId || !admin || !computeChangePlanPreview) return;
    const newPlan = plans.find((p: any) => p.id === changePlanId);
    if (!newPlan) return;

    const [{ error: licenseError }, { error: subError }] = await Promise.all([
      apiClient.from('licenses').update({
        plan_id: changePlanId,
        max_users: newPlan.max_users,
        max_devices: newPlan.max_devices,
        features_enabled: newPlan.features || {},
        expiry_date: computeChangePlanPreview.newExpiry,
        status: 'active',
      } as any).eq('id', showChangePlan.id),
      apiClient.from('subscriptions').update({
        plan_id: changePlanId,
        end_date: computeChangePlanPreview.newExpiry,
        status: 'active',
      } as any).eq('owner_user_id', showChangePlan.owner_user_id),
    ]);

    if (licenseError || subError) {
      toast.error('Failed to change owner plan');
    } else {
      await apiClient.from('audit_logs').insert({
        admin_user_id: admin.id,
        action: 'license_plan_changed',
        entity_type: 'license',
        entity_id: showChangePlan.id,
        details: {
          old_plan_id: showChangePlan.plan_id,
          new_plan_id: changePlanId,
          owner_user_id: showChangePlan.owner_user_id,
          new_expiry: computeChangePlanPreview.newExpiry,
        },
      } as any);
      toast.success(`Plan changed to ${newPlan.name}`);
      setShowChangePlan(null);
      loadData();
    }
  };

  const filtered = licenses.filter((l: any) => {
    const owner = getOwnerProfile(l);
    const searchLower = search.toLowerCase();
    return (
      l.license_key?.toLowerCase().includes(searchLower) ||
      owner?.email?.toLowerCase().includes(searchLower) ||
      owner?.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    suspended: 'bg-yellow-500/20 text-yellow-400',
    expired: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-gray-500/20 text-gray-400',
  };

  const inputClass = "w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(145,63%,42%)]";
  const labelClass = "text-sm text-muted-foreground mb-1 block";
  const radioClass = "flex items-center gap-2 cursor-pointer text-sm";

  const openExtendModal = (lic: any) => {
    setShowExtend(lic);
    setExtendMode('duration');
    setExtendDays('30');
    setExtendMonths('0');
    setExtendYears('0');
    setExtendExactDate('');
    setExtendStartFrom('expiry');
    setExtendCustomStart('');
  };

  const openChangePlanModal = (lic: any) => {
    setShowChangePlan(lic);
    setChangePlanId(lic.plan_id || '');
    setChangePlanExpiryMode('default');
    setChangePlanDays('0');
    setChangePlanMonths('1');
    setChangePlanYears('0');
    setChangePlanExactDate('');
  };

  if (loading) return <div className="flex items-center justify-center h-64">
      <PageHeader title="Licenses & Plans" /><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:px-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-foreground text-sm font-medium hover:opacity-90">
          <Plus size={16} /> Create License
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by owner name or email..." className="w-full pl-10 pr-4 py-2 rounded-lg bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(145,63%,42%)]" />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['License Key', 'Owner', 'Email', 'Plan', 'Start', 'Expiry', 'Days Left', 'Stores', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground  capitalize">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((lic: any) => {
              const daysLeft = differenceInDays(new Date(lic.expiry_date), new Date());
              const owner = getOwnerProfile(lic);
              const ownerStores = getOwnerStores(lic);
              return (
                <tr key={lic.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-4 text-sm text-foreground font-mono">{lic.license_key}</td>
                  <td className="py-3 px-4 text-sm text-foreground">{owner?.full_name || '—'}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{owner?.email || '—'}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{lic.plans?.name || '—'}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{lic.start_date}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{lic.expiry_date}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={daysLeft <= 0 ? 'text-red-400' : daysLeft <= 7 ? 'text-yellow-400' : 'text-green-400'}>
                      {daysLeft <= 0 ? 'Expired' : `${daysLeft}d`}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setShowDetail(lic)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Store size={14} />
                      <span>{ownerStores.length}</span>
                    </button>
                  </td>
                  <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[lic.status]}`}>{lic.status}</span></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1 flex-wrap">
                      {lic.status !== 'active' && <button onClick={() => updateStatus(lic.id, 'active')} className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20">Activate</button>}
                      {lic.status === 'active' && <button onClick={() => updateStatus(lic.id, 'suspended')} className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20">Suspend</button>}
                      <button onClick={() => openChangePlanModal(lic)} className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 flex items-center gap-1">
                        <RefreshCw size={10} /> Plan
                      </button>
                      <button onClick={() => openExtendModal(lic)} className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">Extend</button>
                      <button onClick={() => updateStatus(lic.id, 'cancelled')} className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">Cancel</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">No licenses found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Owner Stores Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowDetail(null)}>
          <div className="bg-card rounded-2xl sm:rounded-3xl border border-border max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-foreground mb-2 capitalize">Owner License Details</h2>
            {(() => {
              const owner = getOwnerProfile(showDetail);
              const ownerStores = getOwnerStores(showDetail);
              return (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="text-foreground">{owner?.full_name || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-foreground">{owner?.email || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">License Key</span><span className="text-foreground font-mono text-xs">{showDetail.license_key}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="text-foreground">{showDetail.plans?.name || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[showDetail.status]}`}>{showDetail.status}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Expiry</span><span className="text-foreground">{showDetail.expiry_date}</span></div>
                  <hr className="border-border" />
                  <div>
                    <p className="text-muted-foreground mb-2 flex items-center gap-1"><Store size={14} /> Linked Stores ({ownerStores.length})</p>
                    {ownerStores.length === 0 ? (
                      <p className="text-muted-foreground text-xs">No stores yet</p>
                    ) : (
                      <div className="space-y-1">
                        {ownerStores.map((s: any) => (
                          <div key={s.id} className="flex items-center gap-2 bg-[hsl(220,15%,18%)] rounded-lg px-3 py-2">
                            <Store size={12} className="text-primary" />
                            <span className="text-foreground text-xs">{s.store_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
            <button onClick={() => setShowDetail(null)} className="mt-6 w-full py-2.5 rounded-lg bg-muted text-foreground hover:bg-accent transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* Create License Modal — Owner-based */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowCreate(false)}>
          <div className="bg-card rounded-2xl sm:rounded-3xl border border-border max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-foreground mb-4 capitalize">Create Owner License</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Owner Account</label>
                <SearchableSelect 
                  value={form.owner_user_id} 
                  onChange={val => setForm({ ...form, owner_user_id: val })}
                  options={allOwners.map((p: any) => {
                    const hasLicense = licenses.some((l: any) => l.owner_user_id === p.id);
                    return {
                      value: p.id,
                      label: `${p.full_name || p.email} (${p.email})`,
                      subLabel: hasLicense ? 'Has active license' : undefined
                    };
                  })}
                  placeholder="Select owner..."
                  searchPlaceholder="Search owner by name or email..."
                  required
                />
                {form.owner_user_id && (() => {
                  const ownerStores = allStores.filter((s: any) => s.owner_user_id === form.owner_user_id);
                  return (
                    <p className="text-xs text-muted-foreground mt-1">
                      This owner has {ownerStores.length} store{ownerStores.length !== 1 ? 's' : ''}: {ownerStores.map((s: any) => s.store_name).join(', ') || 'none'}
                    </p>
                  );
                })()}
              </div>
              <div>
                <label className={labelClass}>Plan</label>
                <SearchableSelect 
                  value={form.plan_id} 
                  onChange={val => setForm({ ...form, plan_id: val })}
                  options={plans.map((p: any) => ({
                    value: p.id,
                    label: p.name,
                    subLabel: `$${p.monthly_price}/mo`
                  }))}
                  placeholder="Select plan..."
                  searchPlaceholder="Search plan..."
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Duration (days)</label>
                <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-lg bg-muted text-foreground hover:bg-accent">Cancel</button>
              <button onClick={createLicense} disabled={!form.owner_user_id || !form.plan_id} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-foreground hover:opacity-90 disabled:opacity-50 capitalize">
                {licenses.some((l: any) => l.owner_user_id === form.owner_user_id) ? 'Update License' : 'Create License'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend License Modal */}
      {showExtend && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowExtend(null)}>
          <div className="bg-card rounded-2xl sm:rounded-3xl border border-border max-w-md w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-foreground mb-2 capitalize">Extend Owner License</h2>
            <p className="text-sm text-muted-foreground mb-1">Owner: <span className="text-foreground">{getOwnerProfile(showExtend)?.full_name || getOwnerProfile(showExtend)?.email || '—'}</span></p>
            <p className="text-sm text-muted-foreground mb-1">Stores: <span className="text-foreground">{getOwnerStores(showExtend).length}</span></p>
            <p className="text-sm text-muted-foreground mb-4">Current expiry: <span className="text-foreground">{showExtend.expiry_date}</span></p>

            <div className="space-y-3 mb-4">
              <label className={labelClass}>Extension Method</label>
              <div className="flex gap-3">
                <label className={radioClass}>
                  <input type="radio" name="extendMode" checked={extendMode === 'duration'} onChange={() => setExtendMode('duration')} className="accent-[hsl(145,63%,42%)]" />
                  <span className="text-[hsl(220,10%,70%)]">By Duration</span>
                </label>
                <label className={radioClass}>
                  <input type="radio" name="extendMode" checked={extendMode === 'exact'} onChange={() => setExtendMode('exact')} className="accent-[hsl(145,63%,42%)]" />
                  <span className="text-[hsl(220,10%,70%)]">Exact Date</span>
                </label>
              </div>
            </div>

            {extendMode === 'duration' ? (
              <>
                <div className="space-y-2 mb-4">
                  <label className={labelClass}>Start From</label>
                  <div className="flex flex-wrap gap-2">
                    {(['expiry', 'today', 'custom'] as const).map(opt => (
                      <label key={opt} className={radioClass}>
                        <input type="radio" name="startFrom" checked={extendStartFrom === opt} onChange={() => setExtendStartFrom(opt)} className="accent-[hsl(145,63%,42%)]" />
                        <span className="text-[hsl(220,10%,70%)] capitalize">{opt === 'expiry' ? 'Current Expiry' : opt === 'today' ? 'Today' : 'Custom Date'}</span>
                      </label>
                    ))}
                  </div>
                  {extendStartFrom === 'custom' && (
                    <input type="date" value={extendCustomStart} onChange={e => setExtendCustomStart(e.target.value)} className={inputClass} />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div><label className={labelClass}>Days</label><input type="number" min="0" value={extendDays} onChange={e => setExtendDays(e.target.value)} className={inputClass} /></div>
                  <div><label className={labelClass}>Months</label><input type="number" min="0" value={extendMonths} onChange={e => setExtendMonths(e.target.value)} className={inputClass} /></div>
                  <div><label className={labelClass}>Years</label><input type="number" min="0" value={extendYears} onChange={e => setExtendYears(e.target.value)} className={inputClass} /></div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { label: '1 day', d: '1', m: '0', y: '0' },
                    { label: '7 days', d: '7', m: '0', y: '0' },
                    { label: '30 days', d: '30', m: '0', y: '0' },
                    { label: '3 months', d: '0', m: '3', y: '0' },
                    { label: '6 months', d: '0', m: '6', y: '0' },
                    { label: '1 year', d: '0', m: '0', y: '1' },
                  ].map(p => (
                    <button key={p.label} onClick={() => { setExtendDays(p.d); setExtendMonths(p.m); setExtendYears(p.y); }}
                      className="px-3 py-1.5 rounded-lg text-xs bg-muted text-muted-foreground hover:bg-accent transition-colors">{p.label}</button>
                  ))}
                </div>
              </>
            ) : (
              <div className="mb-4">
                <label className={labelClass}>New Expiry Date</label>
                <input type="date" value={extendExactDate} onChange={e => setExtendExactDate(e.target.value)} className={inputClass} min={showExtend.expiry_date} />
              </div>
            )}

            {computeExtendPreview && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                <h4 className="text-xs font-semibold text-blue-400 mb-2  capitalize">Preview</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Current Expiry</span><span className="text-foreground">{computeExtendPreview.currentExpiry}</span></div>
                  {computeExtendPreview.startFrom && <div className="flex justify-between"><span className="text-muted-foreground">Start From</span><span className="text-foreground">{computeExtendPreview.startFrom}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">Extension</span><span className="text-foreground">{computeExtendPreview.durationLabel}</span></div>
                  <div className="flex justify-between border-t border-blue-500/20 pt-1 mt-1"><span className="text-blue-400 font-medium">New Expiry</span><span className="text-foreground font-bold">{computeExtendPreview.newExpiry}</span></div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowExtend(null)} className="flex-1 py-2.5 rounded-lg bg-muted text-foreground">Cancel</button>
              <button onClick={extendLicense} disabled={!computeExtendPreview} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-foreground hover:opacity-90 disabled:opacity-50 capitalize">Extend License</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {showChangePlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowChangePlan(null)}>
          <div className="bg-card rounded-2xl sm:rounded-3xl border border-border max-w-md w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-foreground mb-2 capitalize">Change Owner Plan</h2>
            <p className="text-sm text-muted-foreground mb-1">Owner: <span className="text-foreground">{getOwnerProfile(showChangePlan)?.full_name || getOwnerProfile(showChangePlan)?.email || '—'}</span></p>
            <p className="text-sm text-muted-foreground mb-1">Current Plan: <span className="text-foreground">{showChangePlan.plans?.name || '—'}</span></p>
            <p className="text-sm text-muted-foreground mb-4">Current Expiry: <span className="text-foreground">{showChangePlan.expiry_date}</span></p>

            <div className="mb-4">
              <label className={labelClass}>New Plan</label>
              <SearchableSelect 
                value={changePlanId} 
                onChange={setChangePlanId}
                options={plans.map((p: any) => ({
                  value: p.id,
                  label: `${p.name} ($${p.monthly_price}/mo)`,
                  subLabel: `${p.max_users} users, ${p.max_stores} stores`
                }))}
                placeholder="Select plan..."
                searchPlaceholder="Search plan..."
              />
            </div>

            <div className="space-y-3 mb-4">
              <label className={labelClass}>Expiry Date Setting</label>
              <div className="space-y-2">
                {([
                  { value: 'default', label: 'Default (30 days from today)' },
                  { value: 'custom_duration', label: 'Custom duration from today' },
                  { value: 'custom_date', label: 'Set exact expiry date' },
                ] as const).map(opt => (
                  <label key={opt.value} className={radioClass}>
                    <input type="radio" name="changePlanExpiry" checked={changePlanExpiryMode === opt.value} onChange={() => setChangePlanExpiryMode(opt.value)} className="accent-[hsl(145,63%,42%)]" />
                    <span className="text-[hsl(220,10%,70%)]">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {changePlanExpiryMode === 'custom_duration' && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div><label className={labelClass}>Days</label><input type="number" min="0" value={changePlanDays} onChange={e => setChangePlanDays(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Months</label><input type="number" min="0" value={changePlanMonths} onChange={e => setChangePlanMonths(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Years</label><input type="number" min="0" value={changePlanYears} onChange={e => setChangePlanYears(e.target.value)} className={inputClass} /></div>
              </div>
            )}

            {changePlanExpiryMode === 'custom_date' && (
              <div className="mb-4">
                <label className={labelClass}>Expiry Date</label>
                <input type="date" value={changePlanExactDate} onChange={e => setChangePlanExactDate(e.target.value)} className={inputClass} min={format(new Date(), 'yyyy-MM-dd')} />
              </div>
            )}

            {computeChangePlanPreview && changePlanId !== showChangePlan.plan_id && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-4">
                <h4 className="text-xs font-semibold text-purple-400 mb-2  capitalize">Preview</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="text-foreground">{computeChangePlanPreview.owner}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Current Plan</span><span className="text-foreground">{computeChangePlanPreview.currentPlan}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">New Plan</span><span className="text-purple-300 font-medium">{computeChangePlanPreview.newPlan}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Current Expiry</span><span className="text-foreground">{computeChangePlanPreview.currentExpiry}</span></div>
                  <div className="flex justify-between border-t border-purple-500/20 pt-1 mt-1"><span className="text-purple-400 font-medium">New Expiry</span><span className="text-foreground font-bold">{computeChangePlanPreview.newExpiry}</span></div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowChangePlan(null)} className="flex-1 py-2.5 rounded-lg bg-muted text-foreground">Cancel</button>
              <button onClick={changePlan} disabled={!changePlanId || changePlanId === showChangePlan.plan_id} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-foreground hover:opacity-90 disabled:opacity-50 capitalize">Change Plan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
