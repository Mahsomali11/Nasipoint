import { useEffect, useState } from 'react';
import { api as apiClient } from '@/api';

const DEFAULT_NAME = 'Maaldhis';
let cachedName: string | null = null;

export function clearPlatformNameCache() {
  cachedName = null;
}

export function usePlatformName() {
  const [name, setName] = useState(cachedName || DEFAULT_NAME);

  useEffect(() => {
    if (cachedName) { setName(cachedName); return; }
    apiClient
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'platform_name')
      .maybeSingle()
      .then(({ data }) => {
        const val = data?.setting_value || DEFAULT_NAME;
        cachedName = val;
        setName(val);
      });
  }, []);

  return name;
}
