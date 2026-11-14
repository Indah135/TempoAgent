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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-100/80 text-sky-700 flex items-center justify-center font-bold">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 text-base">
                Agenda & Jadwal Aktif
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
                {schedules.length}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Sinkronisasi real-time dengan Supabase
            </p>
          </div>
        </div>

        {/* Action Buttons: Refresh & Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari jadwal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Muat ulang jadwal"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-600' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3 bg-slate-50/40">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
            <button
              onClick={onRefresh}
              className="underline font-semibold hover:text-rose-900"
            >
              Coba lagi
            </button>
          </div>
        )}

        {isLoading && schedules.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Memuat daftar jadwal...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          searchQuery ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              Tidak ada jadwal yang cocok dengan kata kunci "{searchQuery}".
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

      {/* Footer Info */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-white text-[11px] text-slate-500 flex items-center justify-between">
        <span>Menampilkan {filteredSchedules.length} dari {schedules.length} jadwal mendatang</span>
        <span className="text-slate-400">Jadwal otomatis ter-refresh saat AI menjawab</span>
      </div>
    </div>
  );
}
