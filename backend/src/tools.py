import os
import time
from contextvars import ContextVar
from datetime import datetime, timedelta, timezone
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

_USER_ID_CACHE: str | None = None

# Peta zona waktu Indonesia: label -> (offset ISO8601, jam)
TZ_OFFSETS: dict[str, tuple[str, int]] = {
    "WIB": ("+07:00", 7),
    "WITA": ("+08:00", 8),
    "WIT": ("+09:00", 9),
}
DEFAULT_TIMEZONE = "WIB"

# Alias yang diterima (label, nama IANA, maupun offset) -> label resmi
_TZ_ALIASES: dict[str, str] = {
    "wib": "WIB",
    "asia/jakarta": "WIB",
    "asia/pontianak": "WIB",
    "utc+7": "WIB",
    "gmt+7": "WIB",
    "+07:00": "WIB",
    "wita": "WITA",
    "asia/makassar": "WITA",
    "utc+8": "WITA",
    "gmt+8": "WITA",
    "+08:00": "WITA",
    "wit": "WIT",
    "asia/jayapura": "WIT",
    "asia/meraure": "WIT",
    "utc+9": "WIT",
    "gmt+9": "WIT",
    "+09:00": "WIT",
}

# Zona waktu aktif untuk request/percakapan yang sedang berjalan
_TZ_CTX: ContextVar[str] = ContextVar("tempo_timezone", default=DEFAULT_TIMEZONE)
_PROFILE_TZ_CACHE: dict[str, Any] = {"value": None, "at": 0.0}
_PROFILE_TZ_TTL = 60.0

# Workspace aktif untuk request/percakapan yang sedang berjalan (null = umum)
_WS_CTX: ContextVar[str | None] = ContextVar("tempo_workspace", default=None)

# Nama workspace resmi — harus sama dengan daftar di src/lib/workspaces.js
WORKSPACE_NAMES: tuple[str, ...] = (
    "Jadwal Kuliah",
    "Rencana Belajar",
    "Agenda Kerja",
)


def resolve_workspace(value: Any = None) -> str | None:
    """Tentukan workspace request saat ini lalu simpan ke contextvar.

    Mengembalikan nama resmi (case-insensitive) atau None jika kosong/tidak dikenal.
    """
    if value is None:
        _WS_CTX.set(None)
        return None
    text = str(value).strip()
    if not text:
        _WS_CTX.set(None)
        return None
    lower = text.lower()
    match = next((name for name in WORKSPACE_NAMES if name.lower() == lower), None)
    _WS_CTX.set(match)
    return match


def get_workspace() -> str | None:
    """Workspace yang berlaku untuk request/percakapan ini (None = umum)."""
    return _WS_CTX.get()


def normalize_timezone(value: Any) -> str:
    """Petakan berbagai bentuk nama zona waktu ke label WIB / WITA / WIT."""
    if value is None:
        return DEFAULT_TIMEZONE
    text = str(value).strip()
    if not text:
        return DEFAULT_TIMEZONE
    if text.upper() in TZ_OFFSETS:
        return text.upper()
    return _TZ_ALIASES.get(text.lower(), DEFAULT_TIMEZONE)


def _profile_timezone() -> str:
    """Baca zona waktu dari tabel Profiles (di-cache singkat). Gagal -> default."""
    now = time.monotonic()
    cached = _PROFILE_TZ_CACHE["value"]
    if cached is not None and now - _PROFILE_TZ_CACHE["at"] < _PROFILE_TZ_TTL:
        return str(cached)

    result = DEFAULT_TIMEZONE
    try:
        rows: list[dict[str, Any]] = (
            database.client.table("Profiles")
            .select("timezone")
            .eq("id", resolve_user_id())
            .limit(1)
            .execute()
            .data
            or []
        )
        if rows and rows[0].get("timezone"):
            result = normalize_timezone(rows[0]["timezone"])
    except Exception:
        result = DEFAULT_TIMEZONE

    _PROFILE_TZ_CACHE["value"] = result
    _PROFILE_TZ_CACHE["at"] = now
    return result


def resolve_timezone(value: Any = None) -> str:
    """Tentukan zona waktu request saat ini lalu simpan ke contextvar.

    Jika `value` kosong, ambil dari tabel Profiles (fallback: WIB).
    """
    if value is not None and str(value).strip():
        tz = normalize_timezone(value)
    else:
        tz = _profile_timezone()
    _TZ_CTX.set(tz)
    return tz


def get_timezone() -> str:
    """Zona waktu yang berlaku untuk request/percakapan ini."""
    return _TZ_CTX.get()


def get_tz_offset() -> str:
    """Offset ISO8601 zona waktu aktif, contoh '+08:00'."""
    return TZ_OFFSETS[get_timezone()][0]


def get_tz_hours() -> int:
    """Jam offset zona waktu aktif, contoh 8."""
    return TZ_OFFSETS[get_timezone()][1]


def resolve_user_id() -> str:
    """Menentukan user_id untuk operasi jadwal."""
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
    """Gabungkan YYYY-MM-DD dan HH:MM menjadi timestamptz sesuai zona waktu aktif."""
    return f"{date}T{time}:00{get_tz_offset()}"


def _format_time(value: Any) -> str:
    """Ambil bagian HH:MM dari kolom time/timestamptz (konversi ke zona waktu aktif)."""
    text = str(value)
    if "T" not in text:
        return text[:5]
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            return text.split("T", 1)[1][:5]
        target = timezone(timedelta(hours=get_tz_hours()))
        return parsed.astimezone(target).strftime("%H:%M")
    except Exception:
        return text.split("T", 1)[1][:5]


def _format_date(value: Any) -> str:
    """Ambil bagian YYYY-MM-DD dari kolom timestamptz (konversi ke zona waktu aktif)."""
    text = str(value)
    if "T" not in text:
        return text[:10]
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            return text.split("T")[0]
        target = timezone(timedelta(hours=get_tz_hours()))
        return parsed.astimezone(target).strftime("%Y-%m-%d")
    except Exception:
        return text.split("T")[0]


def check_availability(date: str) -> str:
    """Memeriksa jadwal yang sudah tersimpan pada tanggal tertentu.

    Args:
        date: Tanggal dalam format YYYY-MM-DD, contoh "2026-11-15".

    Returns:
        Ringkasan seluruh jadwal pada tanggal tersebut beserta statusnya.
    """
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        return f"Format tanggal tidak valid: {date}. Gunakan format YYYY-MM-DD."

    schedules = database.get_schedules_by_date(
        resolve_user_id(), date, get_tz_offset()
    )
    if not schedules:
        return f"Tidak ada jadwal pada {date}. Hari tersebut kosong."

    lines = [f"Jadwal pada {date}:"]
    for item in schedules:
        mulai = _format_time(item["start_time"])
        selesai = _format_time(item["end_time"])
        status = item.get("status", "active")
        id_str = item.get("id", "")
        baris = f"- [ID: {id_str}] {mulai}-{selesai} | {item['title']} (Status: {status})"
        if item.get("description"):
            baris += f" | {item['description']}"
        lines.append(baris)
    return "\n".join(lines)


def list_schedules(query: str = "") -> str:
    """Mencari atau menampilkan daftar jadwal pengguna beserta ID, jam, dan statusnya.

    Args:
        query: Kata kunci judul jadwal (kosongkan untuk melihat jadwal mendatang).

    Returns:
        Daftar jadwal lengkap dengan ID untuk keperluan edit, aktivasi, atau hapus.
    """
    user_id = resolve_user_id()
    if query.strip():
        items = database.search_schedules(user_id, query.strip())
    else:
        items = database.get_all_upcoming_schedules(user_id, get_tz_offset())

    if not items:
        if query:
            return f"Tidak ditemukan jadwal yang cocok dengan kata kunci '{query}'."
        return "Belum ada jadwal yang tersimpan."

    lines = ["Daftar Jadwal:"]
    for item in items:
        tgl = _format_date(item["start_time"])
        mulai = _format_time(item["start_time"])
        selesai = _format_time(item["end_time"])
        st = item.get("status", "active")
        lines.append(
            f"- ID: {item['id']} | {item['title']} | Tanggal: {tgl} | Jam: {mulai}-{selesai} | Status: {st}"
        )
    return "\n".join(lines)


def create_new_schedule(
    title: str,
    description: str,
    date: str,
    start_time: str,
    end_time: str,
    status: str = "active",
) -> str:
    """Menambahkan jadwal baru ke database setelah validasi input.

    Args:
        title: Judul jadwal.
        description: Deskripsi, target belajar, atau daftar sub-tugas.
        date: Tanggal jadwal dalam format YYYY-MM-DD.
        start_time: Jam mulai dalam format HH:MM (24 jam), contoh "19:00".
        end_time: Jam selesai dalam format HH:MM (24 jam), contoh "21:00".
        status: Status jadwal (default: "active", atau "scheduled").
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
            status=status,
            workspace=get_workspace(),
        )
    except Exception as exc:
        return f"Gagal menyimpan jadwal: {exc}"

    return (
        f"Jadwal '{title}' berhasil disimpan pada {date} "
        f"pukul {start_time}-{end_time} dengan status '{status}'."
    )


def update_existing_schedule(
    schedule_id: str,
    title: str = "",
    description: str = "",
    date: str = "",
    start_time: str = "",
    end_time: str = "",
    status: str = "",
) -> str:
    """Memperbarui informasi jadwal (status, waktu, judul, deskripsi) berdasarkan ID.

    Args:
        schedule_id: UUID jadwal yang ingin diperbarui.
        title: Judul baru (opsional).
        description: Deskripsi baru (opsional).
        date: Tanggal baru YYYY-MM-DD (opsional).
        start_time: Jam mulai baru HH:MM (opsional).
        end_time: Jam selesai baru HH:MM (opsional).
        status: Status baru: 'active' (aktifkan), 'inactive' (nonaktifkan), 'completed' (selesai).
    """
    current = database.get_schedule_by_id(schedule_id)
    if not current:
        return f"Jadwal dengan ID {schedule_id} tidak ditemukan."

    updates: dict[str, Any] = {}
    if title:
        updates["title"] = title
    if description:
        updates["description"] = description
    if status:
        updates["status"] = status.lower()

    # Hitung start_time dan end_time jika ada perubahan waktu/tanggal
    curr_date = _format_date(current["start_time"])
    curr_start = _format_time(current["start_time"])
    curr_end = _format_time(current["end_time"])

    target_date = date if date else curr_date
    target_start = start_time if start_time else curr_start
    target_end = end_time if end_time else curr_end

    if date or start_time:
        updates["start_time"] = _to_timestamptz(target_date, target_start)
    if date or end_time:
        updates["end_time"] = _to_timestamptz(target_date, target_end)

    try:
        res = database.update_schedule(schedule_id, updates)
        if not res:
            return f"Gagal memperbarui jadwal {schedule_id}."
        return f"Jadwal '{res.get('title')}' berhasil diperbarui! Status saat ini: '{res.get('status')}'."
    except Exception as exc:
        return f"Terjadi kesalahan saat update jadwal: {exc}"


def delete_existing_schedule(schedule_id: str) -> str:
    """Menghapus jadwal berdasarkan ID dari database.

    Args:
        schedule_id: UUID jadwal yang ingin dihapus.
    """
    current = database.get_schedule_by_id(schedule_id)
    if not current:
        return f"Jadwal dengan ID {schedule_id} tidak ditemukan."

    try:
        database.delete_schedule(schedule_id)
        return f"Jadwal '{current.get('title')}' (ID: {schedule_id}) berhasil dihapus."
    except Exception as exc:
        return f"Gagal menghapus jadwal: {exc}"


def manage_schedule_by_title(
    title_keyword: str,
    action: str,
    new_status: str = "",
    new_date: str = "",
    new_start_time: str = "",
    new_end_time: str = "",
    new_title: str = "",
) -> str:
    """Mengelola jadwal berdasarkan pencarian judul (tanpa harus tahu ID jadwal).

    Args:
        title_keyword: Kata kunci judul jadwal yang dicari (contoh: "belajar python", "rapat").
        action: Aksi yang diinginkan: 'activate' (aktifkan), 'deactivate' (nonaktifkan),
                'complete' (tandai selesai), 'delete' (hapus), 'update' (ubah waktu/judul).
        new_status: Status baru jika action='update'.
        new_date: Tanggal baru YYYY-MM-DD jika diubah.
        new_start_time: Jam mulai baru HH:MM jika diubah.
        new_end_time: Jam selesai baru HH:MM jika diubah.
        new_title: Judul baru jika diubah.
    """
    user_id = resolve_user_id()
    matches = database.search_schedules(user_id, title_keyword)
    if not matches:
        return f"Tidak ditemukan jadwal yang cocok dengan '{title_keyword}'."

    target = matches[0]
    schedule_id = str(target["id"])
    target_title = target.get("title")

    action = action.lower().strip()
    if action == "delete":
        return delete_existing_schedule(schedule_id)
    elif action == "activate":
        return update_existing_schedule(schedule_id, status="active")
    elif action == "deactivate":
        return update_existing_schedule(schedule_id, status="inactive")
    elif action == "complete":
        return update_existing_schedule(schedule_id, status="completed")
    elif action == "update":
        return update_existing_schedule(
            schedule_id=schedule_id,
            title=new_title,
            date=new_date,
            start_time=new_start_time,
            end_time=new_end_time,
            status=new_status,
        )
    else:
        return f"Aksi '{action}' tidak dikenali. Pilih antara: activate, deactivate, complete, delete, update."
