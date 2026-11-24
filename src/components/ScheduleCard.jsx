import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Trash2,
  CheckCircle,
  ListTodo,
  AlertCircle,
  Pencil,
  Save,
  X,
  Layers,
} from 'lucide-react';
import { detectWorkspaceForItem, WORKSPACE_ITEMS } from '../lib/workspaces';

const DAY_NAMES = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export default function ScheduleCard({ schedule, onDelete, onUpdate }) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Mode edit manual (hari & jam)
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editWorkspace, setEditWorkspace] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const datePart = String(dateStr).split('T')[0];
      const parts = datePart.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const str = String(timeStr);
    // Jika bentuknya ISO string (misal: 2026-11-16T19:00:00+07:00 atau 2026-11-16T19:00:00)
    if (str.includes('T')) {
      const parts = str.split('T')[1];
      return parts ? parts.substring(0, 5) : '';
    }
    // Jika sudah berupa format waktu HH:MM:SS atau HH:MM
    if (str.includes(':')) {
      return str.substring(0, 5);
    }
    return str;
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    const confirmDelete = window.confirm(`Hapus jadwal "${schedule.title}"?`);
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(schedule.id);
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus jadwal. Silakan coba lagi.');
      setIsDeleting(false);
    }
  };

  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    const parts = String(dateStr).split('-');
    if (parts.length !== 3) return '';
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return DAY_NAMES[d.getDay()];
  };

  const openEdit = () => {
    setEditDate(String(schedule.schedule_date || schedule.start_time || '').split('T')[0]);
    setEditStart(formatTime(schedule.start_time));
    setEditEnd(formatTime(schedule.end_time));
    setEditWorkspace(schedule.workspace || detectWorkspaceForItem(schedule)?.name || '');
    setEditError(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editDate || !editStart || !editEnd) {
      setEditError('Hari/tanggal dan jam wajib diisi.');
      return;
    }
    if (editEnd <= editStart) {
      setEditError('Jam selesai harus setelah jam mulai.');
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);
    try {
      await onUpdate(schedule.id, {
        schedule_date: editDate,
        start_time: editStart,
        end_time: editEnd,
        workspace: editWorkspace,
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setEditError(err.message || 'Gagal menyimpan perubahan. Coba lagi.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const renderDescription = (desc) => {
    if (!desc) return null;

    const lines = desc.split('\n').filter((line) => line.trim().length > 0);
    const hasBullets = lines.some((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));

    if (hasBullets) {
      return (
        <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300 mb-1.5">
            <ListTodo className="w-3.5 h-3.5" />
            <span>Rincian & Target Tugas:</span>
          </div>
          <ul className="space-y-1 text-xs text-white/60 pl-1">
            {lines.map((line, idx) => {
              const cleaned = line.replace(/^[-*]\s*/, '').trim();
              return (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{cleaned}</span>
                </li>
              );
            })}
          </ul>
        </div>
      );
    }

    return (
      <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs text-white/60 leading-relaxed whitespace-pre-line">{desc}</p>
      </div>
    );
  };

  const status = schedule.status || 'scheduled';
  const isScheduled = status.toLowerCase() === 'scheduled';
  const wsInfo = detectWorkspaceForItem(schedule);
  const WsIcon = wsInfo?.icon;

  return (
    <div
      className="group rounded-xl p-4 relative overflow-hidden transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: wsInfo?.accentColor
            ? `linear-gradient(90deg, ${wsInfo.accentColor}, #9333ea, #c084fc)`
            : 'linear-gradient(90deg, #7c3aed, #9333ea, #c084fc)',
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="font-semibold text-white text-sm leading-snug truncate">
              {schedule.title}
            </h3>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={
                isScheduled
                  ? { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }
                  : { background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }
              }
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: isScheduled ? '#fbbf24' : '#34d399' }}
              />
              {status}
            </span>

            {wsInfo && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{
                  background: wsInfo.badgeBg,
                  border: `1px solid ${wsInfo.badgeBorder}`,
                  color: wsInfo.textColor,
                }}
                title={`Workspace: ${wsInfo.label}`}
              >
                <WsIcon className="w-3 h-3 shrink-0" />
                <span>{wsInfo.label}</span>
              </span>
            )}
          </div>

          {/* Date & Time Row — atau form edit manual */}
          {isEditing ? (
            <div
              className="mt-2.5 rounded-lg p-2.5 space-y-2"
              style={{
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.3)',
              }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-300">
                  <Pencil className="w-3 h-3" />
                  Edit Hari & Waktu
                </span>
                {getDayName(editDate) && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-purple-200"
                    style={{ background: 'rgba(139,92,246,0.25)' }}
                  >
                    {getDayName(editDate)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  disabled={isSavingEdit}
                  aria-label="Hari / tanggal jadwal"
                  className="px-2 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 disabled:opacity-60 [color-scheme:dark]"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(139,92,246,0.3)' }}
                />
                <input
                  type="time"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  disabled={isSavingEdit}
                  aria-label="Jam mulai"
                  className="px-2 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 disabled:opacity-60 [color-scheme:dark]"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(139,92,246,0.3)' }}
                />
                <span className="text-white/40 text-xs">–</span>
                <input
                  type="time"
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                  disabled={isSavingEdit}
                  aria-label="Jam selesai"
                  className="px-2 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 disabled:opacity-60 [color-scheme:dark]"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(139,92,246,0.3)' }}
                />
              </div>

              {/* Pilihan Workspace saat edit */}
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[11px] text-white/50 shrink-0">Workspace:</span>
                <select
                  value={editWorkspace}
                  onChange={(e) => setEditWorkspace(e.target.value)}
                  disabled={isSavingEdit}
                  aria-label="Pilih Workspace"
                  className="px-2.5 py-1 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 [color-scheme:dark] flex-1 max-w-xs"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(139,92,246,0.3)' }}
                >
                  <option value="">(Umum / Tanpa Workspace)</option>
                  {WORKSPACE_ITEMS.map((ws) => (
                    <option key={ws.id} value={ws.name}>
                      {ws.label}
                    </option>
                  ))}
                </select>
              </div>

              {editError && (
                <p className="text-[11px] text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {editError}
                </p>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: 'rgba(139,92,246,0.55)' }}
                >
                  {isSavingEdit ? (
                    <div
                      className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"
                    />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/60 hover:text-white transition-all disabled:opacity-60"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <X className="w-3.5 h-3.5" />
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs mt-1">
              <div
                className="inline-flex items-center gap-1.5 font-medium px-2 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
              >
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>{formatDate(schedule.schedule_date || schedule.start_time)}</span>
              </div>
              <div
                className="inline-flex items-center gap-1.5 font-medium px-2 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
              >
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons (Edit & Delete) */}
        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0">
            {onUpdate && (
              <button
                type="button"
                onClick={openEdit}
                title="Edit hari & waktu jadwal"
                className="p-1.5 rounded-lg text-white/55 hover:text-purple-300 hover:bg-purple-500/20 transition-all duration-150"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Hapus jadwal"
              className="p-1.5 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-500/25 transition-all duration-150 disabled:opacity-50"
              style={{
                background: 'rgba(239,68,68,0.14)',
                border: '1px solid rgba(239,68,68,0.32)',
              }}
            >
              {isDeleting ? (
                <div
                  className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'rgba(239,68,68,0.5)', borderTopColor: 'transparent' }}
                />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Description / Subtasks */}
      {!isEditing && renderDescription(schedule.description)}
    </div>
  );
}
