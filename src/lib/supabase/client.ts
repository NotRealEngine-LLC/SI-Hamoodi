// HAMOODI SyntheTech Intelligence — Supabase Client
// Phase 03: Secure Authentication & Cloud Database

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig, isSupabaseConfigured } from './config';

// Use a flexible type for the client to avoid strict generic inference issues
type FlexibleClient = SupabaseClient<any>;

let supabaseInstance: FlexibleClient | null = null;

export function getSupabaseClient(): FlexibleClient | null {
  if (!isSupabaseConfigured()) return null;
  
  if (!supabaseInstance) {
    const config = getSupabaseConfig();
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  }
  
  return supabaseInstance;
}

export function resetSupabaseClient(): void {
  supabaseInstance = null;
}
