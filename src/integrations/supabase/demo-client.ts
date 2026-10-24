/* eslint-disable @typescript-eslint/no-explicit-any */
// Offline demo backend for Noura.
//
// Enabled with VITE_DEMO_MODE=true (see vite.config.ts): every import of
// "@/integrations/supabase/client" resolves to this file instead of the real
// Supabase client. It implements the small part of the supabase-js API the
// app uses (auth, table queries, edge functions, realtime channels) on top of
// an in-memory database saved to localStorage, seeded with a demo user.
//
// Nothing leaves the browser: no account is created, no emergency contact is
// emailed or texted. Use it for demos, screenshots and UI work.
// Reset the data with ?demo-reset in the URL.

const STORAGE_KEY = 'noura-demo-db-v1';
const USER_ID = '00000000-0000-4000-8000-00000000d3e0';
const now = () => new Date().toISOString();
const uuid = () =>
  (crypto as any).randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () =>
        Math.floor(Math.random() * 16).toString(16)
      );

type Row = Record<string, any>;
type DB = Record<string, Row[]>;

const DEMO_USER = {
  id: USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo@noura.app',
  email_confirmed_at: '2025-12-01T10:00:00Z',
  app_metadata: { provider: 'email' },
  user_metadata: { full_name: 'Léa Martin' },
  created_at: '2025-12-01T10:00:00Z',
} as any;

const DEMO_SESSION = {
  access_token: 'demo-access-token',
  refresh_token: 'demo-refresh-token',
  token_type: 'bearer',
  expires_in: 3600 * 24 * 365,
  expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
  user: DEMO_USER,
} as any;

function seed(): DB {
  const t = now();
  const homeId = uuid();
  const workId = uuid();
  const contactA = uuid();
  const contactB = uuid();
  return {
    profiles: [
      {
        id: uuid(),
        user_id: USER_ID,
        full_name: 'Léa Martin',
        phone: null,
        // No saved preferences yet, so the app opens with its onboarding.
        safety_preferences: null,
        safe_word: 'pineapple',
        shake_action: 'sos',
        fake_call_caller_name: 'Maman',
        default_checkin_interval: 10,
        default_safety_weight: 0.7,
        enable_battery_alerts: true,
        battery_warning_threshold: 20,
        battery_critical_threshold: 10,
        auto_notify_on_critical_battery: true,
        created_at: t,
        updated_at: t,
      },
    ],
    saved_locations: [
      {
        id: homeId, user_id: USER_ID, name: 'Home', label: 'home',
        address: 'Rue de Turenne, Le Marais', lat: 48.8592, lng: 2.3645,
        geofence_enabled: true, geofence_radius_m: 150,
        notify_on_enter: true, notify_on_exit: false, created_at: t,
      },
      {
        id: workId, user_id: USER_ID, name: 'Work', label: 'work',
        address: 'Place de la Bourse', lat: 48.8687, lng: 2.3412,
        geofence_enabled: false, geofence_radius_m: 100,
        notify_on_enter: false, notify_on_exit: false, created_at: t,
      },
      {
        id: uuid(), user_id: USER_ID, name: 'Gym', label: 'other',
        address: 'Rue Oberkampf', lat: 48.8649, lng: 2.3757,
        geofence_enabled: false, geofence_radius_m: 100,
        notify_on_enter: false, notify_on_exit: false, created_at: t,
      },
    ],
    emergency_contacts: [
      {
        id: contactA, user_id: USER_ID, name: 'Maman', phone: '+33 6 00 00 00 01',
        email: 'maman@example.com', notify_sms: true, notify_email: true,
        notify_on_start: true, priority: 1, created_at: t, updated_at: t,
      },
      {
        id: contactB, user_id: USER_ID, name: 'Sarah', phone: '+33 6 00 00 00 02',
        email: 'sarah@example.com', notify_sms: true, notify_email: false,
        notify_on_start: false, priority: 2, created_at: t, updated_at: t,
      },
    ],
    contact_zone_rules: [
      {
        id: uuid(), user_id: USER_ID, contact_id: contactA, location_id: homeId,
        notify_on_enter: true, notify_on_exit: false, created_at: t,
      },
    ],
    safety_reports: [
      {
        id: uuid(), user_id: 'community-1', report_type: 'poorly_lit',
        description: 'Street lights out along this stretch', lat: 48.8622, lng: 2.3536,
        time_relevance: 'night_only', created_at: t, updated_at: t,
        expires_at: new Date(Date.now() + 7 * 864e5).toISOString(),
      },
      {
        id: uuid(), user_id: 'community-2', report_type: 'caution',
        description: 'Group catcalling near the exit', lat: 48.8611, lng: 2.3478,
        time_relevance: 'night_only', created_at: t, updated_at: t,
        expires_at: new Date(Date.now() + 3 * 864e5).toISOString(),
      },
      {
        id: uuid(), user_id: 'community-3', report_type: 'safe',
        description: 'Café open late, staff happy to help', lat: 48.8579, lng: 2.3557,
        time_relevance: 'always', created_at: t, updated_at: t,
        expires_at: new Date(Date.now() + 30 * 864e5).toISOString(),
      },
    ],
    safety_votes: [],
    safe_places: [],
    journeys: [],
    checkins: [],
    alerts: [],
    location_share_tokens: [],
    journey_locations: [],
    geofence_events: [],
    push_subscriptions: [],
    user_roles: [],
  };
}

function load(): DB {
  try {
    if (new URLSearchParams(window.location.search).has('demo-reset')) {
      localStorage.removeItem(STORAGE_KEY);
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* storage unavailable: fall back to a fresh seed */
  }
  return seed();
}

const db: DB = load();
const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* ignore */
  }
};
persist();

// ---------------------------------------------------------------------------
// Query builder (subset of PostgREST semantics used by the app)
// ---------------------------------------------------------------------------

type Op = 'select' | 'insert' | 'update' | 'delete' | 'upsert';

const listeners: Array<(table: string, type: string, row: Row) => void> = [];

function project(row: Row, columns: string): Row {
  const cols = columns.replace(/\s+/g, ' ').trim();
  if (!cols || cols === '*') return { ...row };
  const out: Row = {};
  // split on commas that are not inside parentheses
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of cols) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  for (const p of parts) {
    const rel = p.match(/^(\w+)\s*\(([^)]*)\)$/);
    if (rel) {
      // embedded relation: saved_locations (name) via <singular>_id or location_id
      const table = rel[1];
      const fk =
        Object.keys(row).find((k) => k === `${table.replace(/s$/, '')}_id`) ||
        (table === 'saved_locations' ? 'location_id' : undefined);
      const target = fk ? (db[table] || []).find((r) => r.id === row[fk]) : undefined;
      out[table] = target ? project(target, rel[2]) : null;
    } else if (p === '*') {
      Object.assign(out, row);
    } else {
      out[p] = row[p];
    }
  }
  return out;
}

class Query implements PromiseLike<any> {
  private op: Op = 'select';
  private columns = '*';
  private returning = false;
  private payload: Row | Row[] | null = null;
  private filters: Array<(r: Row) => boolean> = [];
  private orders: Array<{ col: string; asc: boolean }> = [];
  private lim: number | null = null;
  private from_: number | null = null;
  private to_: number | null = null;
  private mode: 'many' | 'single' | 'maybe' = 'many';
  private onConflict: string | null = null;

  constructor(private table: string) {
    if (!db[table]) db[table] = [];
  }

  select(columns = '*') {
    if (this.op === 'select') this.columns = columns;
    else {
      this.returning = true;
      this.columns = columns;
    }
    return this;
  }
  insert(values: Row | Row[]) {
    this.op = 'insert';
    this.payload = values;
    return this;
  }
  upsert(values: Row | Row[], opts?: { onConflict?: string }) {
    this.op = 'upsert';
    this.payload = values;
    this.onConflict = opts?.onConflict ?? null;
    return this;
  }
  update(values: Row) {
    this.op = 'update';
    this.payload = values;
    return this;
  }
  delete() {
    this.op = 'delete';
    return this;
  }

  private where(fn: (r: Row) => boolean) {
    this.filters.push(fn);
    return this;
  }
  eq(c: string, v: any) { return this.where((r) => r[c] === v); }
  neq(c: string, v: any) { return this.where((r) => r[c] !== v); }
  gt(c: string, v: any) { return this.where((r) => r[c] > v); }
  gte(c: string, v: any) { return this.where((r) => r[c] >= v); }
  lt(c: string, v: any) { return this.where((r) => r[c] < v); }
  lte(c: string, v: any) { return this.where((r) => r[c] <= v); }
  in(c: string, vs: any[]) { return this.where((r) => vs.includes(r[c])); }
  is(c: string, v: any) { return this.where((r) => (r[c] ?? null) === v); }
  contains(c: string, v: any) {
    return this.where((r) =>
      Array.isArray(r[c]) ? [].concat(v).every((x) => r[c].includes(x)) : false
    );
  }
  match(obj: Row) { return this.where((r) => Object.entries(obj).every(([k, v]) => r[k] === v)); }
  filter(c: string, op: string, v: any) {
    const f: Record<string, (r: Row) => boolean> = {
      eq: (r) => r[c] === v, gt: (r) => r[c] > v, gte: (r) => r[c] >= v,
      lt: (r) => r[c] < v, lte: (r) => r[c] <= v, neq: (r) => r[c] !== v,
    };
    return this.where(f[op] || (() => true));
  }
  not(c: string, op: string, v: any) {
    return this.where((r) => !(op === 'is' ? (r[c] ?? null) === v : r[c] === v));
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ col, asc: opts?.ascending ?? true });
    return this;
  }
  limit(n: number) { this.lim = n; return this; }
  range(a: number, b: number) { this.from_ = a; this.to_ = b; return this; }
  single() { this.mode = 'single'; return this; }
  maybeSingle() { this.mode = 'maybe'; return this; }
  abortSignal() { return this; }
  throwOnError() { return this; }

  private emit(type: string, row: Row) {
    listeners.forEach((l) => l(this.table, type, row));
  }

  private run(): { data: any; error: any; count?: number } {
    const rows = db[this.table];
    let affected: Row[] = [];

    if (this.op === 'insert' || this.op === 'upsert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload as Row];
      for (const item of items) {
        const keys = this.onConflict ? this.onConflict.split(',').map((s) => s.trim()) : ['id'];
        const existing =
          this.op === 'upsert'
            ? rows.find((r) => keys.every((k) => item[k] !== undefined && r[k] === item[k]))
            : undefined;
        if (existing) {
          Object.assign(existing, item, { updated_at: now() });
          affected.push(existing);
          this.emit('UPDATE', existing);
        } else {
          const row = { id: uuid(), created_at: now(), ...item };
          if (this.table === 'journeys') row.started_at ??= now();
          rows.push(row);
          affected.push(row);
          this.emit('INSERT', row);
        }
      }
      persist();
    } else {
      let matched = rows.filter((r) => this.filters.every((f) => f(r)));
      if (this.op === 'update') {
        matched.forEach((r) => {
          Object.assign(r, this.payload, 'updated_at' in r ? { updated_at: now() } : {});
          this.emit('UPDATE', r);
        });
        persist();
      } else if (this.op === 'delete') {
        db[this.table] = rows.filter((r) => !matched.includes(r));
        matched.forEach((r) => this.emit('DELETE', r));
        persist();
      }
      for (const o of [...this.orders].reverse()) {
        matched = [...matched].sort((a, b) =>
          a[o.col] === b[o.col] ? 0 : (a[o.col] > b[o.col] ? 1 : -1) * (o.asc ? 1 : -1)
        );
      }
      if (this.from_ !== null && this.to_ !== null) matched = matched.slice(this.from_, this.to_ + 1);
      if (this.lim !== null) matched = matched.slice(0, this.lim);
      affected = matched;
    }

    const isRead = this.op === 'select';
    if (!isRead && !this.returning) return { data: null, error: null };

    const data = affected.map((r) => project(r, this.columns));
    if (this.mode === 'single') {
      if (data.length !== 1) {
        return {
          data: null,
          error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
        };
      }
      return { data: data[0], error: null };
    }
    if (this.mode === 'maybe') return { data: data[0] ?? null, error: null };
    return { data, error: null, count: data.length };
  }

  then<T1 = any, T2 = never>(
    onfulfilled?: ((value: any) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: any) => T2 | PromiseLike<T2>) | null
  ): PromiseLike<T1 | T2> {
    // A short delay keeps loading states visible, like a network round trip.
    return new Promise((resolve) => setTimeout(() => resolve(this.run()), 60)).then(
      onfulfilled,
      onrejected
    );
  }
}

// ---------------------------------------------------------------------------
// Edge functions
// ---------------------------------------------------------------------------

function mockCrimeAlerts() {
  // Same items the fetch-crime-alerts edge function returns when the news
  // feeds have nothing (generateMockAlerts in supabase/functions).
  const t = Date.now();
  const h = (n: number) => new Date(t - n * 3600e3).toISOString();
  return [
    {
      id: uuid(), title: 'Pickpocket activity reported near Châtelet',
      description: 'Multiple reports of pickpocket activity in the metro station area. Tourists advised to stay vigilant.',
      location: 'Châtelet', lat: 48.8584, lng: 2.347, severity: 'medium', publishedAt: h(2), source: 'Local Reports', url: '#',
    },
    {
      id: uuid(), title: 'Late night disturbance in Pigalle',
      description: 'Police responded to reports of a disturbance. Area now calm.',
      location: 'Pigalle', lat: 48.8822, lng: 2.3373, severity: 'low', publishedAt: h(5), source: 'Local Reports', url: '#',
    },
    {
      id: uuid(), title: 'Theft reported near Gare du Nord',
      description: 'Bag snatching incident reported outside the station. Suspect fled the scene.',
      location: 'Gare du Nord', lat: 48.8809, lng: 2.3553, severity: 'high', publishedAt: h(8), source: 'Local Reports', url: '#',
    },
    {
      id: uuid(), title: 'Scam artists active near Sacré-Cœur',
      description: 'Reports of petition scam and bracelet scam targeting tourists on the steps.',
      location: 'Montmartre', lat: 48.8867, lng: 2.3431, severity: 'low', publishedAt: h(12), source: 'Local Reports', url: '#',
    },
  ];
}

async function weather(body: { lat: number; lng: number }) {
  // Same request as the fetch-weather edge function, made from the browser.
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${body.lat}&longitude=${body.lng}` +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,visibility,is_day' +
      '&hourly=precipitation_probability&daily=sunrise,sunset&timezone=auto&forecast_days=1';
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const d = await res.json();
    const hour = new Date().getHours();
    return {
      temperature: Math.round(d.current.temperature_2m),
      feelsLike: Math.round(d.current.apparent_temperature),
      humidity: d.current.relative_humidity_2m,
      precipitation: d.current.precipitation,
      precipitationProbability: d.hourly?.precipitation_probability?.[hour] ?? 0,
      visibility: d.current.visibility,
      windSpeed: Math.round(d.current.wind_speed_10m),
      weatherCode: d.current.weather_code,
      isDay: d.current.is_day === 1,
      sunrise: d.daily?.sunrise?.[0],
      sunset: d.daily?.sunset?.[0],
    };
  } catch {
    return null;
  }
}

const functions = {
  async invoke(name: string, opts?: { body?: any }) {
    await new Promise((r) => setTimeout(r, 250));
    switch (name) {
      case 'fetch-crime-alerts':
        return { data: { success: true, alerts: mockCrimeAlerts(), fetchedAt: now() }, error: null };
      case 'fetch-weather': {
        const w = await weather(opts?.body ?? {});
        return w ? { data: w, error: null } : { data: null, error: { message: 'Weather unavailable in demo' } };
      }
      case 'notify-emergency-contacts': {
        const contacts = db.emergency_contacts.filter((c) => c.user_id === USER_ID);
        console.info('[demo] would notify', contacts.map((c) => c.name).join(', '), opts?.body);
        return { data: { success: true, notified: contacts.length, demo: true }, error: null };
      }
      case 'get-shared-location':
        return { data: null, error: { message: 'Not available in demo mode' } };
      default:
        return { data: { success: true, demo: true }, error: null };
    }
  },
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

type AuthCb = (event: string, session: any) => void;
const authCbs = new Set<AuthCb>();
let signedIn = true;

const auth = {
  async getSession() {
    return { data: { session: signedIn ? DEMO_SESSION : null }, error: null };
  },
  async getUser() {
    return { data: { user: signedIn ? DEMO_USER : null }, error: null };
  },
  onAuthStateChange(cb: AuthCb) {
    authCbs.add(cb);
    setTimeout(() => cb(signedIn ? 'SIGNED_IN' : 'SIGNED_OUT', signedIn ? DEMO_SESSION : null), 0);
    return { data: { subscription: { unsubscribe: () => authCbs.delete(cb) } } };
  },
  async signInWithPassword() {
    signedIn = true;
    authCbs.forEach((cb) => cb('SIGNED_IN', DEMO_SESSION));
    return { data: { user: DEMO_USER, session: DEMO_SESSION }, error: null };
  },
  async signUp() {
    return auth.signInWithPassword();
  },
  async signOut() {
    signedIn = false;
    authCbs.forEach((cb) => cb('SIGNED_OUT', null));
    return { error: null };
  },
};

// ---------------------------------------------------------------------------
// Realtime channels
// ---------------------------------------------------------------------------

function channel(_name: string) {
  const handlers: Array<{ table?: string; event?: string; cb: (p: any) => void }> = [];
  const listener = (table: string, type: string, row: Row) => {
    handlers
      .filter((h) => (!h.table || h.table === table) && (!h.event || h.event === '*' || h.event === type))
      .forEach((h) => h.cb({ eventType: type, new: row, old: {} }));
  };
  const ch = {
    on(_type: string, filter: any, cb: (p: any) => void) {
      handlers.push({ table: filter?.table, event: filter?.event, cb });
      return ch;
    },
    subscribe(cb?: (status: string) => void) {
      listeners.push(listener);
      cb?.('SUBSCRIBED');
      return ch;
    },
    unsubscribe() {
      const i = listeners.indexOf(listener);
      if (i >= 0) listeners.splice(i, 1);
      return Promise.resolve('ok');
    },
  };
  return ch;
}

export const supabase: any = {
  from: (table: string) => new Query(table),
  auth,
  functions,
  channel,
  removeChannel: (ch: any) => ch?.unsubscribe?.(),
  rpc: async (fn: string) =>
    fn === 'has_role' ? { data: false, error: null } : { data: null, error: null },
};

export const isDemoMode = true;
