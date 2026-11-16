import React from 'react';
import { LayoutDashboard, History, User, LogOut, Sparkles, Plus, MessageSquare, Archive, Library, ChevronRight } from 'lucide-react';

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

const WORKSPACE_ITEMS = [
  { id: 'ws1', label: 'Jadwal Kuliah', icon: Library },
  { id: 'ws2', label: 'Rencana Belajar', icon: Library },
  { id: 'ws3', label: 'Agenda Kerja', icon: Library },
];

export default function Sidebar({ active, onNavigate, user, onLogout }) {
  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Pengguna';

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
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-white">TempoAgent</span>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 active:scale-[0.98]"
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
                  onClick={() => onNavigate(item.id)}
                  title={item.hint}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-white/50 hover:text-white/80 font-medium'
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
          <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/30">
            Workspaces
          </p>
          <div className="space-y-0.5">
            {WORKSPACE_ITEMS.map((ws) => {
              const Icon = ws.icon;
              return (
                <button
                  key={ws.id}
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white/80 transition-all duration-150"
                >
                  <Icon className="w-4 h-4 shrink-0 text-white/30" />
                  <span className="truncate">{ws.label}</span>
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
            className="w-full text-center text-xs font-semibold text-white py-2 rounded-lg transition-all"
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
