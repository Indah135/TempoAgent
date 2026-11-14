import React, { useState } from 'react';
import { Calendar, Clock, Trash2, CheckCircle, ListTodo, AlertCircle } from 'lucide-react';

export default function ScheduleCard({ schedule, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
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
    return String(timeStr).substring(0, 5);
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

  // Parsing bullet points in description if any
  const renderDescription = (desc) => {
    if (!desc) return null;

    const lines = desc.split('\n').filter((line) => line.trim().length > 0);
    const hasBullets = lines.some((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));

    if (hasBullets) {
      return (
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
            <ListTodo className="w-3.5 h-3.5 text-sky-600" />
            <span>Rincian & Target Tugas:</span>
          </div>
          <ul className="space-y-1 text-xs text-slate-600 pl-1">
            {lines.map((line, idx) => {
              const cleaned = line.replace(/^[-*]\s*/, '').trim();
              return (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{cleaned}</span>
                </li>
              );
            })}
          </ul>
        </div>
      );
    }

    return (
      <div className="mt-3 pt-2.5 border-t border-slate-100">
        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{desc}</p>
      </div>
    );
  };

  const status = schedule.status || 'scheduled';
  const isScheduled = status.toLowerCase() === 'scheduled';

  return (
    <div className="group bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-sky-200 transition-all duration-200 relative overflow-hidden">
      {/* Decorative colored top border bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-amber-400 opacity-90" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="font-semibold text-slate-800 text-sm md:text-base leading-snug truncate">
              {schedule.title}
            </h3>
            {/* Status Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                isScheduled
                  ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isScheduled ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
              {status}
            </span>
          </div>

          {/* Date & Time Row */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mt-1">
            <div className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>{formatDate(schedule.schedule_date)}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
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
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all duration-150 disabled:opacity-50 shrink-0"
        >
          {isDeleting ? (
            <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
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
