import React from 'react';
import { Sparkles, CalendarPlus, Search, BookOpen } from 'lucide-react';

const PROMPTS = [
  {
    icon: CalendarPlus,
    label: "Jadwal belajar besok",
    text: "Buatkan jadwal belajar Python besok malam jam 19.30 sampai 21.00 dengan sub-tugas materi dasar.",
  },
  {
    icon: Search,
    label: "Cek jadwal hari ini",
    text: "Cek apakah ada jadwal atau kegiatan untuk hari ini?",
  },
  {
    icon: BookOpen,
    label: "Review sprint minggu ini",
    text: "Bantu susun rencana belajar minggu ini dan berikan pembagian waktu yang optimal.",
  },
];

export default function QuickPrompts({ onSelectPrompt }) {
  return (
    <div className="py-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Contoh Perintah Cepat:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {PROMPTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(item.text)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-sky-50 text-sky-700 hover:bg-sky-100/90 border border-sky-200/80 transition-all duration-150 active:scale-95 text-left group"
            >
              <Icon className="w-3.5 h-3.5 text-sky-500 group-hover:text-sky-700 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
