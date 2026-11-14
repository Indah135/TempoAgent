import React, { useState, useEffect } from 'react';
import { Clock, Sparkles, LogOut, User } from 'lucide-react';

export default function Header({ user, onLogout }) {
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      setCurrentDateTime(now.toLocaleDateString('id-ID', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Pengguna';

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
            <Sparkles className="w-5 h-5 text-sky-100 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-sky-700 via-blue-600 to-sky-900 bg-clip-text text-transparent">
                TempoAgent
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Online
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Personal Task & Schedule Optimizer Agent
            </p>
          </div>
        </div>

        {/* Right Section: Live Time, User Profile & Logout */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Live Clock Badge */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>{currentDateTime || 'Memuat waktu...'}</span>
          </div>

          {/* User Profile Pill & Logout Button */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2 bg-sky-50/80 border border-sky-100 text-sky-900 px-2.5 py-1.5 rounded-lg text-xs font-medium">
                <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px] font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate" title={user.email}>
                  {displayName}
                </span>
              </div>

              <button
                type="button"
                onClick={onLogout}
                title="Keluar dari akun (Logout)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/70 transition-all duration-150 active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
