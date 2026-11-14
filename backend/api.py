import os
from typing import Any, List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from dotenv import load_dotenv

# Cek file .env di backend/ maupun di folder utama (root)
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


from src import database
from src.agent import TempoAgent

app = FastAPI(
    title="TempoAgent API",
    description="Backend API untuk Personal Task & Schedule Optimizer Agent",
    version="1.0.0",
)

# Konfigurasi CORS agar frontend (React/Vite) dapat mengakses API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Mengizinkan semua origin (misal: http://localhost:5173)
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
        # Menangani error seperti API key belum terisi atau koneksi
        return ChatResponse(
            reply=f"Terjadi kesalahan saat memproses permintaan: {str(exc)}"
        )


@app.get("/api/schedules")
def get_schedules():
    """
    Mengambil daftar seluruh jadwal mendatang dari Supabase.
    """
    try:
        schedules = database.get_all_upcoming_schedules()
        return {"schedules": schedules}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal mengambil jadwal: {str(exc)}",
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
