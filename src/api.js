import {
  loadHistoryCache,
  saveHistoryCache,
  removeFromHistoryCache,
  fetchHistoryFromSupabase,
  deleteScheduleFromSupabase,
} from './lib/historyStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function sendChatMessage(message, timezone, workspace) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      timezone: timezone || null,
      workspace: workspace || null,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server returned ${response.status}`);
  }

  const data = await response.json();
  return data.reply;
}

export async function fetchSchedules(timezone) {
  const query = timezone
    ? `?timezone_name=${encodeURIComponent(timezone)}`
    : '';
  const response = await fetch(`${API_BASE_URL}/api/schedules${query}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server returned ${response.status}`);
  }

  const data = await response.json();
  return data.schedules || [];
}

export async function fetchAllSchedules(userId) {
  // 1. Utamakan backend FastAPI
  try {
    const response = await fetch(`${API_BASE_URL}/api/schedules/all`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server returned ${response.status}`);
    }
    const data = await response.json();
    const schedules = data.schedules || [];
    saveHistoryCache(schedules);
    return { schedules, source: 'server', savedAt: new Date().toISOString() };
  } catch (serverErr) {
    // 2. Backend mati → query langsung ke Supabase
    try {
      const schedules = await fetchHistoryFromSupabase(userId);
      saveHistoryCache(schedules);
      return {
        schedules,
        source: 'supabase',
        savedAt: new Date().toISOString(),
      };
    } catch {
      // 3. Supabase tak terjangkau → pakai cache lokal terakhir
      const cached = loadHistoryCache();
      if (cached) {
        return {
          schedules: cached.schedules,
          source: 'cache',
          savedAt: cached.savedAt,
        };
      }
      throw new Error(
        `Gagal memuat riwayat: server tidak terhubung dan belum ada data tersimpan di perangkat ini. (${serverErr.message})`
      );
    }
  }
}

export async function deleteSchedule(scheduleId) {
  // 1. Utamakan backend FastAPI
  try {
    const response = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server returned ${response.status}`);
    }
    removeFromHistoryCache(scheduleId);
    return await response.json();
  } catch (serverErr) {
    // 2. Backend mati → hapus langsung dari Supabase
    try {
      await deleteScheduleFromSupabase(scheduleId);
      removeFromHistoryCache(scheduleId);
      return {
        success: true,
        message: 'Jadwal berhasil dihapus (sinkron langsung ke Supabase).',
      };
    } catch {
      throw new Error(
        `Gagal menghapus jadwal: server tidak terhubung dan Supabase tidak bisa diakses. (${serverErr.message})`
      );
    }
  }
}

export async function updateSchedule(scheduleId, updates, timezone) {
  const response = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...updates, timezone: timezone || null }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server returned ${response.status}`);
  }

  return await response.json();
}

export async function uploadScheduleFile(file, timezone, workspace) {
  const formData = new FormData();
  formData.append('file', file);
  if (timezone) {
    formData.append('timezone_name', timezone);
  }
  if (workspace) {
    formData.append('workspace', workspace);
  }

  const response = await fetch(`${API_BASE_URL}/api/upload-schedule`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server returned ${response.status}`);
  }

  return await response.json();
}
