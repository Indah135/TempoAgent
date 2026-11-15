# ⏳ TempoAgent — Personal Task & Schedule Optimizer

<p align="center">
  <strong>Asisten AI Cerdas untuk Manajemen Waktu, Optimasi Tugas, dan Penjadwalan Harian</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/AI%20Model-Gemini%202.5%20Flash-4285F4?logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Database%20%26%20Auth-Supabase-3ECF8E?logo=supabase&logoColor=white" alt="Supabase" />
</p>

---

## 📖 Tentang TempoAgent

**TempoAgent** adalah aplikasi web modern yang dirancang untuk membantu pengguna mengatur waktu dan menyusun agenda secara efisien. Menggunakan model kecerdasan buatan **Google Gemini 2.5 Flash**, TempoAgent dapat memahami instruksi bahasa alami berbahasa Indonesia untuk memeriksa ketersediaan waktu, mendeteksi jadwal yang saling bertabrakan (*conflict detection*), dan menyusun rincian target belajar atau sub-tugas secara otomatis.

Seluruh data jadwal dan autentikasi pengguna tersimpan secara aman dan terenkripsi menggunakan **Supabase**.

---

## ✨ Fitur Utama

- 🤖 **Percakapan Interaktif dengan AI Agent**:
  - Pahami bahasa alami (contoh: *"Buatkan jadwal belajar Python besok malam jam 19.30 sampai 21.00"*).
  - Pengecekan waktu relatif otomatis (*hari ini, besok, minggu ini*).
  - Pengecekan bentrok jadwal sebelum membuat jadwal baru.
  - Pemecahan target belajar menjadi daftar sub-tugas (*bullet points*).
- 🔒 **Sistem Autentikasi Pengguna (Supabase Auth)**:
  - Form **Login** dan **Register** dengan perlindungan enkripsi kata sandi.
  - Sinkronisasi otomatis data profil pengguna ke tabel `Profiles`.
  - Proteksi rute dan sesi pengguna secara *real-time*.
- 📊 **Dashboard Modern & Responsif (2 Kolom)**:
  - **Kolom Kiri (40%)**: Panel chat interaktif dengan indikator animasi ketika AI sedang berpikir serta tombol perintah cepat (*quick prompts*).
  - **Kolom Kanan (60%)**: Panel Agenda & Jadwal Aktif berbentuk kartu modern dengan lencana status, detail jam, target belajar, dan tombol hapus jadwal.
  - **Auto-Sync**: Daftar jadwal otomatis diperbarui setiap kali AI selesai membalas pesan.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React |
| **Backend API** | Python 3.10+, FastAPI, Uvicorn |
| **AI Engine** | Google GenAI SDK (`gemini-2.5-flash`) |
| **Database & Auth** | Supabase (PostgreSQL, Supabase Auth, Row Level Security) |

---

## 📁 Struktur Folder Proyek

```text
TempoAgent/
├── .env                  # Kredensial Gemini & Supabase (Frontend & Backend)
├── .env.example          # Template contoh konfigurasi environment
├── .gitignore            # Pengabaian file sampah, build, dan credentials
├── index.html            # File HTML utama aplikasi React
├── package.json          # Dependensi Node.js (React, Vite, Tailwind, Supabase)
├── tailwind.config.js    # Konfigurasi Tailwind CSS
├── postcss.config.js     # Konfigurasi PostCSS
├── vite.config.js        # Konfigurasi server Vite
├── requirements.txt      # Dependensi Python Backend (FastAPI, Uvicorn, GenAI)
│
├── src/                  # SOURCE CODE FRONTEND (React)
│   ├── api.js            # Fungsi pemanggil endpoint REST API
│   ├── App.jsx           # Komponen root (State autentikasi & Dashboard)
│   ├── index.css         # Styling global Tailwind CSS & scrollbar
│   ├── main.jsx          # Entry point React & ErrorBoundary
│   ├── lib/
│   │   └── supabase.js   # Client Supabase & auto-fallback
│   └── components/
│       ├── Auth.jsx          # Form Login & Register akun
│       ├── ChatPanel.jsx     # Panel Chat AI & animasi loading
│       ├── EmptyState.jsx    # Tampilan ilustrasi jadwal kosong
│       ├── Header.jsx        # Navbar atas, jam real-time, & profil/logout
│       ├── QuickPrompts.jsx  # Tombol contoh instruksi cepat
│       ├── ScheduleCard.jsx  # Kartu jadwal (waktu, badge status, sub-tugas)
│       ├── SchedulePanel.jsx # Panel daftar agenda dengan live filter pencarian
│       └── SetupSupabase.jsx # Form konfigurasi kredensial langsung di UI
│
└── backend/              # SOURCE CODE BACKEND (FastAPI Python)
    ├── api.py            # Entry point FastAPI (/api/chat, /api/schedules)
    └── src/
        ├── agent.py      # Logika TempoAgent (Gemini 2.5 Flash Chat)
        ├── database.py   # Query database Supabase
        ├── tools.py      # Tools Python (Deteksi bentrok, buat jadwal, jam lokal)
        └── __init__.py   # Inisialisasi package backend
```

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat Sistem
Pastikan di komputer Anda sudah terpasang:
- **Node.js** (versi 18 ke atas) & **npm**
- **Python** (versi 3.10 ke atas) & **pip**

---

### 2. Konfigurasi Environment Variable (`.env`)
Salin file template `.env.example` menjadi `.env` di folder utama:

```powershell
cp .env.example .env
```

Buka file **`.env`** dan lengkapi nilai kredensial Anda:

```env
# 1. Google Gemini API Key (Dapatkan di Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here

# 2. Supabase Credentials (Dapatkan di Project Settings > API Supabase)
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://<id-proyek-anda>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key-anda>
```

> **Catatan:** Backend Python otomatis dapat membaca kredensial Supabase dari file `.env` di folder utama ini.

---

### 3. Menjalankan Backend (FastAPI)

Buka **Terminal 1**:

```powershell
# 1. Install seluruh dependensi Python
pip install -r requirements.txt

# 2. Pindah ke folder backend
cd backend

# 3. Jalankan server FastAPI dengan Uvicorn
python -m uvicorn api:app --reload --port 8000
```

> 🟢 **Backend berjalan di:** `http://localhost:8000`  
> 📄 **Dokumentasi API Interaktif (Swagger UI):** `http://localhost:8000/docs`

---

### 4. Menjalankan Frontend (React + Vite)

Buka **Terminal 2** di folder utama (`D:\CODING\TempoAgent`):

```powershell
# 1. Install seluruh paket Node.js
npm install

# 2. Jalankan development server Vite
npm run dev
```

> 🌐 **Frontend berjalan di:** `http://localhost:5173`

Buka browser Anda di **`http://localhost:5173`** untuk mulai menggunakan TempoAgent.

---

## 🗄️ Referensi Skema Tabel Database (Supabase)

Aplikasi ini menggunakan struktur tabel PostgreSQL berikut di Supabase:

### 1. Tabel `Profiles`
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key (Relasi ke `auth.users.id`) |
| `full_name` | `text` | Nama lengkap pengguna |
| `email` | `text` | Alamat email terdaftar |
| `timezone` | `text` | Zona waktu pengguna (opsional) |
| `created_at`| `timestamptz` | Waktu registrasi |

### 2. Tabel `schedules`
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key (Default: `gen_random_uuid()`) |
| `user_id` | `uuid` | ID pengguna (opsional / relasi ke `auth.users.id`) |
| `title` | `text` | Judul kegiatan / jadwal |
| `description`| `text` | Rincian target belajar / sub-tugas |
| `schedule_date` | `date` | Tanggal jadwal (`YYYY-MM-DD`) |
| `start_time`| `time` / `timestamptz` | Waktu mulai |
| `end_time` | `time` / `timestamptz` | Waktu selesai |
| `status` | `text` | Status jadwal (Default: `'scheduled'`) |
| `created_at`| `timestamptz` | Waktu pembuatan data |

---

## 💡 Contoh Perintah Chat ke TempoAgent

- *"Buatkan jadwal belajar React besok malam jam 20.00 sampai 21.30 lengkap dengan sub-tugas materi dasar."*
- *"Cek apakah ada jadwal kegiatan untuk hari ini?"*
- *"Jadwalkan review sprint dan meeting tim lusa jam 14.00 sampai 15.30."*
- *"Bantu susun rencana belajar algoritma minggu ini dengan pembagian waktu yang optimal."*

---

## 📄 Lisensi
Proyek ini dibuat dan dikembangkan untuk keperluan personal task optimization di bawah lisensi open source.
