import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import SchedulePanel from './components/SchedulePanel';
import Auth from './components/Auth';
import SetupSupabase from './components/SetupSupabase';
import Sidebar, { MENU_ITEMS } from './components/Sidebar';
import ProfilePanel from './components/ProfilePanel';
import HistoryPanel from './components/HistoryPanel';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { detectTimezone } from './lib/timezone';
import { sendChatMessage, fetchSchedules, fetchAllSchedules, deleteSchedule, uploadScheduleFile } from './api';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [unauthorizedError, setUnauthorizedError] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const [messages, setMessages] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Data lengkap (termasuk jadwal lampau) khusus untuk Riwayat Tugas
  const [allSchedules, setAllSchedules] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Zona waktu pengguna (WIB/WITA/WIT): dari profil, fallback deteksi browser
  const detectedTimezone = useMemo(() => detectTimezone(), []);
  const timezone = user?.user_metadata?.timezone || detectedTimezone;

  // 1. Memeriksa session awal dan mendengarkan perubahan status autentikasi secara real-time
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      setAuthLoading(false);
    }, 2500);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setAuthLoading(false);
        clearTimeout(timeout);
      })
      .catch((err) => {
        console.warn('Gagal membaca sesi Supabase:', err);
        setAuthLoading(false);
        clearTimeout(timeout);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
      clearTimeout(timeout);
    });

    return () => {
      clearTimeout(timeout);
      subscription?.unsubscribe?.();
    };
  }, []);

  // 2. Route Guard & Proteksi URL Otomatis
  // Menjaga agar siapapun yang mencoba membuka URL /dashboard, /agenda, dll sebelum login
  // otomatis ditolak, muncul error 401, dan URL dikembalikan ke /login
  useEffect(() => {
    if (authLoading) return;

    const checkUrlAccess = () => {
      const currentPath = window.location.pathname.toLowerCase();

      if (!session) {
        // Jika belum login, hanya rute root (/) dan (/login) yang diizinkan
        if (currentPath !== '/' && currentPath !== '/login') {
          setUnauthorizedError(
            `Akses Ditolak: Anda mencoba membuka URL '${window.location.pathname}'. Halaman tersebut diproteksi dan memerlukan login terlebih dahulu.`
          );
          // Otomatis kembalikan URL address bar ke /login
          window.history.replaceState(null, '', '/login');
        }
      } else {
        // Jika sudah login, bersihkan error unauthorized dan arahkan rute ke /dashboard
        setUnauthorizedError(null);
        if (currentPath === '/' || currentPath === '/login') {
          window.history.replaceState(null, '', '/dashboard');
        }
      }
    };

    // Jalankan pengecekan URL saat pertama kali status auth didapat
    checkUrlAccess();

    // Pantau juga tombol Back/Forward browser
    window.addEventListener('popstate', checkUrlAccess);
    return () => window.removeEventListener('popstate', checkUrlAccess);
  }, [session, authLoading]);

  // 3. Mengambil daftar jadwal dari backend FastAPI (Supabase)
  const loadSchedules = useCallback(async () => {
    if (!session) return;
    setIsLoadingSchedules(true);
    setScheduleError(null);
    try {
      const data = await fetchSchedules(timezone);
      setSchedules(data);
    } catch (err) {
      console.error('Gagal mengambil jadwal:', err);
      setScheduleError('Gagal memuat jadwal dari server.');
    } finally {
      setIsLoadingSchedules(false);
    }
  }, [session, timezone]);

  // Muat jadwal saat pertama kali user login
  useEffect(() => {
    if (session) {
      loadSchedules();
    }
  }, [session, loadSchedules]);

  // Muat seluruh riwayat jadwal saat tab Riwayat Tugas dibuka
  const loadAllSchedules = useCallback(async () => {
    if (!session) return;
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const data = await fetchAllSchedules();
      setAllSchedules(data);
    } catch (err) {
      console.error('Gagal mengambil riwayat jadwal:', err);
      setHistoryError('Gagal memuat riwayat dari server.');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [session]);

  useEffect(() => {
    if (session && activeMenu === 'history') {
      loadAllSchedules();
    }
  }, [session, activeMenu, loadAllSchedules]);

  // Mengirim pesan ke AI agent & otomatis me-refresh jadwal setelah AI selesai merespons
  const handleSendMessage = async (text) => {
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const reply = await sendChatMessage(text, timezone);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Maaf, terjadi kesalahan saat menghubungi server: ${err.message}`,
        },
      ]);
    } finally {
      setIsSending(false);
      await loadSchedules();
      if (activeMenu === 'history') await loadAllSchedules();
    }
  };

  // Mengunggah file foto atau dokumen untuk ekstraksi jadwal otomatis via AI
  const handleUploadFile = async (file) => {
    if (!file) return;

    const userMsg = {
      role: 'user',
      content: `📎 Mengunggah file jadwal: **${file.name}** (${(file.size / 1024).toFixed(1)} KB)...`,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);
    setIsUploading(true);

    try {
      const result = await uploadScheduleFile(file, userTimezone);

      let summaryText = `✅ **Berhasil mengekstrak ${result.count} jadwal dari "${result.filename}"!**\n\nJadwal otomatis disimpan ke database (Workspace: **${result.workspace}**):\n`;
      if (result.extracted_items && result.extracted_items.length > 0) {
        result.extracted_items.forEach((item, idx) => {
          summaryText += `\n${idx + 1}. **${item.title}**\n   📅 **${item.day}** | ⏰ **${item.start_time} - ${item.end_time}**${item.description ? `\n   📝 ${item.description}` : ''}`;
        });
      }
      summaryText += `\n\n💡 *Daftar agenda di sebelah kanan telah diperbarui secara otomatis.*`;

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: summaryText },
      ]);
    } catch (err) {
      console.error('Upload schedule error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ **Gagal mengekstrak jadwal dari "${file.name}":**\n${err.message}\n\n*Pastikan file berisi teks/tabel jadwal yang jelas (format yang didukung: JPG, PNG, WEBP, PDF, Excel, CSV).*`,
        },
      ]);
    } finally {
      setIsSending(false);
      setIsUploading(false);
      await loadSchedules();
      if (activeMenu === 'history') await loadAllSchedules();
    }
  };

  // Menghapus jadwal
  const handleDeleteSchedule = async (id) => {
    await deleteSchedule(id);
    await loadSchedules();
    if (activeMenu === 'history') await loadAllSchedules();
  };

  // Membersihkan riwayat chat tampilan
  const handleClearChat = () => {
    if (window.confirm('Bersihkan riwayat percakapan?')) {
      setMessages([]);
    }
  };

  // Logout dari Supabase
  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar (logout)?')) {
      await supabase.auth.signOut();
      setMessages([]);
      setSchedules([]);
      setAllSchedules([]);
      // Arahkan kembali URL ke /login saat logout
      window.history.replaceState(null, '', '/login');
    }
  };

  // Jika konfigurasi Supabase belum dimasukkan
  if (!isSupabaseConfigured) {
    return <SetupSupabase />;
  }

  // Tampilan Loading saat memeriksa session awal
  if (authLoading) {
    return (
      <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 animate-bounce"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)', boxShadow: '0 0 30px rgba(139,92,246,0.5)' }}>
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-xs text-purple-300 font-medium animate-pulse">
          Memeriksa autentikasi Supabase...
        </p>
      </div>
    );
  }

  // Jika belum login, tampilkan halaman Login & Register beserta pesan Unauthorized jika mencoba bypass via URL
  if (!session) {
    return <Auth unauthorizedError={unauthorizedError} />;
  }

  // Jika sudah login, tampilkan halaman utama aplikasi
  return (
    <div className="bg-app flex items-center justify-center h-screen w-screen p-2 sm:p-4 lg:p-5 overflow-hidden font-sans">
      {/* Floating Frosted Glass Window Container (Konsep Clarity Glass) */}
      <div className="glass-window flex flex-col md:flex-row w-full h-full max-w-[1720px] rounded-[22px] sm:rounded-[28px] overflow-hidden relative">
        {/* Sidebar kiri — sekarang berada di dalam floating glass container */}
        <Sidebar
          active={activeMenu}
          onNavigate={setActiveMenu}
          user={user}
          onLogout={handleLogout}
        />

        {/* Konten utama di sebelah kanan sidebar */}
        <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
          <Header user={user} timezone={timezone} onNavigate={setActiveMenu} />

          {/* Navigasi menu versi mobile */}
          <nav
            className="md:hidden shrink-0 px-3 py-2 flex gap-1.5 overflow-x-auto"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(18,8,34,0.5)',
            }}
          >
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveMenu(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive ? 'text-white' : 'text-white/50'
                  }`}
                  style={isActive ? { background: 'rgba(139,92,246,0.25)' } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <main className="flex-1 min-h-0 p-3 sm:p-4 lg:p-5 overflow-hidden">
            {activeMenu === 'dashboard' && (
              /* Dashboard: 2-Column Layout */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 h-full min-h-0">
                {/* Kolom Kiri: Chat */}
                <section className="lg:col-span-5 h-full min-h-0 flex flex-col">
                  <ChatPanel
                    messages={messages}
                    isSending={isSending}
                    isUploading={isUploading}
                    onSendMessage={handleSendMessage}
                    onUploadFile={handleUploadFile}
                    onClearChat={handleClearChat}
                  />
                </section>

                {/* Kolom Kanan: Agenda */}
                <section className="lg:col-span-7 h-full min-h-0 flex flex-col">
                  <SchedulePanel
                    schedules={schedules}
                    isLoading={isLoadingSchedules}
                    error={scheduleError}
                    onRefresh={loadSchedules}
                    onDelete={handleDeleteSchedule}
                    onQuickPrompt={handleSendMessage}
                  />
                </section>
              </div>
            )}

            {activeMenu === 'history' && (
              <div className="h-full min-h-0 flex flex-col">
                <HistoryPanel
                  schedules={allSchedules}
                  isLoading={isLoadingHistory}
                  error={historyError}
                  onRefresh={loadAllSchedules}
                  onDelete={handleDeleteSchedule}
                  onQuickPrompt={handleSendMessage}
                />
              </div>
            )}

            {activeMenu === 'profile' && (
              <div className="h-full min-h-0 flex flex-col">
                <ProfilePanel
                  user={user}
                  schedules={schedules}
                  timezone={timezone}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
