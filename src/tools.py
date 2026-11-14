from datetime import datetime

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

    schedules = database.get_schedules_by_date(date)
    if not schedules:
        return f"Tidak ada jadwal pada {date}. Hari tersebut kosong."

    lines = [f"Jadwal yang sudah ada pada {date}:"]
    for item in schedules:
        mulai = str(item["start_time"])[:5]
        selesai = str(item["end_time"])[:5]
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
            title=title,
            description=description,
            schedule_date=date,
            start_time=start_time,
            end_time=end_time,
        )
    except Exception as exc:
        return f"Gagal menyimpan jadwal: {exc}"

    return (
        f"Jadwal '{title}' berhasil disimpan pada {date} "
        f"pukul {start_time}-{end_time}."
    )
