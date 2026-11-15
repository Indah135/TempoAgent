import os
from typing import Any, List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime

# Cek file .env di backend/ maupun di folder utama (root)
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


from src import database
from src.agent import TempoAgent
from src.tools import resolve_user_id

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
        reply_text = agent.send_message(user_message)
        return ChatResponse(reply=reply_text)
    except Exception as exc:
        return ChatResponse(
            reply=f"Terjadi kesalahan saat memproses permintaan: {str(exc)}"
        )


@app.get("/api/schedules")
def get_schedules():
    """
    Mengambil daftar seluruh jadwal mendatang dari Supabase.
    """
    try:
        schedules = database.get_all_upcoming_schedules(resolve_user_id())
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

    curr_start = str(current.get("start_time", ""))
    curr_end = str(current.get("end_time", ""))

    date_part = payload.schedule_date
    if not date_part and "T" in curr_start:
        date_part = curr_start.split("T")[0]
    elif not date_part:
        date_part = datetime.now().strftime("%Y-%m-%d")

    if payload.start_time:
        if "T" not in payload.start_time:
            updates["start_time"] = f"{date_part}T{payload.start_time[:5]}:00+07:00"
        else:
            updates["start_time"] = payload.start_time
    elif payload.schedule_date and "T" in curr_start:
        time_part = curr_start.split("T")[1][:8]
        updates["start_time"] = f"{date_part}T{time_part}+07:00"

    if payload.end_time:
        if "T" not in payload.end_time:
            updates["end_time"] = f"{date_part}T{payload.end_time[:5]}:00+07:00"
        else:
            updates["end_time"] = payload.end_time
    elif payload.schedule_date and "T" in curr_end:
        time_part = curr_end.split("T")[1][:8]
        updates["end_time"] = f"{date_part}T{time_part}+07:00"

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
