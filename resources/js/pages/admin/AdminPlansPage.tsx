import PageHeader from '@/components/PageHeader';
import { useEffect, useState } from 'react';
import { api as apiClient } from '@/api';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { ALL_FEATURES } from '@/lib/features';
import type { FeatureKey } from '@/lib/features';

export default function AdminPlansPage() {
  const { isSuperOwner } = useAdmin();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', monthly_price: '', yearly_price: '', max_users: '2', max_devices: '1', max_stores: '1', storage_limit: '1',
    features_enabled: {} as Record<string, boolean>,
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data } = await apiClient.from('plans').select('*').order('monthly_price', { ascending: true });
    setPlans(data || []);
    setLoading(false);
  };

  const openEdit = (plan: any) => {
    setEditing(plan);
    // Parse features_enabled from plan - could be in 'features' field as array or features_enabled as object
    let featuresObj: Record<string, boolean> = {};
    if (plan.features && typeof plan.features === 'object' && !Array.isArray(plan.features)) {
      featuresObj = plan.features;
    } else if (Array.isArray(plan.features)) {
      // Convert legacy array format to object
      plan.features.forEach((f: string) => { featuresObj[f] = true; });
    }
    setForm({
      name: plan.name,
      monthly_price: String(plan.monthly_price),
      yearly_price: String(plan.yearly_price),
      max_users: String(plan.max_users),
      max_devices: String(plan.max_devices),
      max_stores: String(plan.max_stores),
      storage_limit: String(plan.storage_limit),
      features_enabled: featuresObj,
    });
    setShowForm(true);
  };

  const toggleFeature = (key: string) => {
    setForm(prev => ({
      ...prev,
      features_enabled: {
        ...prev.features_enabled,
        [key]: !prev.features_enabled[key],
      },
    }));
  };

  const enableAllFeatures = () => {
    const all: Record<string, boolean> = {};
    ALL_FEATURES.forEach(f => { all[f.key] = true; });
    setForm(prev => ({ ...prev, features_enabled: all }));
  };

  const disableAllFeatures = () => {
    setForm(prev => ({ ...prev, features_enabled: {} }));
  };

  const savePlan = async () => {
    const payload = {
      name: form.name,
      monthly_price: parseFloat(form.monthly_price),
      yearly_price: parseFloat(form.yearly_price),
      max_users: parseInt(form.max_users),
      max_devices: parseInt(form.max_devices),
      max_stores: parseInt(form.max_stores),
      storage_limit: parseInt(form.storage_limit),
      features: form.features_enabled,
    };

    if (editing) {
      // Show warning that changes affect all current subscribers
      const confirmed = confirm(
        `⚠️ Warning: Updating the "${editing.name}" plan will immediately affect ALL stores and users currently subscribed to this plan.\n\nChanges to features, device limits, store limits, and user limits will take effect immediately.\n\nAre you sure you want to proceed?`
      );
      if (!confirmed) return;

      const { error } = await apiClient.from('plans').update(payload as any).eq('id', editing.id);
      if (error) toast.error('Failed to update plan'); else toast.success('Plan updated — changes apply to all subscribers immediately');
    } else {
      const { error } = await apiClient.from('plans').insert(payload as any);
      if (error) toast.error('Failed to create plan'); else toast.success('Plan created');
    }
    setShowForm(false);
    setEditing(null);
    resetForm();
    loadData();
  };

  const resetForm = () => {
    setForm({ name: '', monthly_price: '', yearly_price: '', max_users: '2', max_devices: '1', max_stores: '1', storage_limit: '1', features_enabled: {} });
  };

  const deletePlan = async (id: string) => {
    if (!isSuperOwner) { toast.error('Only Super Owners can delete plans'); return; }
    if (!confirm('Delete this plan?')) return;
    await apiClient.from('plans').update({ is_active: false } as any).eq('id', id);
    toast.success('Plan deactivated');
    loadData();
  };

  const getEnabledCount = (plan: any) => {
    const features = plan.features;
    if (!features || typeof features !== 'object') return 0;
    if (Array.isArray(features)) return features.length;
    return Object.values(features).filter(Boolean).length;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:px-8 space-y-6 max-w-7xl mx-auto w-full">
      <PageHeader title="Subscription Plans" />
      <div className="flex items-center justify-between">
                <button onClick={() => { setEditing(null); resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-foreground text-sm font-medium hover:opacity-90">
          <Plus size={16} /> Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.filter((p: any) => p.is_active).map((plan: any) => (
          <div key={plan.id} className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground capitalize">{plan.name}</h3>
                <p className="text-primary text-2xl font-bold mt-1">${plan.monthly_price}<span className="text-sm text-muted-foreground">/mo</span></p>
                <p className="text-sm text-muted-foreground">${plan.yearly_price}/year</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(plan)} className="p-1.5 rounded hover:bg-muted/80 text-muted-foreground"><Edit2 size={16} /></button>
                {isSuperOwner && <button onClick={() => deletePlan(plan.id)} className="p-1.5 rounded hover:bg-red-500/10 text-red-400"><Trash2 size={16} /></button>}
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>{plan.max_users} users · {plan.max_devices} devices · {plan.max_stores} store{plan.max_stores > 1 ? 's' : ''}</p>
              <p>{plan.storage_limit} GB storage</p>
              <p className="text-xs mt-1">{getEnabledCount(plan)} of {ALL_FEATURES.length} features enabled</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {ALL_FEATURES.map(f => {
                  const features = plan.features;
                  const enabled = features && typeof features === 'object' && !Array.isArray(features)
                    ? features[f.key] === true
                    : Array.isArray(features) && features.includes(f.key);
                  return (
                    <span key={f.key} className={`px-2 py-0.5 rounded text-xs ${enabled ? 'bg-primary text-primary-foreground/15 text-primary' : 'bg-muted text-muted-foreground line-through'}`}>
                      {f.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-2xl sm:rounded-3xl border border-border max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-foreground mb-4 capitalize">{editing ? 'Edit Plan' : 'Create Plan'}</h2>
            <div className="space-y-3">
              {[
                { label: 'Plan Name', key: 'name', type: 'text' },
                { label: 'Monthly Price ($)', key: 'monthly_price', type: 'number' },
                { label: 'Yearly Price ($)', key: 'yearly_price', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-sm text-muted-foreground mb-1 block capitalize">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground text-sm" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Max Users', key: 'max_users' },
                  { label: 'Max Devices', key: 'max_devices' },
                  { label: 'Max Stores', key: 'max_stores' },
                  { label: 'Storage (GB)', key: 'storage_limit' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-sm text-muted-foreground mb-1 block capitalize">{f.label}</label>
                    <input type="number" value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground text-sm" />
                  </div>
                ))}
              </div>

              {/* Feature Toggles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-muted-foreground capitalize">Feature Permissions</label>
                  <div className="flex gap-2">
                    <button onClick={enableAllFeatures} className="text-xs text-primary hover:underline capitalize">Enable All</button>
                    <button onClick={disableAllFeatures} className="text-xs text-red-400 hover:underline capitalize">Disable All</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto bg-[hsl(220,20%,12%)] rounded-lg p-3">
                  {ALL_FEATURES.map(f => {
                    const enabled = form.features_enabled[f.key] === true;
                    return (
                      <button
                        key={f.key}
                        onClick={() => toggleFeature(f.key)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                          enabled
                            ? 'bg-primary text-primary-foreground/10 text-primary'
                            : 'text-[hsl(220,10%,45%)] hover:bg-[hsl(220,15%,18%)]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                          enabled ? 'bg-primary text-primary-foreground' : 'border border-input'
                        }`}>
                          {enabled && <Check size={14} className="text-foreground" />}
                        </div>
                        <span>{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg bg-muted text-foreground">Cancel</button>
              <button onClick={savePlan} disabled={!form.name} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-foreground hover:opacity-90 disabled:opacity-50 capitalize">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
