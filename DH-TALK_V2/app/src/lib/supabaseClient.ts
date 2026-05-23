import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function isSupabaseConfigured(url?: string, anonKey?: string): boolean {
  return Boolean(url?.trim() && anonKey?.trim());
}

export function createDhTalkSupabaseClient(
  url = import.meta.env.VITE_SUPABASE_URL,
  anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
): SupabaseClient | null {
  if (!isSupabaseConfigured(url, anonKey)) return null;
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
}

export const supabase = createDhTalkSupabaseClient();
