import os
from datetime import datetime, timezone
from typing import Any
from pathlib import Path
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

SUPABASE_URL = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "").strip()
SUPABASE_KEY = (os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or "").strip()

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "SUPABASE_URL dan SUPABASE_KEY belum diisi. "
        "Salin .env.example menjadi .env lalu isi nilainya."
    )

client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TABLE = "schedules"


def get_schedules_by_date(user_id: str, schedule_date: str) -> list[dict[str, Any]]:
    # schedule_date format: "YYYY-MM-DD", dicari dalam rentang awal hingga akhir hari tersebut
    start_of_day = f"{schedule_date}T00:00:00+07:00"
    end_of_day = f"{schedule_date}T23:59:59+07:00"

    response = (
        client.table(TABLE)
        .select("*")
        .eq("user_id", user_id)
        .gte("start_time", start_of_day)
        .lte("start_time", end_of_day)
        .order("start_time")
        .execute()
    )
    return response.data or []


def get_all_upcoming_schedules(user_id: str) -> list[dict[str, Any]]:
    now_iso = datetime.now(timezone.utc).isoformat()
    response = (
        client.table(TABLE)
        .select("*")
        .eq("user_id", user_id)
        .gte("start_time", now_iso)
        .order("start_time")
        .execute()
    )
    return response.data or []


def insert_schedule(
    user_id: str,
    title: str,
    description: str,
    start_time: str,
    end_time: str,
    status: str = "pending",
    priority: str = "medium",
) -> dict[str, Any] | None:
    # start_time & end_time menggunakan format timestamptz, contoh: "2026-11-15T09:00:00+07:00"
    response = (
        client.table(TABLE)
        .insert(
            {
                "user_id": user_id,
                "title": title,
                "description": description,
                "start_time": start_time,
                "end_time": end_time,
                "status": status,
                "priority": priority,
            }
        )
        .execute()
    )
    if response.data:
        return response.data[0]
    return None


def delete_schedule(schedule_id: str) -> bool:
    client.table(TABLE).delete().eq("id", schedule_id).execute()
    return True