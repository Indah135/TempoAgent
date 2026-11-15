import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import SchedulePanel from './components/SchedulePanel';
import Auth from './components/Auth';
import SetupSupabase from './components/SetupSupabase';
import Sidebar, { MENU_ITEMS } from './components/Sidebar';
import ProfilePanel from './components/ProfilePanel';
import HistoryPanel from './components/HistoryPanel';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { sendChatMessage, fetchSchedules, fetchAllSchedules, deleteSchedule } from './api';
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

  // Data lengkap (termasuk jadwal lampau) khusus untuk Riwayat Tugas
  const [allSchedules, setAllSchedules] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

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
      const data = await fetchSchedules();
      setSchedules(data);
    } catch (err) {
      console.error('Gagal mengambil jadwal:', err);
      setScheduleError('Gagal memuat jadwal dari server.');
    } finally {
      setIsLoadingSchedules(false);
    }
  }, [session]);

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
      const reply = await sendChatMessage(text);
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 mb-4 animate-bounce">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-xs text-slate-500 font-medium animate-pulse">
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
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar kiri (sidebar) */}
      <Sidebar
        active={activeMenu}
        onNavigate={setActiveMenu}
        user={user}
        onLogout={handleLogout}
      />

      {/* Konten utama: digeser ke sebelah kanan sidebar */}
      <div className="md:pl-56 flex flex-col min-h-screen">
        <Header user={user} />

        {/* Navigasi menu versi mobile (tampil di bawah header) */}
        <nav className="md:hidden bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3 py-2 flex gap-1.5 overflow-x-auto">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveMenu(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 border border-sky-200/70'
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
          {activeMenu === 'dashboard' && (
            /* Dashboard: 2-Column Layout (Left: 40%, Right: 60%) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[600px] lg:h-[calc(100vh-130px)]">
              {/* Kolom Kiri: 40% (lg:col-span-5) - Panel Chat Interaktif */}
              <section className="lg:col-span-5 h-[580px] lg:h-full flex flex-col">
                <ChatPanel
                  messages={messages}
                  isSending={isSending}
                  onSendMessage={handleSendMessage}
                  onClearChat={handleClearChat}
                />
              </section>

              {/* Kolom Kanan: 60% (lg:col-span-7) - Panel Agenda & Jadwal Aktif */}
              <section className="lg:col-span-7 h-[580px] lg:h-full flex flex-col">
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
            /* Riwayat Tugas: filter mingguan & bulanan */
            <div className="flex-1 min-h-[600px] lg:h-[calc(100vh-130px)] flex flex-col">
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
            /* Profil: informasi akun pengguna */
            <div className="flex-1 min-h-[500px] lg:h-[calc(100vh-130px)] flex flex-col">
              <ProfilePanel user={user} schedules={schedules} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
