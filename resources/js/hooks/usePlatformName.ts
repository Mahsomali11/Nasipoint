import { useEffect, useState, useCallback } from 'react';

export interface SystemBranding {
  platform_name: string;
  system_logo: string;
  system_favicon: string;
}

const DEFAULT_NAME = 'Nasri Account System';

function getInitialBrandingFromPage(): SystemBranding {
  try {
    const appEl = typeof document !== 'undefined' ? document.getElementById('app') : null;
    const raw = appEl?.dataset?.page || (typeof document !== 'undefined' ? document.querySelector('script[data-page="app"]')?.textContent : null);
    if (raw) {
      const parsed = JSON.parse(raw);
      const sb = parsed?.props?.systemBranding;
      if (sb) {
        return {
          platform_name: sb.platform_name || DEFAULT_NAME,
          system_logo: sb.system_logo || '',
          system_favicon: sb.system_favicon || '',
        };
      }
    }
  } catch {}
  return {
    platform_name: DEFAULT_NAME,
    system_logo: '',
    system_favicon: '',
  };
}

let cachedBranding: SystemBranding | null = null;
let fetchPromise: Promise<SystemBranding> | null = null;

function applyFaviconToDom(faviconUrl: string) {
  if (typeof document === 'undefined') return;
  const href = faviconUrl || '/favicon.ico';
  let link = document.getElementById('system-favicon') as HTMLLinkElement | null;
  if (!link) {
    link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
  }
  if (!link) {
    link = document.createElement('link');
    link.id = 'system-favicon';
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  if (link.getAttribute('href') !== href) {
    link.setAttribute('href', href);
  }
}

function applyTitleSuffixToDom(newName: string) {
  if (typeof document === 'undefined' || !newName) return;
  const parts = document.title.split(' - ');
  if (parts.length > 1) {
    parts[parts.length - 1] = newName;
    document.title = parts.join(' - ');
  } else {
    document.title = newName;
  }
}

export function getPlatformName(): string {
  if (cachedBranding?.platform_name) return cachedBranding.platform_name;
  const initial = getInitialBrandingFromPage();
  return initial.platform_name || DEFAULT_NAME;
}

export function clearPlatformNameCache() {
  cachedBranding = null;
  fetchPromise = null;
}

export function updateBrandingCache(partial: Partial<SystemBranding>) {
  const current = cachedBranding || getInitialBrandingFromPage();
  const next: SystemBranding = {
    platform_name: partial.platform_name !== undefined ? (partial.platform_name || DEFAULT_NAME) : current.platform_name,
    system_logo: partial.system_logo !== undefined ? partial.system_logo : current.system_logo,
    system_favicon: partial.system_favicon !== undefined ? partial.system_favicon : current.system_favicon,
  };
  cachedBranding = next;
  applyFaviconToDom(next.system_favicon);
  applyTitleSuffixToDom(next.platform_name);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('system-branding-updated', { detail: next }));
  }
}

async function fetchSystemBranding(): Promise<SystemBranding> {
  if (fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    try {
      const res = await fetch('/api/system-branding', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        const next: SystemBranding = {
          platform_name: data?.platform_name || DEFAULT_NAME,
          system_logo: data?.system_logo || '',
          system_favicon: data?.system_favicon || '',
        };
        cachedBranding = next;
        applyFaviconToDom(next.system_favicon);
        return next;
      }
    } catch {}
    const fallback = cachedBranding || getInitialBrandingFromPage();
    cachedBranding = fallback;
    return fallback;
  })().finally(() => {
    fetchPromise = null;
  });
  return fetchPromise;
}

export function useSystemBranding() {
  const [branding, setBranding] = useState<SystemBranding>(() => cachedBranding || getInitialBrandingFromPage());

  const refreshBranding = useCallback(async () => {
    cachedBranding = null;
    const data = await fetchSystemBranding();
    setBranding(data);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('system-branding-updated', { detail: data }));
    }
  }, []);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<SystemBranding>;
      if (customEvent.detail) {
        setBranding(customEvent.detail);
      }
    };
    window.addEventListener('system-branding-updated', handleUpdate);

    if (cachedBranding) {
      setBranding(cachedBranding);
      applyFaviconToDom(cachedBranding.system_favicon);
    } else {
      fetchSystemBranding().then(data => {
        setBranding(data);
      });
    }

    return () => {
      window.removeEventListener('system-branding-updated', handleUpdate);
    };
  }, []);

  return {
    systemName: branding.platform_name || DEFAULT_NAME,
    systemLogo: branding.system_logo || '',
    systemFavicon: branding.system_favicon || '',
    refreshBranding,
  };
}

export function usePlatformName() {
  const { systemName } = useSystemBranding();
  return systemName;
}
