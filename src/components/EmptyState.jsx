import React from 'react';
import { CalendarX2, Sparkles } from 'lucide-react';

export default function EmptyState({ onQuickPrompt }) {
  return (
    <div
      className="rounded-2xl p-8 text-center"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px dashed rgba(139,92,246,0.25)',
      }}
    >
      <div
        className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-purple-300 mb-4"
        style={{ background: 'rgba(139,92,246,0.15)' }}
      >
        <CalendarX2 className="w-7 h-7" />
      </div>
      <h3 className="font-semibold text-white text-base mb-1">
        Belum Ada Jadwal Aktif
      </h3>
      <p className="text-xs text-white/40 max-w-sm mx-auto mb-5 leading-relaxed">
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
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-150 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-200" />
          <span>Coba Buat Jadwal Otomatis</span>
        </button>
      )}
    </div>
  );
}
