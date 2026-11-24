import React from 'react';
import {
  Sparkles,
  Plus,
  MessageSquare,
  Archive,
  User,
  Layers,
  ChevronRight,
  Check,
} from 'lucide-react';
import { WORKSPACE_ITEMS } from '../lib/workspaces';

export { WORKSPACE_ITEMS };

export const MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Chat',
    hint: 'Chat AI & ringkasan',
    icon: MessageSquare,
  },
  {
    id: 'history',
    label: 'Arsip / Riwayat',
    hint: 'Riwayat tugas & jadwal (mingguan/bulanan)',
    icon: Archive,
  },
  {
    id: 'profile',
    label: 'Profil Saya',
    hint: 'Informasi akun',
    icon: User,
  },
];

export default function Sidebar({
  active,
  onNavigate,
  user,
  onLogout,
  activeWorkspace = null,
  onSelectWorkspace,
  workspaceCounts = {},
}) {
  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Pengguna';

  const handleWorkspaceClick = (wsName) => {
    if (!onSelectWorkspace) return;
    // Jika workspace yang sama di-klik lagi -> reset ke null (tampilkan semua)
    if (activeWorkspace === wsName) {
      onSelectWorkspace(null);
    } else {
      onSelectWorkspace(wsName);
    }

    // Jika sedang di halaman profil, arahkan ke dashboard
    if (active === 'profile' && onNavigate) {
      onNavigate('dashboard');
    }
  };

  return (
    <aside
      className="hidden md:flex flex-col w-56 lg:w-60 h-full shrink-0"
      style={{
        background: 'rgba(15, 7, 30, 0.35)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* Brand */}
      <div className="px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-white">TempoAgent</span>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => {
            if (onNavigate) onNavigate('dashboard');
          }}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 active:scale-[0.98] hover:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Plus className="w-4 h-4 text-purple-300" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 overflow-y-auto space-y-5">
        {/* Features */}
        <div>
          <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/30">
            Features
          </p>
          <div className="space-y-0.5">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate && onNavigate(item.id)}
                  title={item.hint}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-white/50 hover:text-white/80 font-medium hover:bg-white/5'
                  }`}
                  style={isActive ? { background: 'rgba(139,92,246,0.2)' } : {}}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-300' : 'text-white/40'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Workspaces */}
        <div>
          <div className="flex items-center justify-between px-1 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">
              Workspaces
            </p>
            {activeWorkspace && (
              <button
                type="button"
                onClick={() => onSelectWorkspace && onSelectWorkspace(null)}
                className="text-[10px] text-purple-300 hover:text-purple-200 hover:underline font-medium"
                title="Tampilkan agenda dari seluruh workspace"
              >
                Reset
              </button>
            )}
          </div>

          <div className="space-y-1">
            {/* Opsi: Semua Workspace */}
            <button
              type="button"
              onClick={() => onSelectWorkspace && onSelectWorkspace(null)}
              title="Tampilkan seluruh agenda dari semua workspace"
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                activeWorkspace === null
                  ? 'text-white font-semibold bg-white/10 border border-white/15'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Layers className={`w-3.5 h-3.5 shrink-0 ${activeWorkspace === null ? 'text-purple-300' : 'text-white/30'}`} />
                <span className="truncate">Semua Agenda</span>
              </div>
              {workspaceCounts?.all !== undefined && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white/50"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  {workspaceCounts.all}
                </span>
              )}
            </button>

            {/* 3 Workspace Utama: Jadwal Kuliah, Rencana Belajar, Agenda Kerja */}
            {WORKSPACE_ITEMS.map((ws) => {
              const Icon = ws.icon;
              const isActive = activeWorkspace === ws.name;
              const count = workspaceCounts ? workspaceCounts[ws.name] ?? 0 : 0;

              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => handleWorkspaceClick(ws.name)}
                  title={`${ws.label}: ${ws.description} (Klik untuk memfilter)`}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all duration-150 group ${
                    isActive
                      ? 'text-white font-semibold border shadow-sm'
                      : 'text-white/55 hover:text-white hover:bg-white/5 font-medium'
                  }`}
                  style={
                    isActive
                      ? {
                          background: ws.activeBg,
                          borderColor: ws.badgeBorder,
                          boxShadow: `0 0 12px ${ws.badgeBg}`,
                        }
                      : {}
                  }
                >
                  <div className="flex items-center gap-2.5 min-w-0 truncate">
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110`}
                      style={{ color: isActive ? ws.textColor : 'rgba(255,255,255,0.4)' }}
                    />
                    <span className="truncate">{ws.label}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        background: isActive ? ws.badgeBg : 'rgba(255,255,255,0.06)',
                        color: isActive ? ws.textColor : 'rgba(255,255,255,0.5)',
                        border: isActive ? `1px solid ${ws.badgeBorder}` : 'none',
                      }}
                    >
                      {count}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: ws.accentColor }} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom: Upgrade card + user */}
      <div className="px-4 py-4 space-y-3">
        {/* Upgrade card */}
        <div className="p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white/80">TempoAgent Pro</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-purple-300" style={{ background: 'rgba(139,92,246,0.2)' }}>Free</span>
          </div>
          <p className="text-[11px] text-white/40 leading-relaxed mb-3">
            Aktifkan fitur lanjutan: multi-AI & analitik jadwal pintar.
          </p>
          <button
            type="button"
            onClick={onLogout}
            className="w-full text-center text-xs font-semibold text-white py-2 rounded-lg transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: 'rgba(139,92,246,0.4)' }}
          >
            Logout
          </button>
        </div>

        {/* User row */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white/80 truncate">{displayName}</p>
            <p className="text-[10px] text-white/40 truncate">{user?.email || 'Terkoneksi'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
