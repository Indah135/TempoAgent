import React from 'react';
import { User, Mail, CalendarDays, ShieldCheck, Sparkles } from 'lucide-react';

export default function ProfilePanel({ user, schedules }) {
  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Pengguna';
  const email = user?.email || '-';
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '-';
  const scheduleCount = Array.isArray(schedules) ? schedules.length : 0;

  const infoRows = [
    { icon: User, label: 'Nama Lengkap', value: displayName },
    { icon: Mail, label: 'Alamat Email', value: email },
    { icon: CalendarDays, label: 'Terdaftar Sejak', value: createdAt },
    {
      icon: ShieldCheck,
      label: 'Status Akun',
      value: 'Terverifikasi via Supabase',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden h-full flex flex-col">
      {/* Panel Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-xs">
          <User className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800 text-base">Profil Pengguna</h2>
          <p className="text-xs text-slate-500">Informasi akun TempoAgent Anda</p>
        </div>
      </div>

      {/* Konten Profil */}
      <div className="p-5 sm:p-6 overflow-y-auto flex-1">
        {/* Kartu identitas */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold border border-white/30 shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h3 className="text-lg font-bold truncate">{displayName}</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 border border-white/30">
                <Sparkles className="w-3 h-3" />
                Aktif
              </span>
            </div>
            <p className="text-xs text-sky-100 mt-0.5 truncate">{email}</p>
            <p className="text-[11px] text-sky-200 mt-1">
              {scheduleCount} jadwal tersimpan
            </p>
          </div>
        </div>

        {/* Daftar info */}
        <div className="space-y-3">
          {infoRows.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.label}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-sky-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {row.label}
                  </p>
                  <p className="text-sm font-semibold text-slate-700 truncate" title={row.value}>
                    {row.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
