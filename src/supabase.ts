import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://mwsukgjyalxwqbcbwboc.supabase.co';
const rawSupabaseUrl = String((import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim().replace(/^["']|["']$/g, '');
const rawSupabaseAnonKey = String((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');

function isValidHttpUrl(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

let initializedClient: SupabaseClient | null = null;
if (isValidHttpUrl(rawSupabaseUrl) && rawSupabaseAnonKey) {
  try {
    initializedClient = createClient(rawSupabaseUrl, rawSupabaseAnonKey);
  } catch (err) {
    console.warn('Supabase client initialization failed. Falling back to Firebase mode.', err);
    initializedClient = null;
  }
}

export const supabase = initializedClient;

export type SupabaseConnectionStatus = 'unconfigured' | 'checking' | 'connected' | 'unreachable' | 'table_missing';

let supabaseStatus: SupabaseConnectionStatus = supabase ? 'checking' : 'unconfigured';
let healthCheckPromise: Promise<boolean> | null = null;
let lastFailureTimestamp = 0;
let hasLoggedOfflineWarning = false;
const REACHABILITY_RETRY_MS = 30000;

export function getSupabaseStatus(): SupabaseConnectionStatus {
  return supabaseStatus;
}

export function isSupabaseReady(): boolean {
  return Boolean(supabase && supabaseStatus === 'connected');
}

function isNetworkOrFetchError(err: any): boolean {
  const msg = String(err?.message || err?.details || err || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('err_name_not_resolved') ||
    msg.includes('load failed') ||
    msg.includes('abort') ||
    msg.includes('timeout')
  );
}

/**
 * Performs a single-flight connectivity check against Supabase so multiple
 * concurrent hooks don't spam failing requests when Supabase is paused/unreachable.
 */
export async function checkSupabaseReachable(forceRefresh = false): Promise<boolean> {
  if (!supabase) {
    supabaseStatus = 'unconfigured';
    return false;
  }

  if (!forceRefresh) {
    if (supabaseStatus === 'connected') return true;
    if (supabaseStatus === 'table_missing') return false;
    if (supabaseStatus === 'unreachable' && Date.now() - lastFailureTimestamp < REACHABILITY_RETRY_MS) {
      return false;
    }
    if (healthCheckPromise) return healthCheckPromise;
  }

  supabaseStatus = 'checking';
  healthCheckPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const { error } = await supabase
        .from('app_state')
        .select('key')
        .limit(1)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) {
        if (error.code === '42P01') {
          supabaseStatus = 'table_missing';
          if (!hasLoggedOfflineWarning) {
            console.warn("Supabase table 'app_state' does not exist yet. Running in Firebase mode.");
            hasLoggedOfflineWarning = true;
          }
          return false;
        }
        if (isNetworkOrFetchError(error)) {
          supabaseStatus = 'unreachable';
          lastFailureTimestamp = Date.now();
          if (!hasLoggedOfflineWarning) {
            console.warn('Supabase endpoint is currently unreachable (network/paused project). Running in Firebase mode.');
            hasLoggedOfflineWarning = true;
          }
          return false;
        }
        supabaseStatus = 'unreachable';
        lastFailureTimestamp = Date.now();
        if (!hasLoggedOfflineWarning) {
          console.warn(`Supabase check returned an error (${error.message}). Running in Firebase mode.`);
          hasLoggedOfflineWarning = true;
        }
        return false;
      }

      supabaseStatus = 'connected';
      hasLoggedOfflineWarning = false;
      return true;
    } catch (err) {
      supabaseStatus = 'unreachable';
      lastFailureTimestamp = Date.now();
      if (!hasLoggedOfflineWarning) {
        console.warn('Supabase connection check failed. Running in Firebase mode.', err);
        hasLoggedOfflineWarning = true;
      }
      return false;
    } finally {
      healthCheckPromise = null;
    }
  })();

  return healthCheckPromise;
}

if (!supabase) {
  console.warn('Supabase credentials missing or invalid. App is running in Firebase mode.');
}

/**
 * SQL Schema required in Supabase SQL Editor:
 * 
 * create table if not exists app_state (
 *   key text primary key,
 *   data jsonb,
 *   updated_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- Disable Row Level Security (RLS) to allow public read/write access:
 * alter table app_state disable row level security;
 * 
 * -- Enable Realtime for app_state table:
 * alter table app_state replica identity full;
 * alter publication supabase_realtime add table app_state;
 */

export interface SupabaseState {
  key: string;
  data: any;
  updated_at?: string;
}

/**
 * Fetches state for a specific key from Supabase
 */
export async function getSupabaseState(key: string): Promise<any | null> {
  const reachable = await checkSupabaseReachable();
  if (!supabase || !reachable) return null;

  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01') {
        supabaseStatus = 'table_missing';
        console.warn(`Supabase table 'app_state' does not exist yet. Please run the SQL schema setup.`);
      } else if (isNetworkOrFetchError(error)) {
        supabaseStatus = 'unreachable';
        lastFailureTimestamp = Date.now();
        console.warn(`Supabase unreachable fetching key ${key}; using Firebase fallback.`);
      } else {
        console.warn(`Supabase warning fetching key ${key}: ${error.message} (Code: ${error.code})`);
      }
      return null;
    }
    return data ? data.data : null;
  } catch (err) {
    if (isNetworkOrFetchError(err)) {
      supabaseStatus = 'unreachable';
      lastFailureTimestamp = Date.now();
    }
    console.warn(`Failed to fetch state from Supabase for key ${key}; using Firebase fallback.`, err);
    return null;
  }
}

/**
 * Saves state for a specific key in Supabase (upsert)
 */
export async function setSupabaseState(key: string, data: any): Promise<boolean> {
  const reachable = await checkSupabaseReachable();
  if (!supabase || !reachable) return false;

  try {
    const cleanData = JSON.parse(JSON.stringify(data));
    const { error } = await supabase
      .from('app_state')
      .upsert({ key, data: cleanData, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      if (error.code === '42P01') {
        supabaseStatus = 'table_missing';
        console.warn(`Supabase table 'app_state' does not exist yet. Cannot save key ${key}.`);
      } else if (isNetworkOrFetchError(error)) {
        supabaseStatus = 'unreachable';
        lastFailureTimestamp = Date.now();
        console.warn(`Supabase unreachable saving key ${key}; saved in Firebase.`);
      } else {
        console.warn(`Supabase warning saving key ${key}: ${error.message} (Code: ${error.code})`);
      }
      return false;
    }
    return true;
  } catch (err) {
    if (isNetworkOrFetchError(err)) {
      supabaseStatus = 'unreachable';
      lastFailureTimestamp = Date.now();
    }
    console.warn(`Failed to save state to Supabase for key ${key}; saved in Firebase.`, err);
    return false;
  }
}

/**
 * Subscribes to real-time changes of a state key in Supabase
 */
export function subscribeSupabaseState(key: string, onUpdate: (data: any) => void): () => void {
  if (!supabase || !isSupabaseReady()) return () => {};

  try {
    // Generate a unique channel name to prevent cache collision on re-renders / multi-subscriptions
    const uniqueId = Math.random().toString(36).substring(2, 11);
    const channel = supabase
      .channel(`app_state_realtime_${key}_${uniqueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_state',
          filter: `key=eq.${key}`
        },
        (payload: any) => {
          if (payload.new && payload.new.data !== undefined) {
            onUpdate(payload.new.data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(err => {
        console.warn('Error removing Supabase channel:', err);
      });
    };
  } catch (err) {
    console.warn(`Failed to subscribe to Supabase updates for key ${key}:`, err);
    return () => {};
  }
}
