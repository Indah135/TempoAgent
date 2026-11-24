import os
from typing import Any, List
from fastapi import FastAPI, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone

# Cek file .env di backend/ maupun di folder utama (root)
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


from src import database, extractor
from src.agent import TempoAgent
from src.tools import (
    get_tz_hours,
    get_tz_offset,
    resolve_timezone,
    resolve_user_id,
    resolve_workspace,
)

app = FastAPI(
    title="TempoAgent API",
    description="Backend API untuk Personal Task & Schedule Optimizer Agent",
    version="1.0.0",
)

# Konfigurasi CORS agar frontend (React/Vite) dapat mengakses API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inisialisasi TempoAgent sebagai singleton
agent_instance: TempoAgent | None = None


def get_agent() -> TempoAgent:
    global agent_instance
    if agent_instance is None:
        agent_instance = TempoAgent()
    return agent_instance


class ChatRequest(BaseModel):
    message: str
    # Zona waktu pengguna: "WIB" / "WITA" / "WIT" (atau nama IANA).
    # Jika kosong, backend membaca dari tabel Profiles (fallback WIB).
    timezone: str | None = None
    # Workspace aktif: "Jadwal Kuliah" / "Rencana Belajar" / "Agenda Kerja".
    # Jika kosong, jadwal baru disimpan tanpa workspace (umum).
    workspace: str | None = None


class ChatResponse(BaseModel):
    reply: str


class UpdateScheduleRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    schedule_date: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    status: str | None = None
    priority: str | None = None
    timezone: str | None = None
    # String kosong "" = hapus tag workspace; None = tidak diubah
    workspace: str | None = None


@app.get("/")
def root():
    return {
        "name": "TempoAgent API",
        "status": "online",
        "docs": "/docs",
    }


@app.post("/api/chat", response_model=ChatResponse)
def chat_with_agent(payload: ChatRequest):
    """
    Menerima pesan dari pengguna, meneruskannya ke TempoAgent (Gemini),
    dan mengembalikan respons teks dari agent.
    """
    user_message = payload.message.strip()
    if not user_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pesan tidak boleh kosong.",
        )

    try:
        agent = get_agent()
        reply_text = agent.send_message(
            user_message,
            timezone_name=payload.timezone,
            timezone=payload.timezone,
            workspace=payload.workspace,
        )
        return ChatResponse(reply=reply_text)
    except Exception as exc:
        return ChatResponse(
            reply=f"Terjadi kesalahan saat memproses permintaan: {str(exc)}"
        )


DAY_NAME_TO_INT = {
    "senin": 0, "monday": 0,
    "selasa": 1, "tuesday": 1,
    "rabu": 2, "wednesday": 2,
    "kamis": 3, "thursday": 3,
    "jumat": 4, "jum'at": 4, "friday": 4,
    "sabtu": 5, "saturday": 5,
    "minggu": 6, "ahad": 6, "sunday": 6,
}


def _day_to_nearest_date(day_name: str, tz_hours: int) -> str:
    """Mengonversi nama hari (misal 'Senin') menjadi tanggal terdekat (YYYY-MM-DD)."""
    now = datetime.now(timezone(timedelta(hours=tz_hours)))
    today_date = now.date()
    today_weekday = today_date.weekday()  # 0 = Senin, 6 = Minggu
    target_weekday = DAY_NAME_TO_INT.get(day_name.lower().strip(), today_weekday)
    diff = (target_weekday - today_weekday) % 7
    target_date = today_date + timedelta(days=diff)
    return target_date.strftime("%Y-%m-%d")


def _normalize_time_str(time_str: str | None, default: str) -> str:
    if not time_str:
        return default
    clean = str(time_str).strip()
    if len(clean) == 4 and clean[1] == ":":
        clean = "0" + clean
    if len(clean) >= 5 and clean[2] == ":":
        return clean[:5]
    return default


@app.post("/api/upload-schedule")
async def upload_schedule_file(
    file: UploadFile = File(...),
    timezone_name: str | None = Form(None),
    workspace: str | None = Form(None),
):
    """
    Ekstraksi jadwal dari foto (JPG/PNG/WEBP) atau dokumen (PDF/Excel/CSV)
    menggunakan Groq (hybrid vision/text). Mengonversi nama hari menjadi tanggal
    terdekat dan menyimpannya ke Supabase dengan workspace pilihan pengguna
    (default 'Jadwal Kuliah').
    """
    try:
        file_bytes = await file.read()
        filename = file.filename or "uploaded_schedule"

        extracted_items = extractor.extract_schedule_from_file(
            file_bytes, filename, content_type=file.content_type
        )
        if not extracted_items:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Tidak ada jadwal yang berhasil dideteksi dari file yang diunggah.",
            )

        resolve_timezone(timezone_name)
        tz_offset = get_tz_offset()
        tz_hours = get_tz_hours()
        user_id = resolve_user_id()
        ws_label = resolve_workspace(workspace) or "Jadwal Kuliah"

        saved_schedules = []
        for item in extracted_items:
            day_str = item.get("day", "Senin")
            target_date = _day_to_nearest_date(day_str, tz_hours)

            start_time = _normalize_time_str(item.get("start_time"), "08:00")
            end_time = _normalize_time_str(item.get("end_time"), "10:00")

            start_iso = f"{target_date}T{start_time}:00{tz_offset}"
            end_iso = f"{target_date}T{end_time}:00{tz_offset}"

            inserted = database.insert_schedule(
                user_id=user_id,
                title=item.get("title", "Jadwal"),
                description=item.get("description", ""),
                start_time=start_iso,
                end_time=end_iso,
                status="active",
                priority="medium",
                workspace=ws_label,
            )
            if inserted:
                saved_schedules.append(inserted)

        return {
            "success": True,
            "count": len(saved_schedules),
            "filename": filename,
            "workspace": ws_label,
            "schedules": saved_schedules,
            "extracted_items": extracted_items,
            "message": f"Berhasil mengekstrak dan menyimpan {len(saved_schedules)} jadwal ke '{ws_label}'.",
        }
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terjadi kesalahan saat memproses file jadwal: {str(exc)}",
        )



@app.get("/api/schedules")
def get_schedules(timezone_name: str | None = None):
    """
    Mengambil daftar seluruh jadwal mendatang dari Supabase.

    Query `timezone` (opsional): "WIB" / "WITA" / "WIT" untuk menentukan
    batas "hari ini" sesuai zona waktu pengguna.
    """
    try:
        resolve_timezone(timezone_name)
        schedules = database.get_all_upcoming_schedules(
            resolve_user_id(), get_tz_offset()
        )
        return {"schedules": schedules}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal mengambil jadwal: {str(exc)}",
        )


@app.get("/api/schedules/all")
def get_all_schedules_endpoint():
    """
    Mengambil seluruh jadwal (termasuk yang sudah lewat) untuk Riwayat Tugas.
    """
    try:
        schedules = database.get_all_schedules(resolve_user_id())
        return {"schedules": schedules}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal mengambil riwayat jadwal: {str(exc)}",
        )


@app.patch("/api/schedules/{schedule_id}")
@app.put("/api/schedules/{schedule_id}")
def edit_schedule(schedule_id: str, payload: UpdateScheduleRequest):
    """
    Memperbarui status (aktif/nonaktif/selesai), waktu, judul, atau deskripsi jadwal.
    """
    current = database.get_schedule_by_id(schedule_id)
    if not current:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Jadwal dengan ID {schedule_id} tidak ditemukan.",
        )

    updates: dict[str, Any] = {}
    if payload.title is not None:
        updates["title"] = payload.title
    if payload.description is not None:
        updates["description"] = payload.description
    if payload.status is not None:
        updates["status"] = payload.status
    if payload.priority is not None:
        updates["priority"] = payload.priority
    if payload.workspace is not None:
        # String kosong -> None (hapus tag workspace)
        updates["workspace"] = payload.workspace.strip() or None

    # Zona waktu pengguna untuk menyusun ulang timestamp
    resolve_timezone(payload.timezone)
    tz_offset = get_tz_offset()
    tz_hours = get_tz_hours()

    curr_start = str(current.get("start_time", ""))
    curr_end = str(current.get("end_time", ""))

    date_part = payload.schedule_date
    if not date_part and "T" in curr_start:
        date_part = curr_start.split("T")[0]
    elif not date_part:
        date_part = datetime.now(
            timezone(timedelta(hours=tz_hours))
        ).strftime("%Y-%m-%d")

    if payload.start_time:
        if "T" not in payload.start_time:
            updates["start_time"] = f"{date_part}T{payload.start_time[:5]}:00{tz_offset}"
        else:
            updates["start_time"] = payload.start_time
    elif payload.schedule_date and "T" in curr_start:
        time_part = curr_start.split("T")[1][:8]
        updates["start_time"] = f"{date_part}T{time_part}{tz_offset}"

    if payload.end_time:
        if "T" not in payload.end_time:
            updates["end_time"] = f"{date_part}T{payload.end_time[:5]}:00{tz_offset}"
        else:
            updates["end_time"] = payload.end_time
    elif payload.schedule_date and "T" in curr_end:
        time_part = curr_end.split("T")[1][:8]
        updates["end_time"] = f"{date_part}T{time_part}{tz_offset}"

    try:
        updated = database.update_schedule(schedule_id, updates)
        return {
            "success": True,
            "message": "Jadwal berhasil diperbarui.",
            "schedule": updated,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal memperbarui jadwal: {str(exc)}",
        )


@app.delete("/api/schedules/{schedule_id}")
def remove_schedule(schedule_id: str):
    """
    Menghapus jadwal berdasarkan ID dari database.
    """
    try:
        success = database.delete_schedule(schedule_id)
        return {
            "success": success,
            "message": f"Jadwal dengan ID {schedule_id} berhasil dihapus.",
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal menghapus jadwal: {str(exc)}",
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
