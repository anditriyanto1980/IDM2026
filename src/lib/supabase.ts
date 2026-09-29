import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Validate that a URL string is a valid HTTP or HTTPS URL,
 * excluding default placeholders.
 */
export const isValidHttpUrl = (str: string | undefined | null): boolean => {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (
      host.includes('your-project') ||
      host.includes('example.com') ||
      host.includes('placeholder') ||
      host.includes('my_supabase')
    ) {
      return false;
    }
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Validate that an anon key is not empty or a default placeholder.
 */
export const isValidAnonKey = (key: string | undefined | null): boolean => {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim().toLowerCase();
  if (
    trimmed === '' ||
    trimmed === 'your-anon-key' ||
    trimmed === 'your_anon_key' ||
    trimmed === 'placeholder' ||
    trimmed.length < 10
  ) {
    return false;
  }
  return true;
};

// Read from env or local storage config
const getEnvConfig = () => {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  // Allow runtime custom configuration from Settings
  const customUrl =
    typeof window !== 'undefined' ? (localStorage.getItem('akram_supabase_url') || '').trim() : '';
  const customKey =
    typeof window !== 'undefined' ? (localStorage.getItem('akram_supabase_anon_key') || '').trim() : '';

  const url = customUrl || envUrl;
  const key = customKey || envKey;

  const isConfigured = isValidHttpUrl(url) && isValidAnonKey(key);

  return { url, key, isConfigured };
};

export const { url: supabaseUrl, key: supabaseAnonKey, isConfigured: isSupabaseConfigured } =
  getEnvConfig();

// Initialize the real Supabase client safely
let clientInstance: SupabaseClient | null = null;

if (isSupabaseConfigured && supabaseUrl && supabaseAnonKey && isValidHttpUrl(supabaseUrl)) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch {
    // If creation fails for any reason, safely fall back to null
    clientInstance = null;
  }
}

export const supabase = clientInstance;

export const updateSupabaseCredentials = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    const trimmedUrl = url.trim();
    const trimmedKey = key.trim();
    if (isValidHttpUrl(trimmedUrl) && isValidAnonKey(trimmedKey)) {
      localStorage.setItem('akram_supabase_url', trimmedUrl);
      localStorage.setItem('akram_supabase_anon_key', trimmedKey);
    } else {
      localStorage.removeItem('akram_supabase_url');
      localStorage.removeItem('akram_supabase_anon_key');
    }
  }
};
