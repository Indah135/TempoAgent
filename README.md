# ⏳ TempoAgent — Personal Task & Schedule Optimizer

<p align="center">
  <strong>Asisten AI Cerdas untuk Manajemen Waktu, Optimasi Tugas, dan Penjadwalan Harian</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/AI%20Engine-Groq%20%2B%20Llama%203.3-10B38A?logo=meta&logoColor=white" alt="Groq" />
  <img src="https://img.shields.io/badge/Database%20%26%20Auth-Supabase-3ECF8E?logo=supabase&logoColor=white" alt="Supabase" />
</p>

---

## 📖 Tentang TempoAgent

**TempoAgent** adalah aplikasi web modern yang dirancang untuk membantu pengguna mengatur waktu dan menyusun agenda secara efisien. Menggunakan model kecerdasan buatan **Groq** (default: `llama-3.3-70b-versatile`, dengan fallback model lain), TempoAgent dapat memahami instruksi bahasa alami berbahasa Indonesia untuk memeriksa ketersediaan waktu, mendeteksi jadwal yang saling bertabrakan (*conflict detection*), mengelola jadwal (buat, ubah, aktifkan, nonaktifkan, selesaikan, hapus), serta menyusun rincian target belajar atau sub-tugas secara otomatis.

Seluruh data jadwal dan autentikasi pengguna tersimpan secara aman menggunakan **Supabase**.

---

## ✨ Fitur Utama

- 🤖 **Percakapan Interaktif dengan AI Agent (Function Calling)**:
  - Pahami bahasa alami (contoh: *"Buatkan jadwal belajar Python besok malam jam 19.30 sampai 21.00"*).
  - Pengecekan waktu relatif otomatis (*hari ini, besok, lusa, minggu ini*) sesuai zona waktu pengguna.
  - Pengecekan bentrok jadwal sebelum membuat jadwal baru.
  - Kelola jadwal tanpa perlu tahu ID: aktifkan, nonaktifkan, tandai selesai, ubah waktu/judul, atau hapus berdasarkan kata kunci judul.
  - Pemecahan target belajar menjadi daftar sub-tugas (*bullet points*).
  - Fallback antar-model Groq otomatis jika model utama tidak tersedia pada API key.
- 📎 **Ekstraksi Jadwal Otomatis dari File**:
  - Unggah **foto** (JPG/JPEG/PNG/WEBP) atau **dokumen** (PDF, Excel, CSV) berisi jadwal kuliah/kerja.
  - AI vision Groq (`llama-4-scout`) mengekstrak judul, hari, dan jam, lalu menyimpannya langsung ke database.
  - Nama hari otomatis dikonversi menjadi tanggal terdekat sesuai zona waktu.
- 🗂️ **Workspace / Kategori Agenda**:
  - Tiga workspace utama: **Jadwal Kuliah**, **Rencana Belajar**, dan **Agenda Kerja**.
  - Filter agenda per workspace dengan badge jumlah jadwal aktif.
  - Workspace aktif ikut dikirim ke AI sehingga jadwal baru otomatis tersimpan ke kategori yang tepat.
- 🔒 **Sistem Autentikasi Pengguna (Supabase Auth)**:
  - Form **Login** dan **Register** dengan perlindungan enkripsi kata sandi.
  - Proteksi rute URL otomatis (*route guard*) — akses halaman sebelum login ditolak dan dikembalikan ke `/login`.
  - Sinkronisasi status sesi secara *real-time*.
- 🕐 **Zona Waktu Indonesia (WIB / WITA / WIT)**:
  - Deteksi zona waktu otomatis dari browser, disimpan di profil pengguna.
  - Seluruh perhitungan jadwal (chat, ekstraksi file, daftar agenda) mengikuti zona waktu pengguna.
- 📊 **Dashboard Modern dengan Sidebar & Multi-Halaman**:
  - **Sidebar**: navigasi menu (Chat, Arsip/Riwayat, Profil), daftar workspace, info pengguna, dan tombol logout.
  - **Halaman Chat**: panel chat AI (kolom kiri) + panel Agenda aktif (kolom kanan), indikator animasi saat AI berpikir, tombol quick prompts, dan tombol upload file.
  - **Halaman Arsip / Riwayat**: seluruh jadwal termasuk yang sudah lewat, difilter mingguan/bulanan, dengan status sumber data (server → Supabase langsung → cache lokal) sebagai fallback otomatis.
  - **Halaman Profil**: informasi akun, statistik jadwal, dan zona waktu.
  - **Auto-Sync**: daftar jadwal diperbarui otomatis setiap kali AI selesai membalas atau file berhasil diunggah.
- ✏️ **Edit Jadwal Langsung dari Kartu**:
  - Ubah hari, jam, judul, deskripsi, prioritas, status (`active` / `inactive` / `completed`), dan tag workspace.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React |
| **Backend API** | Python 3.10+, FastAPI, Uvicorn |
| **AI Engine** | Groq API — chat: `llama-3.3-70b-versatile` (fallback: `gpt-oss-120b`, `gpt-oss-20b`, dll); vision upload: `llama-4-scout-17b` |
| **Database & Auth** | Supabase (PostgreSQL, Supabase Auth) |
| **File Parsing** | pypdf (PDF), openpyxl (Excel) |

---

## 📁 Struktur Folder Proyek

```text
TempoAgent/
├── .env                  # Kredensial Groq & Supabase (Frontend & Backend)
├── .env.example          # Template contoh konfigurasi environment
├── .gitignore            # Pengabaian file sampah, build, dan credentials
├── index.html            # File HTML utama aplikasi React
├── package.json          # Dependensi Node.js (React, Vite, Tailwind, Supabase)
├── tailwind.config.js    # Konfigurasi Tailwind CSS
├── postcss.config.js     # Konfigurasi PostCSS
├── vite.config.js        # Konfigurasi server Vite
├── requirements.txt      # Dependensi Python Backend (FastAPI, Groq, Supabase, dll)
│
├── public/               # Aset statis (bg-glow.jpg, dll)
├── dist/                 # Hasil build produksi (npm run build)
│
├── src/                  # SOURCE CODE FRONTEND (React)
│   ├── api.js            # Fungsi pemanggil endpoint REST API + fallback riwayat
│   ├── App.jsx           # Komponen root (auth, routing menu, state global)
│   ├── index.css         # Styling global Tailwind CSS & scrollbar
│   ├── main.jsx          # Entry point React & ErrorBoundary
│   ├── lib/
│   │   ├── supabase.js   # Client Supabase & auto-fallback
│   │   ├── historyStore.js # Cache & fallback riwayat (Supabase langsung / localStorage)
│   │   ├── timezone.js   # Deteksi zona waktu WIB/WITA/WIT dari browser
│   │   └── workspaces.js # Definisi workspace & utilitas filter/hitung jadwal
│   └── components/
│       ├── Auth.jsx          # Form Login & Register akun
│       ├── ChatPanel.jsx     # Panel Chat AI, animasi loading, & upload file
│       ├── EmptyState.jsx    # Tampilan ilustrasi jadwal kosong
│       ├── Header.jsx        # Navbar atas, jam real-time, & profil/logout
│       ├── HistoryPanel.jsx  # Halaman Arsip/Riwayat tugas (mingguan/bulanan)
│       ├── ProfilePanel.jsx  # Halaman informasi akun & statistik
│       ├── QuickPrompts.jsx  # Tombol contoh instruksi cepat
│       ├── ScheduleCard.jsx  # Kartu jadwal (waktu, badge status, sub-tugas, edit)
│       ├── SchedulePanel.jsx # Panel daftar agenda dengan filter workspace
│       ├── SetupSupabase.jsx # Form konfigurasi kredensial langsung di UI
│       └── Sidebar.jsx       # Sidebar navigasi, workspace, & info pengguna
│
└── backend/              # SOURCE CODE BACKEND (FastAPI Python)
    ├── api.py            # Entry point FastAPI (/api/chat, /api/schedules, /api/upload-schedule)
    ├── requirements.txt  # Dependensi backend (identik dengan requirements.txt root)
    └── src/
        ├── agent.py      # Logika TempoAgent (Groq Chat + Function Calling)
        ├── database.py   # Query database Supabase
        ├── extractor.py  # Ekstraksi jadwal dari foto/PDF/Excel/CSV (Groq vision/text)
        ├── tools.py      # Tools agent (deteksi bentrok, CRUD jadwal, zona waktu, workspace)
        └── __init__.py   # Inisialisasi package backend
```

> **Catatan:** Folder `TempoAgent/` di dalam root adalah salinan proyek lama (nested repository) dan bukan bagian dari source code aktif.

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
# 1. Groq API Key (Dapatkan di https://console.groq.com)
GROQ_API_KEY=your_groq_api_key_here
# Opsional: ganti model utama (default: llama-3.3-70b-versatile)
# GROQ_MODEL=llama-3.3-70b-versatile

# 2. Supabase & Backend
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://<id-proyek-anda>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key-anda>
```

> **Catatan:** Backend Python otomatis membaca `GROQ_API_KEY`, `VITE_SUPABASE_URL`, dan `VITE_SUPABASE_ANON_KEY` dari file `.env` di folder utama ini (maupun `backend/.env` jika ada).

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
| `timezone` | `text` | Zona waktu pengguna (`WIB` / `WITA` / `WIT`) |
| `created_at`| `timestamptz` | Waktu registrasi |

### 2. Tabel `schedules`
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key (Default: `gen_random_uuid()`) |
| `user_id` | `uuid` | ID pengguna (relasi ke `auth.users.id`) |
| `title` | `text` | Judul kegiatan / jadwal |
| `description`| `text` | Rincian target belajar / sub-tugas |
| `start_time`| `timestamptz` | Waktu mulai (format ISO8601 + offset zona waktu) |
| `end_time` | `timestamptz` | Waktu selesai (format ISO8601 + offset zona waktu) |
| `status` | `text` | Status jadwal: `active` / `inactive` / `completed` |
| `priority` | `text` | Prioritas jadwal (default: `medium`) |
| `workspace` | `text` | Tag workspace: `Jadwal Kuliah` / `Rencana Belajar` / `Agenda Kerja` (opsional) |
| `created_at`| `timestamptz` | Waktu pembuatan data |

---

## 🌐 Endpoint API Utama

| Method | Endpoint | Fungsi |
| :--- | :--- | :--- |
| `POST` | `/api/chat` | Kirim pesan ke AI agent (mendukung `timezone` & `workspace`) |
| `POST` | `/api/upload-schedule` | Ekstraksi jadwal dari foto/PDF/Excel/CSV |
| `GET` | `/api/schedules` | Daftar jadwal mendatang (query `timezone_name` opsional) |
| `GET` | `/api/schedules/all` | Seluruh jadwal termasuk yang sudah lewat (Riwayat) |
| `PATCH/PUT` | `/api/schedules/{id}` | Perbarui jadwal (status, waktu, judul, workspace, dll) |
| `DELETE` | `/api/schedules/{id}` | Hapus jadwal berdasarkan ID |

---

## 💡 Contoh Perintah Chat ke TempoAgent

- *"Buatkan jadwal belajar React besok malam jam 20.00 sampai 21.30 lengkap dengan sub-tugas materi dasar."*
- *"Cek apakah ada jadwal kegiatan untuk hari ini?"*
- *"Jadwalkan review sprint dan meeting tim lusa jam 14.00 sampai 15.30."*
- *"Aktifkan jadwal belajar algoritma, lalu ubah jamnya ke jam 19.00."*
- *"Hapus jadwal praktikum basis data."*
- *"Bantu susun rencana belajar algoritma minggu ini dengan pembagian waktu yang optimal."*

---

## 📄 Lisensi
Proyek ini dibuat dan dikembangkan untuk keperluan personal task optimization di bawah lisensi open source.
