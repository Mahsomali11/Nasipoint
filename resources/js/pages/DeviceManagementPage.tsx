import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api as apiClient } from '@/api';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/PageHeader';
import { toast } from 'sonner';
import { Monitor, Smartphone, Tablet, Laptop, LogOut, Trash2, Globe, Clock, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDeviceId } from '@/lib/device';

export default function DeviceManagementPage() {
  const { user, licenseStatus } = useApp();
  const queryClient = useQueryClient();
  const currentDeviceId = getDeviceId();

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['device-sessions', user?.id],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from('device_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .order('last_login', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const logoutDevice = useMutation({
    mutationFn: async (deviceId: string) => {
      const { error } = await apiClient
        .from('device_sessions')
        .update({ status: 'logged_out' } as any)
        .eq('user_id', user!.id)
        .eq('device_id', deviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-sessions'] });
      toast.success('Device logged out successfully');
    },
  });

  const removeDevice = useMutation({
    mutationFn: async (deviceId: string) => {
      const { error } = await apiClient
        .from('device_sessions')
        .delete()
        .eq('user_id', user!.id)
        .eq('device_id', deviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-sessions'] });
      toast.success('Device removed successfully');
    },
  });

  const logoutAllOthers = useMutation({
    mutationFn: async () => {
      const { error } = await apiClient
        .from('device_sessions')
        .update({ status: 'logged_out' } as any)
        .eq('user_id', user!.id)
        .neq('device_id', currentDeviceId)
        .eq('status', 'active');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-sessions'] });
      toast.success('All other devices logged out');
    },
  });

  const getIcon = (type: string) => {
    if (type === 'mobile') return <Smartphone size={24} />;
    if (type === 'tablet') return <Tablet size={24} />;
    return <Monitor size={24} />;
  };

  const activeDevices = devices.filter((d: any) => d.status === 'active');
  const inactiveDevices = devices.filter((d: any) => d.status !== 'active');

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-12">
      <PageHeader title="Device Sessions" />
      <div className="px-4 py-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
        
        {/* Intro Section */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck size={32} className="text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground capitalize">Manage your devices</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              You are currently signed in to the devices below. For your security, log out of any devices you don't recognize or no longer use.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border bg-muted/10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 capitalize">
                Active Devices 
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs font-bold">
                  {activeDevices.length}{licenseStatus?.max_devices ? ` / ${licenseStatus.max_devices}` : ''}
                </span>
              </h3>
            </div>
            {activeDevices.length > 1 && (
              <button
                onClick={() => logoutAllOthers.mutate()}
                className="text-sm font-bold px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all shadow-sm w-full sm:w-auto"
              >
                Log out all other devices
              </button>
            )}
          </div>

          <div className="p-6">
            {licenseStatus?.max_devices && (
              <div className="mb-6">
                <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2">
                  <span>Device limit usage</span>
                  <span>{Math.round((activeDevices.length / licenseStatus.max_devices) * 100)}%</span>
                </div>
                <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary rounded-full h-full transition-all"
                    style={{ width: `${Math.min(100, (activeDevices.length / licenseStatus.max_devices) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-medium">Loading your devices...</p>
              </div>
            ) : activeDevices.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm font-semibold text-muted-foreground">No active devices found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeDevices.map((device: any) => (
                  <div
                    key={device.id}
                    className={`flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border transition-all ${
                      device.device_id === currentDeviceId
                        ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/10'
                        : 'border-border bg-background hover:border-foreground/20'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      device.device_id === currentDeviceId ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {getIcon(device.device_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-base font-bold text-foreground truncate">
                          {device.device_name || 'Unknown Device'}
                        </p>
                        {device.device_id === currentDeviceId && (
                          <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold  capitalize tracking-wider shrink-0">
                            Current Session
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground font-medium">
                        <span className="capitalize">{device.device_type}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1.5">
                          <Globe size={14} className="opacity-70" />
                          {device.ip_address || 'Unknown Location'}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="opacity-70" />
                          Last active {formatDistanceToNow(new Date(device.last_login), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    {device.device_id !== currentDeviceId && (
                      <div className="flex sm:flex-col lg:flex-row gap-2 shrink-0 mt-4 sm:mt-0">
                        <button
                          onClick={() => logoutDevice.mutate(device.device_id)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-background border border-border text-foreground font-bold text-sm hover:bg-accent transition-colors shadow-sm"
                        >
                          <LogOut size={16} /> Log Out
                        </button>
                        <button
                          onClick={() => removeDevice.mutate(device.device_id)}
                          className="flex items-center justify-center p-2 rounded-xl bg-background border border-border text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors shadow-sm"
                          title="Remove device"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inactive Devices */}
        {inactiveDevices.length > 0 && (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h3 className="text-base font-bold text-foreground mb-4 capitalize">
              Previous Devices <span className="text-muted-foreground font-medium text-sm">({inactiveDevices.length})</span>
            </h3>
            <div className="space-y-3">
              {inactiveDevices.map((device: any) => (
                <div key={device.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-border/50 bg-muted/20 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                    {getIcon(device.device_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{device.device_name || 'Unknown Device'}</p>
                    <p className="text-xs font-medium text-muted-foreground capitalize mt-0.5">
                      {device.device_type} • Status: {device.status.replace('_', ' ')}
                    </p>
                  </div>
                  <button
                    onClick={() => removeDevice.mutate(device.device_id)}
                    className="self-end sm:self-auto p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                    title="Remove device permanently"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
