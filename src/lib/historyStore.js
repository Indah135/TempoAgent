import { supabase } from './supabase';

// Cache riwayat jadwal di localStorage agar halaman Arsip/Riwayat tetap bisa
// dibuka walau backend FastAPI dimatikan atau browser di-reload.
const CACHE_KEY = 'tempo_history_cache';
const HISTORY_LIMIT = 500;

export function loadHistoryCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.schedules)) return null;
    return { savedAt: parsed.savedAt || null, schedules: parsed.schedules };
  } catch {
    return null;
  }
}

export function saveHistoryCache(schedules) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ savedAt: new Date().toISOString(), schedules })
    );
  } catch {
    // Storage penuh/di-block browser — abaikan, bukan error fatal.
  }
}

export function removeFromHistoryCache(scheduleId) {
  const cached = loadHistoryCache();
  if (!cached) return;
  saveHistoryCache(
    cached.schedules.filter((item) => item.id !== scheduleId)
  );
}

// Query langsung ke Supabase (tanpa backend) — dipakai saat server mati.
export async function fetchHistoryFromSupabase(userId) {
  const build = (withUser) => {
    let req = supabase
      .from('schedules')
      .select('*')
      .order('start_time', { ascending: true })
      .limit(HISTORY_LIMIT);
    if (withUser && userId) req = req.eq('user_id', userId);
    return req;
  };

  const { data, error } = await build(true);
  if (error) throw error;

  // Jika filter user menghasilkan kosong (mis. user_id berbeda), ulangi tanpa
  // filter agar riwayat tetap tampil — aplikasi ini bersifat single-user.
  if ((!data || data.length === 0) && userId) {
    const retry = await build(false);
    if (retry.error) throw retry.error;
    return retry.data || [];
  }
  return data || [];
}

// Hapus langsung dari Supabase — dipakai saat backend tidak terhubung.
export async function deleteScheduleFromSupabase(scheduleId) {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', scheduleId);
  if (error) throw error;
}
