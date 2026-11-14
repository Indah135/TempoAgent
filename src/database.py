import os
from datetime import date
from typing import Any

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "SUPABASE_URL dan SUPABASE_KEY belum diisi. "
        "Salin .env.example menjadi .env lalu isi nilainya."
    )

client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TABLE = "schedules"


def get_schedules_by_date(schedule_date: str) -> list[dict[str, Any]]:
    response = (
        client.table(TABLE)
        .select("*")
        .eq("schedule_date", schedule_date)
        .order("start_time")
        .execute()
    )
    return response.data or []


def get_all_upcoming_schedules() -> list[dict[str, Any]]:
    today = date.today().isoformat()
    response = (
        client.table(TABLE)
        .select("*")
        .gte("schedule_date", today)
        .order("schedule_date")
        .order("start_time")
        .execute()
    )
    return response.data or []


def insert_schedule(
    title: str,
    description: str,
    schedule_date: str,
    start_time: str,
    end_time: str,
) -> dict[str, Any] | None:
    response = (
        client.table(TABLE)
        .insert(
            {
                "title": title,
                "description": description,
                "schedule_date": schedule_date,
                "start_time": start_time,
                "end_time": end_time,
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
