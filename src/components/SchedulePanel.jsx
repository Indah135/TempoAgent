import React, { useState } from 'react';
import { CalendarDays, RefreshCw, Search, AlertCircle } from 'lucide-react';
import ScheduleCard from './ScheduleCard';
import EmptyState from './EmptyState';

export default function SchedulePanel({
  schedules,
  isLoading,
  error,
  onRefresh,
  onDelete,
  onQuickPrompt,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSchedules = schedules.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = (item.title || '').toLowerCase().includes(query);
    const descMatch = (item.description || '').toLowerCase().includes(query);
    const dateMatch = (item.schedule_date || '').toLowerCase().includes(query);
    return titleMatch || descMatch || dateMatch;
  });

  const glassPanel = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
  };

  return (
    <div className="rounded-2xl flex flex-col h-full min-h-0 overflow-hidden" style={glassPanel}>
      {/* Panel Header */}
      <div
        className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(139,92,246,0.25)' }}
          >
            <CalendarDays className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-sm">Agenda & Jadwal Aktif</h2>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-semibold text-purple-300"
                style={{ background: 'rgba(139,92,246,0.2)' }}
              >
                {schedules.length}
              </span>
            </div>
            <p className="text-[11px] text-white/40">Sinkronisasi real-time dengan Supabase</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari jadwal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg text-white placeholder-white/25 focus:outline-none focus:ring-1 transition-all"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Muat ulang jadwal"
            className="p-1.5 rounded-lg text-white/40 hover:text-purple-300 transition-colors disabled:opacity-50 shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content Area - Scrollable */}
      <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-3" style={{ background: 'rgba(0,0,0,0.1)' }}>
        {error && (
          <div
            className="p-3 rounded-xl text-xs flex items-center justify-between gap-2"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <div className="flex items-center gap-2 text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={onRefresh} className="underline font-semibold text-red-300 hover:text-red-200">
              Coba lagi
            </button>
          </div>
        )}

        {isLoading && schedules.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'rgba(139,92,246,0.5)', borderTopColor: 'transparent' }}
            />
            <p className="text-xs text-white/40">Memuat daftar jadwal...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          searchQuery ? (
            <div className="py-10 text-center text-white/30 text-xs">
              Tidak ada jadwal yang cocok dengan "{searchQuery}".
            </div>
          ) : (
            <EmptyState onQuickPrompt={onQuickPrompt} />
          )
        ) : (
          filteredSchedules.map((item) => (
            <ScheduleCard key={item.id} schedule={item} onDelete={onDelete} />
          ))
        )}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2.5 text-[11px] flex items-center justify-between shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', background: 'rgba(18,8,34,0.4)' }}
      >
        <span>Menampilkan {filteredSchedules.length} dari {schedules.length} jadwal</span>
        <span>Auto-refresh saat AI menjawab</span>
      </div>
    </div>
  );
}
