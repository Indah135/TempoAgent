import React from 'react';
import { LayoutDashboard, History, User, LogOut, Sparkles } from 'lucide-react';

export const MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    hint: 'Chat AI & ringkasan',
    icon: LayoutDashboard,
  },
  {
    id: 'history',
    label: 'Riwayat Tugas',
    hint: 'Riwayat tugas & jadwal (mingguan/bulanan)',
    icon: History,
  },
  {
    id: 'profile',
    label: 'Profil Saya',
    hint: 'Informasi akun',
    icon: User,
  },
];

export default function Sidebar({ active, onNavigate, user, onLogout }) {
  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Pengguna';

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-56 flex-col bg-white border-r border-slate-200/80 shadow-sm">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-base font-bold bg-gradient-to-r from-sky-700 via-blue-600 to-sky-900 bg-clip-text text-transparent truncate">
            TempoAgent
          </div>
          <div className="text-[10px] text-slate-500 font-medium truncate">
            Schedule Optimizer
          </div>
        </div>
      </div>

      {/* Menu navigasi */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menu Utama
        </p>
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              title={item.hint}
              className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${
                isActive
                  ? 'bg-sky-50 text-sky-700 border border-sky-200/70 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-sky-500" />
              )}
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-sky-600' : 'text-slate-500'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profil singkat & logout */}
      <div className="px-3 py-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-700 truncate" title={displayName}>
              {displayName}
            </p>
            <p
              className="text-[10px] text-slate-400 truncate"
              title={user?.email || ''}
            >
              {user?.email || 'Terkoneksi'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          title="Keluar dari akun (Logout)"
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/70 transition-all duration-150 active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
