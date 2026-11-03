import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api as apiClient } from '@/api';
import { formatDistanceToNow } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function AdminNotifications() {
  const [open, setOpen] = useState(false);

  const { data: logs = [] } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const getIcon = (action: string) => {
    if (action.includes('create') || action.includes('add')) return '🆕';
    if (action.includes('update') || action.includes('edit')) return '✏️';
    if (action.includes('delete') || action.includes('remove')) return '🗑️';
    if (action.includes('login')) return '🔑';
    if (action.includes('license') || action.includes('extend')) return '📋';
    return '📌';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-[hsl(220,15%,15%)] text-[hsl(220,10%,55%)] hover:text-white transition-colors">
          <Bell size={20} />
          {logs.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
              {logs.length > 9 ? '9+' : logs.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 bg-[hsl(220,20%,12%)] border-[hsl(220,15%,20%)] text-white"
      >
        <div className="px-4 py-3 border-b border-[hsl(220,15%,18%)]">
          <h3 className="text-sm font-semibold">Recent Activity</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="p-4 text-sm text-[hsl(220,10%,45%)] text-center">No recent activity</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="px-4 py-3 border-b border-[hsl(220,15%,16%)] last:border-0 hover:bg-[hsl(220,15%,15%)] transition-colors"
              >
                <div className="flex gap-2 items-start">
                  <span className="text-base mt-0.5">{getIcon(log.action)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[hsl(220,10%,80%)] truncate">
                      <span className="font-medium text-white capitalize">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      {' '}on {log.entity_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-[hsl(220,10%,45%)] mt-0.5">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
