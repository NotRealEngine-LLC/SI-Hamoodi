// HAMOODI SyntheTech Intelligence — Supabase Configuration
// Phase 03: Secure Authentication & Cloud Database

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  appUrl: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  return { url, anonKey, appUrl };
}

export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return !!(config.url && config.anonKey && config.url.startsWith('https://'));
}
