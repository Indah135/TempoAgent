import React, { useState, useMemo } from 'react';
import {
  History,
  RefreshCw,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import ScheduleCard from './ScheduleCard';
import EmptyState from './EmptyState';

// Rentang minggu berjalan (Senin s/d Minggu) dengan offset minggu
function getWeekRange(offset) {
  const now = new Date();
  const day = now.getDay(); // 0 = Minggu
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday + offset * 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7); // batas atas (eksklusif)
  return { start, end };
}

// Rentang bulan berdasarkan pilihan bulan (0-11) & tahun
function getMonthRange(month, year) {
  const start = new Date(year, month, 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(year, month + 1, 1);
  return { start, end };
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function formatRangeLabel(mode, { start, end }) {
  if (mode === 'month') {
    return start.toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    });
  }
  const lastDay = new Date(end);
  lastDay.setDate(end.getDate() - 1);
  const sameMonth =
    start.getMonth() === lastDay.getMonth() &&
    start.getFullYear() === lastDay.getFullYear();
  if (sameMonth) {
    return `${start.getDate()}–${lastDay.getDate()} ${start.toLocaleDateString(
      'id-ID',
      { month: 'short', year: 'numeric' }
    )}`;
  }
  return `${start.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })} – ${lastDay.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}

function getItemDate(item) {
  const raw = item.start_time || item.schedule_date;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function HistoryPanel({
  schedules,
  isLoading,
  error,
  onRefresh,
  onDelete,
  onQuickPrompt,
}) {
  const [mode, setMode] = useState('week'); // 'week' | 'month'
  const [offset, setOffset] = useState(0); // offset minggu (mode week)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');

  const range = useMemo(
    () =>
      mode === 'week'
        ? getWeekRange(offset)
        : getMonthRange(selectedMonth, selectedYear),
    [mode, offset, selectedMonth, selectedYear]
  );
  const rangeLabel = useMemo(
    () => formatRangeLabel(mode, range),
    [mode, range]
  );

  // Opsi tahun: tahun pada data riwayat digabung tahun berjalan
  const yearOptions = useMemo(() => {
    const years = new Set([new Date().getFullYear()]);
    schedules.forEach((item) => {
      const d = getItemDate(item);
      if (d) years.add(d.getFullYear());
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [schedules]);

  // Filter jadwal pada periode aktif + pencarian kata kunci
  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return schedules
      .filter((item) => {
        const d = getItemDate(item);
        if (!d || d < range.start || d >= range.end) return false;
        if (!query) return true;
        return (
          (item.title || '').toLowerCase().includes(query) ||
          (item.description || '').toLowerCase().includes(query) ||
          (item.status || '').toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const da = getItemDate(a)?.getTime() ?? 0;
        const db = getItemDate(b)?.getTime() ?? 0;
        return da - db;
      });
  }, [schedules, range, searchQuery]);

  const handlePrev = () => {
    if (mode === 'week') {
      setOffset((o) => o - 1);
    } else {
      const d = new Date(selectedYear, selectedMonth - 1, 1);
      setSelectedMonth(d.getMonth());
      setSelectedYear(d.getFullYear());
    }
  };
  const handleNext = () => {
    if (mode === 'week') {
      setOffset((o) => o + 1);
    } else {
      const d = new Date(selectedYear, selectedMonth + 1, 1);
      setSelectedMonth(d.getMonth());
      setSelectedYear(d.getFullYear());
    }
  };
  const handleReset = () => {
    setMode('week');
    setOffset(0);
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
  };

  const tabs = [
    { id: 'week', label: 'Mingguan' },
    { id: 'month', label: 'Bulanan' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center font-bold">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 text-base">
                Riwayat Tugas & Jadwal
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                {filtered.length}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Tampilan per minggu dan per bulan
            </p>
          </div>
        </div>

        {/* Action Buttons: Refresh & Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari tugas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Muat ulang riwayat"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Filter Periode: Mingguan / Bulanan + Navigasi */}
      <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMode(tab.id);
                setOffset(0);
                setSelectedMonth(new Date().getMonth());
                setSelectedYear(new Date().getFullYear());
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                mode === tab.id
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/70'
                  : 'text-slate-500 hover:text-slate-700 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mode === 'week' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              title="Minggu sebelumnya"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleReset}
              title="Kembali ke minggu ini"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors min-w-[150px]"
            >
              {rangeLabel}
            </button>

            <button
              type="button"
              onClick={handleNext}
              title="Minggu berikutnya"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Dropdown bulan (Januari–Desember) + tahun */
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              title="Bulan sebelumnya"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              aria-label="Pilih bulan"
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Pilih tahun"
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleNext}
              title="Bulan berikutnya"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
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
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Memuat riwayat tugas...</p>
          </div>
        ) : filtered.length === 0 ? (
          searchQuery ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              Tidak ada tugas yang cocok dengan kata kunci "{searchQuery}".
            </div>
          ) : schedules.length === 0 ? (
            <EmptyState onQuickPrompt={onQuickPrompt} />
          ) : (
            <div className="py-10 text-center bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-sm font-semibold text-slate-600 mb-1">
                Tidak ada tugas pada periode ini
              </p>
              <p className="text-xs text-slate-400">
                {mode === 'week'
                  ? 'Tidak ada jadwal pada minggu ini. Coba pindah minggu dengan tombol ‹ ›.'
                  : 'Tidak ada jadwal pada bulan ini. Pilih bulan lain di dropdown.'}
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
              >
                Kembali ke periode sekarang
              </button>
            </div>
          )
        ) : (
          filtered.map((item) => (
            <ScheduleCard key={item.id} schedule={item} onDelete={onDelete} />
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-white text-[11px] text-slate-500 flex items-center justify-between">
        <span>
          Menampilkan {filtered.length} dari {schedules.length} total jadwal
        </span>
        <span className="text-slate-400">Periode: {rangeLabel}</span>
      </div>
    </div>
  );
}
