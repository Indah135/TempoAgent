import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  Pencil,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TIMEZONE_OPTIONS } from '../lib/timezone';

export default function ProfilePanel({ user, schedules, timezone = 'WIB' }) {
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

  const [isEditing, setIsEditing] = useState(false);
  const [nameValue, setNameValue] = useState(displayName);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Zona waktu (WIB/WITA/WIT) — nilai lokal agar langsung responsif,
  // lalu disimpan ke Supabase
  const [tzValue, setTzValue] = useState(timezone);
  const [isSavingTz, setIsSavingTz] = useState(false);

  useEffect(() => {
    setTzValue(timezone);
  }, [timezone]);

  const startEdit = () => {
    setNameValue(displayName);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setNameValue(displayName);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const trimmed = nameValue.trim();

    if (!trimmed) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }
    if (trimmed === displayName) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: trimmed, timezone: tzValue },
      });
      if (error) throw error;

      try {
        await supabase
          .from('Profiles')
          .update({ full_name: trimmed, timezone: tzValue })
          .eq('id', user.id);
      } catch (_) {
        // Sinkronisasi tabel Profiles bersifat opsional
      }

      setSuccessMsg('Nama berhasil diperbarui.');
      setIsEditing(false);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memperbarui nama.');
    } finally {
      setIsSaving(false);
    }
  };

  // Simpan zona waktu pengguna (untuk penyesuaian waktu oleh AI)
  const handleTimezoneChange = async (nextTz) => {
    if (!nextTz || nextTz === tzValue) return;
    const previousTz = tzValue;
    setTzValue(nextTz);
    setIsSavingTz(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName, timezone: nextTz },
      });
      if (error) throw error;

      try {
        await supabase
          .from('Profiles')
          .update({ timezone: nextTz })
          .eq('id', user.id);
      } catch (_) {
        // Sinkronisasi tabel Profiles bersifat opsional
      }

      setSuccessMsg(
        `Zona waktu diperbarui ke ${nextTz}. Waktu AI & jadwal menyesuaikan ${nextTz}.`
      );
    } catch (err) {
      setTzValue(previousTz);
      setErrorMsg(err.message || 'Gagal memperbarui zona waktu.');
    } finally {
      setIsSavingTz(false);
    }
  };

  const infoRows = [
    { icon: User, label: 'Nama Lengkap', value: displayName, editable: true },
    { icon: Mail, label: 'Alamat Email', value: email },
    { icon: Globe, label: 'Zona Waktu', value: tzValue, select: true },
    { icon: CalendarDays, label: 'Terdaftar Sejak', value: createdAt },
    {
      icon: ShieldCheck,
      label: 'Status Akun',
      value: 'Terverifikasi via Supabase',
    },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden h-full flex flex-col"
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
        className="px-4 py-3 flex items-center gap-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(139,92,246,0.25)' }}
        >
          <User className="w-4 h-4 text-purple-300" />
        </div>
        <div>
          <h2 className="font-bold text-white text-sm">Profil Pengguna</h2>
          <p className="text-[11px] text-white/40">Informasi akun TempoAgent Anda</p>
        </div>
      </div>

      {/* Konten Profil */}
      <div className="p-5 overflow-y-auto flex-1">
        {/* Kartu identitas */}
        <div
          className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-2xl text-white mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(147,51,234,0.4))',
            border: '1px solid rgba(139,92,246,0.3)',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h3 className="text-lg font-bold truncate">{displayName}</h3>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <Sparkles className="w-3 h-3" />
                Aktif
              </span>
            </div>
            <p className="text-xs text-purple-200 mt-0.5 truncate">{email}</p>
            <p className="text-[11px] text-purple-300 mt-1">
              {scheduleCount} jadwal tersimpan
            </p>
          </div>
        </div>

        {/* Alert sukses / error */}
        {errorMsg && (
          <div
            className="mb-4 p-3 rounded-xl text-xs flex items-start gap-2.5"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span className="leading-relaxed text-red-300">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div
            className="mb-4 p-3 rounded-xl text-xs flex items-start gap-2.5"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span className="leading-relaxed text-emerald-300">{successMsg}</span>
          </div>
        )}

        {/* Daftar info */}
        <div className="space-y-3">
          {infoRows.map((row) => {
            const Icon = row.icon;
            const isNameRow = row.editable;

            return (
              <div
                key={row.label}
                className="flex items-center gap-3 p-3.5 rounded-xl transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}
                >
                  <Icon className="w-4 h-4 text-purple-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">
                    {row.label}
                  </p>
                  {row.select ? (
                    <select
                      value={tzValue}
                      onChange={(e) => handleTimezoneChange(e.target.value)}
                      disabled={isSavingTz}
                      className="mt-1 w-full px-2.5 py-1.5 text-sm rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all disabled:opacity-60 cursor-pointer"
                      style={{
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(139,92,246,0.3)',
                      }}
                    >
                      {TIMEZONE_OPTIONS.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-slate-900 text-white"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : isNameRow && isEditing ? (
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="text"
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                        disabled={isSaving}
                        placeholder="Masukkan nama lengkap"
                        className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-lg text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all disabled:opacity-60"
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(139,92,246,0.3)' }}
                      />
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="p-1.5 rounded-lg text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                        style={{ background: 'rgba(139,92,246,0.5)' }}
                        title="Simpan"
                      >
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={isSaving}
                        className="p-1.5 rounded-lg text-white/50 hover:text-white/80 transition-colors disabled:opacity-60 shrink-0"
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                        title="Batal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p
                        className="text-sm font-semibold text-white/80 truncate"
                        title={row.value}
                      >
                        {row.value}
                      </p>
                      {isNameRow && (
                        <button
                          type="button"
                          onClick={startEdit}
                          className="p-1 rounded-md text-white/30 hover:text-purple-300 transition-colors shrink-0"
                          title="Edit nama"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
