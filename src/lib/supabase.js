import { createClient } from '@supabase/supabase-js';

// 1. Ambil dari environment variables Vite
const envUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  '';

const envKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY ||
  import.meta.env.SUPABASE_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  '';

// 2. Ambil dari localStorage (jika diinput langsung di layar atau Vite belum di-restart)
const localUrl =
  typeof window !== 'undefined'
    ? localStorage.getItem('tempo_supabase_url') || ''
    : '';
const localKey =
  typeof window !== 'undefined'
    ? localStorage.getItem('tempo_supabase_key') || ''
    : '';

const rawUrl = (envUrl || localUrl).trim().replace(/^['"]|['"]$/g, '');
const rawKey = (envKey || localKey).trim().replace(/^['"]|['"]$/g, '');

export const supabaseUrl = rawUrl;
export const supabaseAnonKey = rawKey;

// Cek apakah konfigurasi Supabase valid dan bukan placeholder default
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseUrl.includes('<id-proyek-anda>') &&
  !supabaseUrl.includes('<id-proyek>')
);

// Fallback aman agar createClient tidak pernah melempar unhandled error saat module di-load
const safeUrl = isSupabaseConfigured
  ? supabaseUrl
  : 'https://placeholder-project.supabase.co';
const safeKey = isSupabaseConfigured
  ? supabaseAnonKey
  : 'placeholder-anon-key-prevent-crash';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Helper untuk menyimpan konfigurasi langsung dari antarmuka web
export function saveManualSupabaseConfig(url, key) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tempo_supabase_url', url.trim());
    localStorage.setItem('tempo_supabase_key', key.trim());
    window.location.reload();
  }
}

export function clearManualSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tempo_supabase_url');
    localStorage.removeItem('tempo_supabase_key');
    window.location.reload();
  }
}
