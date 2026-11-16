import React, { useState } from 'react';
import { Calendar, Clock, Trash2, CheckCircle, ListTodo, AlertCircle } from 'lucide-react';

export default function ScheduleCard({ schedule, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

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
        style={{ background: 'linear-gradient(90deg, #7c3aed, #9333ea, #c084fc)' }}
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
          </div>

          {/* Date & Time Row */}
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
        </div>

        {/* Delete Button */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Hapus jadwal"
          className="p-1.5 rounded-lg text-white/25 hover:text-red-400 transition-all duration-150 disabled:opacity-50 shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)' }}
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

      {/* Description / Subtasks */}
      {renderDescription(schedule.description)}
    </div>
  );
}
