import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import SchedulePanel from './components/SchedulePanel';
import Auth from './components/Auth';
import SetupSupabase from './components/SetupSupabase';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { sendChatMessage, fetchSchedules, deleteSchedule } from './api';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);

  const [messages, setMessages] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // 1. Memeriksa session awal dan mendengarkan perubahan status autentikasi secara real-time
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    // Timeout pengaman agar layar loading tidak pernah menggantung (maksimal 2.5 detik)
    const timeout = setTimeout(() => {
      setAuthLoading(false);
    }, 2500);

    // Ambil session yang tersimpan
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

    // Pasang listener onAuthStateChange untuk mendeteksi login/logout secara real-time
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

  // 2. Mengambil daftar jadwal dari backend FastAPI (Supabase)
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
      // Sesuai requirement: Daftar jadwal otomatis ter-refresh setiap kali agent selesai membalas chat
      await loadSchedules();
    }
  };

  // Menghapus jadwal
  const handleDeleteSchedule = async (id) => {
    await deleteSchedule(id);
    await loadSchedules();
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
    }
  };

  // Jika konfigurasi Supabase belum dimasukkan di .env
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

  // Jika belum login, tampilkan halaman Login & Register
  if (!session) {
    return <Auth />;
  }

  // Jika sudah login, tampilkan halaman utama aplikasi
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header user={user} onLogout={handleLogout} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* Responsive 2-Column Dashboard Layout (Left: 40%, Right: 60%) */}
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
      </main>
    </div>
  );
}
