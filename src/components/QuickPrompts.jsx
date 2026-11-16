import React from 'react';
import { CalendarPlus, Search, BookOpen } from 'lucide-react';

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
    <div className="py-1.5">
      <div className="flex flex-wrap gap-2">
        {PROMPTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(item.text)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 active:scale-95 text-left"
              style={{
                background: 'rgba(139,92,246,0.15)',
                border: '1px solid rgba(139,92,246,0.25)',
                color: 'rgba(216,180,254,0.9)',
              }}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
