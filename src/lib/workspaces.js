import { GraduationCap, BookOpen, Briefcase, Layers } from 'lucide-react';

export const WORKSPACE_ITEMS = [
  {
    id: 'ws-kuliah',
    name: 'Jadwal Kuliah',
    label: 'Jadwal Kuliah',
    shortLabel: 'Kuliah',
    icon: GraduationCap,
    color: 'blue',
    accentColor: '#3b82f6',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    badgeBorder: 'rgba(59, 130, 246, 0.3)',
    textColor: '#93c5fd',
    activeBg: 'rgba(59, 130, 246, 0.2)',
    description: 'Mata kuliah, praktikum, tugas dosen, dan agenda akademik kampus',
    emptyPrompt: 'Jadwalkan kuliah Pemrograman Web setiap Selasa jam 08.00 sampai 10.00 di Lab 3',
    keywords: [
      'kuliah',
      'matkul',
      'mata kuliah',
      'dosen',
      'semester',
      'kampus',
      'sks',
      'kelas',
      'praktikum',
      'uts',
      'uas',
      'makalah',
      'skripsi',
      'krs',
      'akademik',
      'lab',
      'mahasiswa',
    ],
  },
  {
    id: 'ws-belajar',
    name: 'Rencana Belajar',
    label: 'Rencana Belajar',
    shortLabel: 'Belajar',
    icon: BookOpen,
    color: 'emerald',
    accentColor: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeBorder: 'rgba(16, 185, 129, 0.3)',
    textColor: '#6ee7b7',
    activeBg: 'rgba(16, 185, 129, 0.2)',
    description: 'Belajar mandiri, skill baru, kursus online, coding, dan membaca buku',
    emptyPrompt: 'Buatkan rencana belajar React dan Next.js besok malam jam 19.30 sampai 21.00',
    keywords: [
      'belajar',
      'study',
      'course',
      'kursus',
      'tutorial',
      'latihan',
      'modul',
      'review',
      'algoritma',
      'python',
      'react',
      'javascript',
      'coding',
      'buku',
      'reading',
      'baca',
      'materi',
      'self-study',
      'quiz',
    ],
  },
  {
    id: 'ws-kerja',
    name: 'Agenda Kerja',
    label: 'Agenda Kerja',
    shortLabel: 'Kerja',
    icon: Briefcase,
    color: 'amber',
    accentColor: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeBorder: 'rgba(245, 158, 11, 0.3)',
    textColor: '#fcd34d',
    activeBg: 'rgba(245, 158, 11, 0.2)',
    description: 'Pekerjaan kantor, meeting, proyek freelance, client, dan deadline',
    emptyPrompt: 'Jadwalkan rapat evaluasi sprint tim lusa jam 14.00 sampai 15.30',
    keywords: [
      'kerja',
      'meeting',
      'rapat',
      'client',
      'kantor',
      'proyek',
      'project',
      'sprint',
      'deadline',
      'presentation',
      'brief',
      'work',
      'shift',
      'lembur',
      'freelance',
      'evaluasi',
      'sync',
    ],
  },
];

/**
 * Mencari definisi workspace berdasarkan nama / ID.
 */
export function getWorkspaceInfo(workspaceNameOrId) {
  if (!workspaceNameOrId) return null;
  const clean = String(workspaceNameOrId).toLowerCase().trim();
  return (
    WORKSPACE_ITEMS.find(
      (ws) =>
        ws.name.toLowerCase() === clean ||
        ws.id.toLowerCase() === clean ||
        ws.shortLabel.toLowerCase() === clean
    ) || null
  );
}

/**
 * Mendeteksi workspace sebuah jadwal (baik dari kolom workspace maupun analisis teks).
 */
export function detectWorkspaceForItem(item) {
  if (!item) return null;

  // 1. Kolom eksplisit item.workspace
  if (item.workspace) {
    const match = getWorkspaceInfo(item.workspace);
    if (match) return match;
  }

  // 2. Analisis teks (title + description)
  const fullText = `${item.title || ''} ${item.description || ''}`.toLowerCase();
  for (const ws of WORKSPACE_ITEMS) {
    if (ws.keywords.some((kw) => fullText.includes(kw))) {
      return ws;
    }
  }

  return null;
}

/**
 * Mengecek apakah item jadwal masuk ke dalam workspace aktif yang dipilih.
 */
export function matchesWorkspace(item, activeWorkspace) {
  if (!activeWorkspace) return true; // null / kosong = tampilkan semua
  const target = activeWorkspace.toLowerCase().trim();
  const detected = detectWorkspaceForItem(item);
  return detected ? detected.name.toLowerCase() === target : false;
}

/**
 * Menghitung jumlah jadwal aktif untuk tiap-tiap workspace.
 */
export function countSchedulesByWorkspace(schedules = []) {
  const counts = {
    all: schedules.length,
    'Jadwal Kuliah': 0,
    'Rencana Belajar': 0,
    'Agenda Kerja': 0,
    unassigned: 0,
  };

  schedules.forEach((item) => {
    const detected = detectWorkspaceForItem(item);
    if (detected && counts[detected.name] !== undefined) {
      counts[detected.name] += 1;
    } else {
      counts.unassigned += 1;
    }
  });

  return counts;
}
