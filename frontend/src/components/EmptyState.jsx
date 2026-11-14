import React from 'react';
import { CalendarX2, Sparkles } from 'lucide-react';

export default function EmptyState({ onQuickPrompt }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center shadow-xs">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-4 shadow-inner">
        <CalendarX2 className="w-7 h-7" />
      </div>
      <h3 className="font-semibold text-slate-800 text-base mb-1">
        Belum Ada Jadwal Aktif
      </h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
        Jadwal Anda masih kosong. Minta TempoAgent di panel chat untuk membuat jadwal belajar, meeting, atau optimasi tugas harian Anda!
      </p>
      {onQuickPrompt && (
        <button
          type="button"
          onClick={() =>
            onQuickPrompt(
              'Buat jadwal belajar pemrograman web besok jam 20.00 sampai 21.30 lengkap dengan target belajar.'
            )
          }
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm hover:shadow-md hover:from-sky-600 hover:to-blue-700 transition-all duration-150 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-200" />
          <span>Coba Buat Jadwal Otomatis</span>
        </button>
      )}
    </div>
  );
}
