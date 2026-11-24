import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  RefreshCw,
  Search,
  AlertCircle,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import ScheduleCard from './ScheduleCard';
import EmptyState from './EmptyState';
import {
  WORKSPACE_ITEMS,
  matchesWorkspace,
  countSchedulesByWorkspace,
  getWorkspaceInfo,
} from '../lib/workspaces';

export default function SchedulePanel({
  schedules,
  isLoading,
  error,
  onRefresh,
  onDelete,
  onUpdate,
  onQuickPrompt,
  activeWorkspace = null,
  onSelectWorkspace,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Hitung jumlah per workspace
  const workspaceCounts = useMemo(() => {
    return countSchedulesByWorkspace(schedules);
  }, [schedules]);

  // Info workspace aktif
  const currentWs = useMemo(() => {
    return getWorkspaceInfo(activeWorkspace);
  }, [activeWorkspace]);

  // Filter jadwal berdasarkan workspace aktif & kata kunci pencarian
  const filteredSchedules = useMemo(() => {
    return schedules.filter((item) => {
      // Filter 1: Workspace
      if (!matchesWorkspace(item, activeWorkspace)) {
        return false;
      }

      // Filter 2: Search Query
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const titleMatch = (item.title || '').toLowerCase().includes(query);
      const descMatch = (item.description || '').toLowerCase().includes(query);
      const dateMatch = (item.schedule_date || '').toLowerCase().includes(query);
      const wsMatch = (item.workspace || '').toLowerCase().includes(query);
      return titleMatch || descMatch || dateMatch || wsMatch;
    });
  }, [schedules, activeWorkspace, searchQuery]);

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
            style={{
              background: currentWs?.badgeBg || 'rgba(139,92,246,0.25)',
              border: `1px solid ${currentWs?.badgeBorder || 'rgba(139,92,246,0.4)'}`,
            }}
          >
            {currentWs ? (
              <currentWs.icon className="w-4 h-4" style={{ color: currentWs.textColor }} />
            ) : (
              <CalendarDays className="w-4 h-4 text-purple-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-sm">
                {currentWs ? currentWs.label : 'Agenda & Jadwal Aktif'}
              </h2>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-semibold text-purple-300"
                style={{ background: 'rgba(139,92,246,0.2)' }}
              >
                {filteredSchedules.length}
              </span>
            </div>
            <p className="text-[11px] text-white/40">
              {currentWs
                ? currentWs.description
                : 'Sinkronisasi real-time dengan Supabase'}
            </p>
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
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
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

      {/* Workspace Quick-Tabs Bar */}
      <div
        className="px-3.5 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none"
        style={{
          background: 'rgba(10, 4, 22, 0.45)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider pl-1 pr-1 shrink-0">
          Workspace:
        </span>

        {/* Tab: Semua */}
        <button
          type="button"
          onClick={() => onSelectWorkspace && onSelectWorkspace(null)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeWorkspace === null
              ? 'text-white bg-white/15 border border-white/20 shadow-sm'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <Layers className="w-3 h-3 text-purple-300" />
          <span>Semua</span>
          <span className="text-[10px] opacity-70">({workspaceCounts.all})</span>
        </button>

        {/* Tab 3 Workspace */}
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

        {/* Clear Filter Tag jika ada workspace yang aktif */}
        {activeWorkspace && (
          <button
            type="button"
            onClick={() => onSelectWorkspace && onSelectWorkspace(null)}
            title="Hapus filter workspace"
            className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0"
          >
            <X className="w-3 h-3" />
            <span className="hidden sm:inline">Hapus filter</span>
          </button>
        )}
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
              Tidak ada jadwal yang cocok dengan "{searchQuery}"{' '}
              {activeWorkspace && `di workspace "${activeWorkspace}"`}.
            </div>
          ) : currentWs ? (
            /* Empty state khusus workspace yang dipilih */
            <div
              className="rounded-2xl p-6 sm:p-8 text-center"
              style={{
                background: currentWs.badgeBg,
                border: `1px dashed ${currentWs.badgeBorder}`,
              }}
            >
              <div
                className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3.5"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: currentWs.textColor,
                }}
              >
                <currentWs.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-white text-sm sm:text-base mb-1">
                Belum Ada Agenda di {currentWs.label}
              </h3>
              <p className="text-xs text-white/50 max-w-sm mx-auto mb-4 leading-relaxed">
                {currentWs.description}. Anda dapat meminta AI untuk menyusunnya secara otomatis.
              </p>
              {onQuickPrompt && (
                <button
                  type="button"
                  onClick={() => onQuickPrompt(currentWs.emptyPrompt)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-150 active:scale-95 hover:brightness-110"
                  style={{
                    background: `linear-gradient(135deg, ${currentWs.accentColor}, #9333ea)`,
                    boxShadow: `0 0 16px ${currentWs.badgeBg}`,
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-white/90" />
                  <span>Buat Jadwal Otomatis di Workspace Ini</span>
                </button>
              )}
            </div>
          ) : (
            <EmptyState onQuickPrompt={onQuickPrompt} />
          )
        ) : (
          filteredSchedules.map((item) => (
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
        className="px-4 py-2.5 text-[11px] flex items-center justify-between shrink-0"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.3)',
          background: 'rgba(18,8,34,0.4)',
        }}
      >
        <span>
          Menampilkan {filteredSchedules.length} dari {schedules.length} jadwal{' '}
          {activeWorkspace ? `(${activeWorkspace})` : '(Semua Workspace)'}
        </span>
        <span>Auto-refresh saat AI menjawab</span>
      </div>
    </div>
  );
}
