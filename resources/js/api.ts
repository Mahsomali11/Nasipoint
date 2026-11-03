export interface User {
  id: string;
  email?: string;
  [key: string]: any;
}

export interface Session {
  access_token: string;
  user: User;
}

const API_URL = '/api';

const getCsrfToken = () => {
  const name = 'XSRF-TOKEN=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
};

const inFlightRequests = new Map<string, Promise<any>>();

export function generateIdempotencyKey(payloadStr: string): string {
  let hash = 0;
  for (let i = 0; i < payloadStr.length; i++) {
    hash = ((hash << 5) - hash) + payloadStr.charCodeAt(i);
    hash |= 0;
  }
  return `idemp_${Date.now()}_${Math.abs(hash)}`;
}

const getHeaders = (extraHeaders?: Record<string, string>): Record<string, string> => {
  const csrf = getCsrfToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(csrf ? { 'X-XSRF-TOKEN': csrf } : {}),
    ...(extraHeaders || {})
  };
};

class QueryBuilder {
  private table: string;
  private query: Record<string, string> = {};
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any = null;
  private isSingle = false;

  constructor(table: string) {
    this.table = table;
  }

  select(fields = '*', options?: { count?: string; head?: boolean }) {
    if (this.action !== 'insert' && this.action !== 'update') {
      this.action = 'select';
    }
    this.query.select = fields;
    if (options?.count) {
      this.query.count = options.count;
    }
    if (options?.head) {
      this.query.head = 'true';
    }
    return this;
  }

  insert(data: any) {
    this.action = 'insert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.payload = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.query[column] = `eq.${value}`;
    return this;
  }
  
  neq(column: string, value: any) {
    this.query[column] = `neq.${value}`;
    return this;
  }

  in(column: string, values: any[]) {
    this.query[column] = `in.(${values.join(',')})`;
    return this;
  }

  or(filter: string) {
    this.query['or'] = filter;
    return this;
  }

  order(column: string, options: { ascending?: boolean } = { ascending: true }) {
    this.query.order = `${column}.${options.ascending ? 'asc' : 'desc'}`;
    return this;
  }

  single() {
    this.isSingle = true;
    this.query.limit = '1';
    return this;
  }
  
  maybeSingle() {
    this.isSingle = true;
    this.query.limit = '1';
    return this;
  }
  
  limit(count: number) {
    this.query.limit = count.toString();
    return this;
  }

  async then(resolve: any, reject: any) {
    const q = new URLSearchParams(this.query).toString();
    const url = `${API_URL}/rest/v1/${this.table}${q ? '?' + q : ''}`;
    
    let method = 'GET';
    if (this.action === 'insert') method = 'POST';
    if (this.action === 'update') method = 'PATCH';
    if (this.action === 'delete') method = 'DELETE';

    const isMutating = method === 'POST' || method === 'PATCH';
    const payloadStr = this.payload ? JSON.stringify(this.payload) : '';
    const requestKey = `${method}:${url}:${payloadStr}`;

    // Return in-flight promise if an identical mutating request is already executing
    if (isMutating && inFlightRequests.has(requestKey)) {
      return inFlightRequests.get(requestKey)!.then(resolve, reject);
    }

    const executeRequest = async () => {
      try {
        const extraHeaders: Record<string, string> = {};
        if (isMutating) {
          extraHeaders['X-Idempotency-Key'] = generateIdempotencyKey(requestKey);
        }

        const res = await fetch(url, {
          method,
          credentials: 'same-origin',
          headers: getHeaders(extraHeaders),
          body: this.payload ? JSON.stringify(this.payload) : undefined
        });

        if (res.status === 401 || res.status === 419) {
          // Force a reload to trigger Inertia redirect to login if session expires
          window.location.reload();
          return { data: null, error: new Error('Session expired') };
        }

        if (!res.ok) {
          let errMsg = `HTTP error ${res.status}`;
          try {
            const errBody = await res.json();
            errMsg = errBody.message || errBody.error || errMsg;
          } catch (_) {}
          throw new Error(errMsg);
        }

        let data = null;
        let count = null;
        
        if (res.status !== 204) {
          data = await res.json();
        }

        const contentRange = res.headers.get('Content-Range');
        if (contentRange) {
          const parts = contentRange.split('/');
          if (parts.length > 1) {
            count = parseInt(parts[1], 10);
          }
        }

        if (this.isSingle && Array.isArray(data)) {
          data = data[0] || null;
        }

        const result = { data, count, error: null };
        window.dispatchEvent(new CustomEvent('action-complete'));
        return result;
      } catch (error) {
        window.dispatchEvent(new CustomEvent('action-error', { detail: error }));
        return { data: null, error };
      } finally {
        setTimeout(() => {
          inFlightRequests.delete(requestKey);
        }, 1500);
      }
    };

    const promise = executeRequest();
    if (isMutating) {
      inFlightRequests.set(requestKey, promise);
    }

    return promise.then(resolve, reject);
  }
}

class LaravelAuthMock {
  private listeners: ((event: string, session: any) => void)[] = [];
  
  private trigger(event: string, session: any) {
    this.listeners.forEach(l => l(event, session));
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.listeners.push(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter(l => l !== callback);
          }
        }
      }
    };
  }

  async getSession() {
    try {
      const res = await fetch(`${API_URL}/user`, { 
          headers: getHeaders(),
          credentials: 'same-origin'
      });
      if (res.ok) {
        const user = await res.json();
        const session: Session = { access_token: 'session', user };
        return { data: { session }, error: null };
      }
    } catch (e) {}
    
    return { data: { session: null }, error: null };
  }

  async signInWithPassword({ email, password }: any) {
      // The actual login happens via Inertia post('/login'), this is just a fallback 
      // in case unmigrated components call this directly.
      return { error: { message: 'Use standard login form' } };
  }

  async signUp({ email, password, options }: any) {
      return { error: { message: 'Use standard signup form' } };
  }

  async getUser() {
    const sessionRes = await this.getSession();
    if (sessionRes.data?.session?.user) {
      return { data: { user: sessionRes.data.session.user }, error: null };
    }
    return { data: { user: null }, error: null };
  }

  async signOut() {
    try {
      await fetch('/logout', { 
          method: 'POST', 
          headers: getHeaders(),
          credentials: 'same-origin'
      });
      // Force reload to trigger redirect
      window.location.href = '/login';
    } catch (e) {}
    this.trigger('SIGNED_OUT', null);
    return { error: null };
  }
  
  async updateUser(updates: any) {
    return { data: null, error: null };
  }

  async resetPasswordForEmail(email: string, options: any) {
    try {
      const res = await fetch('/forgot-password', {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset link');
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async resetPassword(payload: any) {
    try {
      const res = await fetch('/reset-password', {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({
           email: payload.email,
           token: payload.token,
           password: payload.password,
           password_confirmation: payload.password // Laravel requires confirmation
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

export const api = {
  auth: new LaravelAuthMock(),
  from: (table: string) => new QueryBuilder(table),
  rpc: async (fn: string, params: any) => {
      // Mock RPC calls
      if (fn === 'check_store_creation_allowed') {
         return { data: { allowed: true } };
      }
      if (fn === 'inherit_owner_license') {
         return { data: { inherited: true } };
      }
      if (fn === 'check_store_license') {
         try {
           const storeRes = await fetch(`${API_URL}/rest/v1/stores?id=eq.${params._store_id}`, { headers: getHeaders(), credentials: 'same-origin' });
           const storeData = await storeRes.json();
           if (storeData && storeData.length > 0) {
             const ownerId = storeData[0].owner_user_id;
             let licRes = await fetch(`${API_URL}/rest/v1/licenses?owner_user_id=eq.${ownerId}&status=eq.active&order=expiry_date.desc&select=*,plans(name)`, { headers: getHeaders(), credentials: 'same-origin' });
             let licData = await licRes.json();
             if (!licData || licData.length === 0) {
                 licRes = await fetch(`${API_URL}/rest/v1/licenses?owner_user_id=eq.${ownerId}&order=created_at.desc&limit=1&select=*,plans(name)`, { headers: getHeaders(), credentials: 'same-origin' });
                 licData = await licRes.json();
             }
             if (licData && licData.length > 0) {
               const lic = licData[0];
               let remaining = 999;
               let isTimestampExpired = false;
               const expiryTimestamp = lic.expiry_date || lic.expires_at;
               if (expiryTimestamp) {
                 const diffMs = new Date(expiryTimestamp).getTime() - Date.now();
                 isTimestampExpired = diffMs <= 0;
                 remaining = isTimestampExpired ? 0 : Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
               }
               const effectiveStatus = (lic.status === 'active' && isTimestampExpired) ? 'expired' : lic.status;
               return { 
                 data: { 
                   status: effectiveStatus, 
                   plan_name: lic.plans?.name || 'Unknown', 
                   days_remaining: remaining,
                   expiry_date: expiryTimestamp
                 } 
               };
             }
           }
         } catch (e) { }
         return { data: { status: 'expired', plan_name: 'None', days_remaining: 0 } };
      }
      if (fn === 'get_store_features') {
         try {
           const storeRes = await fetch(`${API_URL}/rest/v1/stores?id=eq.${params._store_id}`, { headers: getHeaders(), credentials: 'same-origin' });
           const storeData = await storeRes.json();
           if (storeData && storeData.length > 0) {
             const ownerId = storeData[0].owner_user_id;
             let licRes = await fetch(`${API_URL}/rest/v1/licenses?owner_user_id=eq.${ownerId}&status=eq.active&order=expiry_date.desc`, { headers: getHeaders(), credentials: 'same-origin' });
             let licData = await licRes.json();
             if (!licData || licData.length === 0) {
                 licRes = await fetch(`${API_URL}/rest/v1/licenses?owner_user_id=eq.${ownerId}&order=created_at.desc&limit=1`, { headers: getHeaders(), credentials: 'same-origin' });
                 licData = await licRes.json();
             }
             if (licData && licData.length > 0) {
               return { data: typeof licData[0].features_enabled === 'string' ? JSON.parse(licData[0].features_enabled) : (licData[0].features_enabled || {}) };
             }
           }
         } catch (e) { }
         return { data: {} };
      }
      if (fn === 'check_user_limit') {
         return { data: { allowed: true } };
      }
    if (fn === 'get_admin_role') {
      try {
        const res = await fetch(`${API_URL}/rest/v1/admin_roles?user_id=eq.${params._user_id}`, { headers: getHeaders(), credentials: 'same-origin' });
        const roles = await res.json();
        if (roles && roles.length > 0) {
          return { data: roles[0].role };
        }
        return { data: null };
      } catch (e) {
        return { data: null };
      }
    }
    if (fn === 'get_store_data') {
      try {
        const res = await fetch(`${API_URL}/rest/v1/rpc/get_store_data`, {
          method: 'POST',
          headers: getHeaders(),
          credentials: 'same-origin',
          body: JSON.stringify(params)
        });
        if (res.ok) {
          const data = await res.json();
          return { data, error: null };
        } else {
          const err = await res.json();
          return { data: null, error: err };
        }
      } catch (e) {
        return { data: null, error: e };
      }
    }
    
    return { data: null, error: null };

  },
  post: async (path: string, body: any) => {
    const requestKey = `POST:${API_URL}${path}:${JSON.stringify(body || '')}`;
    if (inFlightRequests.has(requestKey)) {
      return inFlightRequests.get(requestKey)!;
    }

    const exec = async () => {
      try {
        const extraHeaders: Record<string, string> = {
          'X-Idempotency-Key': generateIdempotencyKey(requestKey)
        };
        const res = await fetch(`${API_URL}${path}`, {
          method: 'POST',
          headers: getHeaders(extraHeaders),
          credentials: 'same-origin',
          body: JSON.stringify(body)
        });
        const data = await res.json();
        window.dispatchEvent(new CustomEvent('action-complete'));
        if (!res.ok) return { data: { error: data.error || data.message || 'Error' }, error: null };
        return { data, error: null };
      } catch (e) {
        window.dispatchEvent(new CustomEvent('action-error', { detail: e }));
        return { data: { error: (e as Error).message }, error: e };
      } finally {
        setTimeout(() => {
          inFlightRequests.delete(requestKey);
        }, 1500);
      }
    };

    const promise = exec();
    inFlightRequests.set(requestKey, promise);
    return promise;
  },
  functions: {
    invoke: async (fn: string, options: any) => {
      if (fn === 'signup-with-store') {
        try {
          const res = await fetch(`${API_URL}/auth/v1/signup-with-store`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(options.body)
          });
          const data = await res.json();
          if (!res.ok) return { data: { error: data.message || 'Signup failed' }, error: null };
          return { data: { success: true }, error: null };
        } catch (error: any) {
          return { data: { error: error.message }, error: null };
        }
      }
      // Mock other edge functions
      return { data: { success: true }, error: null };
    }
  }
};
