import os
from datetime import datetime
from typing import Any

from . import database

_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
_BULAN = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
]

# Zona waktu konsisten dengan format yang dipakai database.py (+07:00)
_TZ_OFFSET = "+07:00"

# Cache user_id agar tidak query berulang-ulang
_USER_ID_CACHE: str | None = None


def resolve_user_id() -> str:
    """Menentukan user_id untuk operasi jadwal.

    Prioritas:
    1. Variabel env USER_ID / DEFAULT_USER_ID
    2. Ambil user pertama dari tabel Profiles (fallback single-user)
    """
    global _USER_ID_CACHE
    if _USER_ID_CACHE:
        return _USER_ID_CACHE

    env_user = (os.getenv("USER_ID") or os.getenv("DEFAULT_USER_ID") or "").strip()
    if env_user:
        _USER_ID_CACHE = env_user
        return _USER_ID_CACHE

    try:
        rows: list[dict[str, Any]] = (
            database.client.table("Profiles").select("id").limit(1).execute().data or []
        )
    except Exception as exc:
        raise RuntimeError(
            "Gagal menentukan user_id dari tabel Profiles. "
            "Isi USER_ID di file .env."
        ) from exc

    if not rows:
        raise RuntimeError(
            "Tabel Profiles masih kosong dan USER_ID belum diisi di file .env."
        )

    _USER_ID_CACHE = str(rows[0]["id"])
    return _USER_ID_CACHE


def _to_timestamptz(date: str, time: str) -> str:
    """Gabungkan YYYY-MM-DD dan HH:MM menjadi timestamptz ala database.py."""
    return f"{date}T{time}:00{_TZ_OFFSET}"


def _format_time(value: Any) -> str:
    """Ambil bagian HH:MM dari kolom time/timestamptz (dikonversi ke +07:00)."""
    text = str(value)
    if "T" not in text:
        return text[:5]
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            return text.split("T", 1)[1][:5]
        from datetime import timezone, timedelta

        return parsed.astimezone(timezone(timedelta(hours=7))).strftime("%H:%M")
    except Exception:
        return text.split("T", 1)[1][:5]


def get_current_datetime() -> str:
    """Mengembalikan tanggal, hari, dan jam saat ini.

    Returns:
        Waktu sekarang dalam format lokal, contoh:
        "Sabtu, 14 November 2026 10:32 WIB".
    """
    now = datetime.now().astimezone()
    hari = _HARI[now.weekday()]
    bulan = _BULAN[now.month - 1]
    zona = now.tzname() or ""
    return f"{hari}, {now.day} {bulan} {now.year} {now.strftime('%H:%M')} {zona}".strip()


def check_availability(date: str) -> str:
    """Memeriksa jadwal yang sudah tersimpan pada tanggal tertentu.

    Args:
        date: Tanggal dalam format YYYY-MM-DD, contoh "2026-11-15".

    Returns:
        Ringkasan seluruh jadwal pada tanggal tersebut, atau pesan bahwa
        hari itu kosong / format tanggal tidak valid.
    """
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        return f"Format tanggal tidak valid: {date}. Gunakan format YYYY-MM-DD."

    schedules = database.get_schedules_by_date(resolve_user_id(), date)
    if not schedules:
        return f"Tidak ada jadwal pada {date}. Hari tersebut kosong."

    lines = [f"Jadwal yang sudah ada pada {date}:"]
    for item in schedules:
        mulai = _format_time(item["start_time"])
        selesai = _format_time(item["end_time"])
        baris = f"- {mulai}-{selesai} | {item['title']}"
        if item.get("description"):
            baris += f" | {item['description']}"
        lines.append(baris)
    return "\n".join(lines)


def create_new_schedule(
    title: str,
    description: str,
    date: str,
    start_time: str,
    end_time: str,
) -> str:
    """Menambahkan jadwal baru ke database setelah validasi input.

    Args:
        title: Judul jadwal.
        description: Deskripsi, target belajar, atau daftar sub-tugas
            (satu poin per baris, diawali "- ").
        date: Tanggal jadwal dalam format YYYY-MM-DD.
        start_time: Jam mulai dalam format HH:MM (24 jam), contoh "19:00".
        end_time: Jam selesai dalam format HH:MM (24 jam), contoh "21:00".

    Returns:
        Konfirmasi berhasil beserta detail jadwal, atau pesan kesalahan.
    """
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        return f"Format tanggal tidak valid: {date}. Gunakan format YYYY-MM-DD."

    try:
        mulai = datetime.strptime(start_time, "%H:%M")
        selesai = datetime.strptime(end_time, "%H:%M")
    except ValueError:
        return "Format jam tidak valid. Gunakan HH:MM (24 jam), contoh 19:00."

    if selesai <= mulai:
        return "Jam selesai harus lebih besar daripada jam mulai."

    try:
        database.insert_schedule(
            user_id=resolve_user_id(),
            title=title,
            description=description,
            start_time=_to_timestamptz(date, start_time),
            end_time=_to_timestamptz(date, end_time),
        )
    except Exception as exc:
        return f"Gagal menyimpan jadwal: {exc}"

    return (
        f"Jadwal '{title}' berhasil disimpan pada {date} "
        f"pukul {start_time}-{end_time}."
    )
