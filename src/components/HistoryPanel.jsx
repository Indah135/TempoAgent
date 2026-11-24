import React, { useState, useMemo } from 'react';
import {
  History,
  RefreshCw,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
  X,
} from 'lucide-react';
import ScheduleCard from './ScheduleCard';
import EmptyState from './EmptyState';
import {
  WORKSPACE_ITEMS,
  matchesWorkspace,
  countSchedulesByWorkspace,
  getWorkspaceInfo,
} from '../lib/workspaces';

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

function formatSavedAt(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function HistoryPanel({
  schedules,
  isLoading,
  error,
  source,
  savedAt,
  onRefresh,
  onDelete,
  onUpdate,
  onQuickPrompt,
  activeWorkspace = null,
  onSelectWorkspace,
}) {
  const [mode, setMode] = useState('week'); // 'all' | 'week' | 'month'
  const [offset, setOffset] = useState(0); // offset minggu (mode week)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');

  const workspaceCounts = useMemo(() => {
    return countSchedulesByWorkspace(schedules);
  }, [schedules]);

  const currentWs = useMemo(() => {
    return getWorkspaceInfo(activeWorkspace);
  }, [activeWorkspace]);

  const range = useMemo(
    () =>
      mode === 'week'
        ? getWeekRange(offset)
        : getMonthRange(selectedMonth, selectedYear),
    [mode, offset, selectedMonth, selectedYear]
  );
  const rangeLabel = useMemo(
    () => (mode === 'all' ? 'Semua waktu' : formatRangeLabel(mode, range)),
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

  // Filter jadwal pada periode aktif + pencarian kata kunci + workspace
  // (mode 'all' menampilkan seluruh jadwal tanpa batas periode)
  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return schedules
      .filter((item) => {
        // Filter workspace
        if (!matchesWorkspace(item, activeWorkspace)) return false;

        if (mode !== 'all') {
          const d = getItemDate(item);
          if (!d || d < range.start || d >= range.end) return false;
        }
        if (!query) return true;
        return (
          (item.title || '').toLowerCase().includes(query) ||
          (item.description || '').toLowerCase().includes(query) ||
          (item.status || '').toLowerCase().includes(query) ||
          (item.workspace || '').toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const da = getItemDate(a)?.getTime() ?? 0;
        const db = getItemDate(b)?.getTime() ?? 0;
        return da - db;
      });
  }, [schedules, range, searchQuery, mode, activeWorkspace]);

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
    { id: 'all', label: 'Semua' },
    { id: 'week', label: 'Mingguan' },
    { id: 'month', label: 'Bulanan' },
  ];

  return (
    <div
      className="rounded-2xl flex flex-col h-full overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Panel Header */}
      <div
        className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.25)' }}
          >
            <History className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-sm">
                Riwayat Tugas & Jadwal
              </h2>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-semibold text-purple-300"
                style={{ background: 'rgba(139,92,246,0.2)' }}
              >
                {filtered.length}
              </span>
              {source === 'cache' && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  title={`Backend tidak terhubung. Menampilkan data tersimpan di perangkat${
                    savedAt ? ` (tersimpan ${formatSavedAt(savedAt)})` : ''
                  }.`}
                  style={{
                    background: 'rgba(251,191,36,0.15)',
                    color: '#fbbf24',
                    border: '1px solid rgba(251,191,36,0.3)',
                  }}
                >
                  Offline — data lokal{savedAt ? ` (${formatSavedAt(savedAt)})` : ''}
                </span>
              )}
              {source === 'supabase' && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  title="Backend tidak terhubung — riwayat dimuat langsung dari Supabase."
                  style={{
                    background: 'rgba(52,211,153,0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(52,211,153,0.3)',
                  }}
                >
                  Langsung Supabase
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/40">
              Semua jadwal tersimpan permanen — tampilan per minggu, per bulan, atau semua
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari tugas..."
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
            title="Muat ulang riwayat"
            className="p-1.5 rounded-lg text-white/40 hover:text-purple-300 transition-colors disabled:opacity-50 shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Workspace Quick-Tabs Bar */}
      <div
        className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none"
        style={{
          background: 'rgba(10, 4, 22, 0.45)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider pr-1 shrink-0">
          Workspace:
        </span>

        {/* Tab: Semua */}
        <button
          type="button"
          onClick={() => onSelectWorkspace && onSelectWorkspace(null)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeWorkspace === null
              ? 'text-white bg-white/15 border border-white/20'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <Layers className="w-3 h-3 text-purple-300" />
          <span>Semua</span>
          <span className="text-[10px] opacity-70">({workspaceCounts.all})</span>
        </button>

        {/* 3 Workspaces */}
        {WORKSPACE_ITEMS.map((ws) => {
          const Icon = ws.icon;
          const isActive = activeWorkspace === ws.name;
          const count = workspaceCounts[ws.name] ?? 0;

          return (
            <button
              key={ws.id}
              type="button"
              onClick={() => onSelectWorkspace && onSelectWorkspace(ws.name)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'text-white border shadow-sm'
                  : 'text-white/55 hover:text-white hover:bg-white/5'
              }`}
              style={
                isActive
                  ? {
                      background: ws.activeBg,
                      borderColor: ws.badgeBorder,
                      color: ws.textColor,
                    }
                  : {}
              }
            >
              <Icon
                className="w-3 h-3"
                style={{ color: isActive ? ws.textColor : 'rgba(255,255,255,0.4)' }}
              />
              <span>{ws.shortLabel}</span>
              <span className="text-[10px] opacity-80">({count})</span>
            </button>
          );
        })}

        {activeWorkspace && (
          <button
            type="button"
            onClick={() => onSelectWorkspace && onSelectWorkspace(null)}
            className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0"
          >
            <X className="w-3 h-3" />
            <span className="hidden sm:inline">Hapus filter</span>
          </button>
        )}
      </div>

      {/* Filter Periode */}
      <div
        className="px-4 py-3 flex flex-wrap items-center justify-between gap-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
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
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
              style={mode === tab.id ? { background: 'rgba(139,92,246,0.3)' } : {}}
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
              className="p-1.5 rounded-lg text-white/40 hover:text-purple-300 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleReset}
              title="Kembali ke minggu ini"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-purple-300 transition-colors min-w-[150px]"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              {rangeLabel}
            </button>

            <button
              type="button"
              onClick={handleNext}
              title="Minggu berikutnya"
              className="p-1.5 rounded-lg text-white/40 hover:text-purple-300 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : mode === 'month' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              title="Bulan sebelumnya"
              className="p-1.5 rounded-lg text-white/40 hover:text-purple-300 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              aria-label="Pilih bulan"
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-purple-300 cursor-pointer focus:outline-none"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx} style={{ background: '#1e0a3c', color: '#e2e8f0' }}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Pilih tahun"
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-purple-300 cursor-pointer focus:outline-none"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y} style={{ background: '#1e0a3c', color: '#e2e8f0' }}>
                  {y}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleNext}
              title="Bulan berikutnya"
              className="p-1.5 rounded-lg text-white/40 hover:text-purple-300 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3" style={{ background: 'rgba(0,0,0,0.1)' }}>
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
            <p className="text-xs text-white/40">Memuat riwayat tugas...</p>
          </div>
        ) : filtered.length === 0 ? (
          searchQuery ? (
            <div className="py-10 text-center text-white/30 text-xs">
              Tidak ada tugas yang cocok dengan kata kunci "{searchQuery}".
            </div>
          ) : schedules.length === 0 ? (
            <EmptyState onQuickPrompt={onQuickPrompt} />
          ) : (
            <div
              className="py-10 text-center rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px dashed rgba(139,92,246,0.25)',
              }}
            >
              <p className="text-sm font-semibold text-white/70 mb-1">
                {mode === 'all'
                  ? 'Belum ada jadwal tersimpan'
                  : 'Tidak ada tugas pada periode ini'}
              </p>
              <p className="text-xs text-white/30">
                {mode === 'week'
                  ? 'Tidak ada jadwal pada minggu ini. Coba pindah minggu dengan tombol ‹ ›.'
                  : mode === 'month'
                    ? 'Tidak ada jadwal pada bulan ini. Pilih bulan lain di dropdown.'
                    : 'Buat jadwal lewat chat AI — semua jadwal otomatis tersimpan permanen di sini.'}
              </p>
              {mode !== 'all' && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-3 text-xs font-semibold text-purple-400 hover:text-purple-300 underline"
                >
                  Kembali ke periode sekarang
                </button>
              )}
            </div>
          )
        ) : (
          filtered.map((item) => (
            <ScheduleCard
              key={item.id}
              schedule={item}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2.5 text-[11px] flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}
      >
        <span>Menampilkan {filtered.length} dari {schedules.length} total jadwal</span>
        <span>Periode: {rangeLabel}</span>
      </div>
    </div>
  );
}
