import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Initialize client only if keys are present to prevent startup crashes
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Log Supabase configuration status
if (supabase) {
  console.log('Supabase client successfully initialized.');
} else {
  console.warn('Supabase credentials missing. App is running in Firebase mode.');
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
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      // If table doesn't exist yet, we'll get a 42P01 error code in PostgreSQL
      if (error.code === '42P01') {
        console.warn(`Supabase table 'app_state' does not exist yet. Please run the SQL schema setup.`);
      } else {
        console.error(`Supabase error fetching key ${key}: ${error.message} (Code: ${error.code}) Details: ${error.details || 'None'} Hint: ${error.hint || 'None'}`);
      }
      return null;
    }
    return data ? data.data : null;
  } catch (err) {
    console.error(`Failed to fetch state from Supabase for key ${key}:`, err);
    return null;
  }
}

/**
 * Saves state for a specific key in Supabase (upsert)
 */
export async function setSupabaseState(key: string, data: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const cleanData = JSON.parse(JSON.stringify(data));
    const { error } = await supabase
      .from('app_state')
      .upsert({ key, data: cleanData, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      if (error.code === '42P01') {
        console.warn(`Supabase table 'app_state' does not exist yet. Cannot save key ${key}.`);
      } else {
        console.error(`Supabase error saving key ${key}: ${error.message} (Code: ${error.code}) Details: ${error.details || 'None'} Hint: ${error.hint || 'None'}`);
      }
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Failed to save state to Supabase for key ${key}:`, err);
    return false;
  }
}

/**
 * Subscribes to real-time changes of a state key in Supabase
 */
export function subscribeSupabaseState(key: string, onUpdate: (data: any) => void): () => void {
  if (!supabase) return () => {};

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
    console.error(`Failed to subscribe to Supabase updates for key ${key}:`, err);
    return () => {};
  }
}
