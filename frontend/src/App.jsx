import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import SchedulePanel from './components/SchedulePanel';
import { sendChatMessage, fetchSchedules, deleteSchedule } from './api';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // Mengambil daftar jadwal dari backend FastAPI (Supabase)
  const loadSchedules = useCallback(async () => {
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
  }, []);

  // Muat jadwal saat pertama kali aplikasi dibuka
  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

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
    // Refresh jadwal setelah dihapus
    await loadSchedules();
  };

  // Membersihkan riwayat chat tampilan
  const handleClearChat = () => {
    if (window.confirm('Bersihkan riwayat percakapan?')) {
      setMessages([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

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
