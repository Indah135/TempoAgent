import ast
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List

from dotenv import load_dotenv
from groq import Groq

from . import tools

# Cek file .env di backend/ maupun di root folder utama
load_dotenv(Path(__file__).resolve().parents[1] / ".env")
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

# Model utama sesuai permintaan, dengan fallback ke model lain yang
# tersedia pada API key Groq jika model utama tidak bisa diakses.
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
FALLBACK_MODELS = [
    "llama-3.3-70b-versatile",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
]
MAX_TOOL_ROUNDS = 6

# Fungsi tool yang tersedia untuk function calling
TOOL_FUNCTIONS: Dict[str, Callable[..., Any]] = {
    "check_availability": tools.check_availability,
    "list_schedules": tools.list_schedules,
    "create_new_schedule": tools.create_new_schedule,
    "update_existing_schedule": tools.update_existing_schedule,
    "delete_existing_schedule": tools.delete_existing_schedule,
    "manage_schedule_by_title": tools.manage_schedule_by_title,
}

_STR = {"type": "string"}

# Skema tool bergaya OpenAI function calling (dipakai Groq)
TOOLS_SCHEMA: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "check_availability",
            "description": (
                "Memeriksa seluruh jadwal pada tanggal tertentu beserta ID dan "
                "statusnya. Disarankan dipanggil sebelum create_new_schedule."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {
                        **_STR,
                        "description": "Tanggal dalam format YYYY-MM-DD, contoh 2026-11-15.",
                    }
                },
                "required": ["date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_schedules",
            "description": (
                "Mencari atau menampilkan daftar jadwal pengguna beserta ID, jam, "
                "dan statusnya. Gunakan untuk edit, aktivasi, atau hapus jadwal."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        **_STR,
                        "description": (
                            "Kata kunci judul jadwal (kosongkan/isi '' untuk "
                            "melihat jadwal mendatang)."
                        ),
                    }
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_new_schedule",
            "description": "Menambahkan jadwal baru ke database setelah validasi input.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Judul jadwal."},
                    "description": {
                        "type": "string",
                        "description": (
                            "Deskripsi, target belajar, atau daftar sub-tugas "
                            "(satu poin per baris, diawali '- ')."
                        ),
                    },
                    "date": {
                        "type": "string",
                        "description": "Tanggal jadwal dalam format YYYY-MM-DD.",
                    },
                    "start_time": {
                        "type": "string",
                        "description": "Jam mulai format HH:MM (24 jam), contoh 19:00.",
                    },
                    "end_time": {
                        "type": "string",
                        "description": "Jam selesai format HH:MM (24 jam), contoh 21:00.",
                    },
                    "status": {
                        "type": "string",
                        "description": "Status jadwal, default 'active'.",
                    },
                },
                "required": ["title", "description", "date", "start_time", "end_time"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_existing_schedule",
            "description": (
                "Memperbarui informasi jadwal (status, waktu, judul, deskripsi) "
                "berdasarkan ID jadwal."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "schedule_id": {
                        "type": "string",
                        "description": "UUID jadwal yang ingin diperbarui.",
                    },
                    "title": {"type": "string", "description": "Judul baru (opsional)."},
                    "description": {
                        "type": "string",
                        "description": "Deskripsi baru (opsional).",
                    },
                    "date": {
                        "type": "string",
                        "description": "Tanggal baru YYYY-MM-DD (opsional).",
                    },
                    "start_time": {
                        "type": "string",
                        "description": "Jam mulai baru HH:MM (opsional).",
                    },
                    "end_time": {
                        "type": "string",
                        "description": "Jam selesai baru HH:MM (opsional).",
                    },
                    "status": {
                        "type": "string",
                        "description": (
                            "Status baru: 'active' (aktifkan), 'inactive' "
                            "(nonaktifkan), 'completed' (selesai)."
                        ),
                    },
                },
                "required": ["schedule_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_existing_schedule",
            "description": "Menghapus jadwal berdasarkan ID dari database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "schedule_id": {
                        "type": "string",
                        "description": "UUID jadwal yang ingin dihapus.",
                    }
                },
                "required": ["schedule_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "manage_schedule_by_title",
            "description": (
                "Mengelola jadwal berdasarkan pencarian judul (tanpa harus tahu "
                "ID jadwal): activate, deactivate, complete, delete, atau update."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "title_keyword": {
                        "type": "string",
                        "description": "Kata kunci judul jadwal (contoh: 'belajar python').",
                    },
                    "action": {
                        "type": "string",
                        "description": (
                            "Aksi: 'activate', 'deactivate', 'complete', "
                            "'delete', atau 'update'."
                        ),
                    },
                    "new_status": {
                        "type": "string",
                        "description": "Status baru jika action='update'.",
                    },
                    "new_date": {
                        "type": "string",
                        "description": "Tanggal baru YYYY-MM-DD jika diubah.",
                    },
                    "new_start_time": {
                        "type": "string",
                        "description": "Jam mulai baru HH:MM jika diubah.",
                    },
                    "new_end_time": {
                        "type": "string",
                        "description": "Jam selesai baru HH:MM jika diubah.",
                    },
                    "new_title": {"type": "string", "description": "Judul baru jika diubah."},
                },
                "required": ["title_keyword", "action"],
            },
        },
    },
]

# Argumen wajib per tool (dipakai untuk validasi sebelum eksekusi)
REQUIRED_ARGS: Dict[str, List[str]] = {
    "check_availability": ["date"],
    "list_schedules": [],
    "create_new_schedule": ["title", "description", "date", "start_time", "end_time"],
    "update_existing_schedule": ["schedule_id"],
    "delete_existing_schedule": ["schedule_id"],
    "manage_schedule_by_title": ["title_keyword", "action"],
}

# Alias argumen yang sering salah ditulis model, dipetakan ke nama resmi
ARG_ALIASES: Dict[str, Dict[str, str]] = {
    "check_availability": {"schedule_date": "date", "tanggal": "date", "day": "date"},
    "list_schedules": {"keyword": "query", "q": "query"},
    "create_new_schedule": {
        "schedule_date": "date",
        "tanggal": "date",
        "start": "start_time",
        "end": "end_time",
        "jam_mulai": "start_time",
        "jam_selesai": "end_time",
    },
    "update_existing_schedule": {
        "id": "schedule_id",
        "schedule_date": "date",
        "tanggal": "date",
        "start": "start_time",
        "end": "end_time",
    },
    "delete_existing_schedule": {"id": "schedule_id"},
    "manage_schedule_by_title": {"keyword": "title_keyword", "judul": "title_keyword"},
}


def _is_model_not_found(exc: Exception) -> bool:
    """True jika error karena model tidak tersedia pada API key ini."""
    text = str(exc).lower()
    return "model_not_found" in text or "does not exist or you do not have access" in text


def _normalize_args(name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    """Petakan alias argumen ke nama parameter yang benar."""
    aliases = ARG_ALIASES.get(name, {})
    return {aliases.get(key, key): value for key, value in args.items()}


def _recover_tool_call(exc: Exception) -> tuple[str, str, str] | None:
    """Ambil tool call yang gagal validasi dari error Groq (`failed_generation`).

    Groq menyertakan JSON generasi model yang salah dalam field
    `failed_generation`; kita bisa pakai ulang agar percakapan tidak putus.
    """
    text = str(exc)
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        return None
    raw = text[start : end + 1]
    try:
        data = json.loads(raw)
    except Exception:
        try:
            data = ast.literal_eval(raw)
        except Exception:
            return None
    if not isinstance(data, dict):
        return None
    error = data.get("error")
    failed = data.get("failed_generation") or (
        error.get("failed_generation") if isinstance(error, dict) else None
    )
    if not failed:
        return None
    try:
        generation = json.loads(failed)
        tool_name = generation["name"]
        args = generation.get("arguments", {})
    except Exception:
        return None
    raw_args = args if isinstance(args, str) else json.dumps(args)
    tool_call_id = f"recover-{abs(hash(raw_args + tool_name))}"
    return tool_name, raw_args, tool_call_id


def _current_time_text(timezone_label: str) -> str:
    """Waktu sekarang dalam zona waktu pengguna, contoh: '2026-11-16 14:30:05 (Monday) WIB'."""
    hours = tools.TZ_OFFSETS.get(timezone_label, tools.TZ_OFFSETS["WIB"])[1]
    now = datetime.now(timezone(timedelta(hours=hours)))
    return f"{now.strftime('%Y-%m-%d %H:%M:%S (%A)')} {timezone_label}"


def get_system_instruction(
    current_time: str,
    timezone_label: str,
    workspace_label: str | None = None,
) -> str:
    """Membuat system instruction dengan waktu, zona waktu & workspace dinamis."""
    utc_offset = tools.TZ_OFFSETS.get(timezone_label, tools.TZ_OFFSETS["WIB"])[0]
    if workspace_label:
        ws_info = (
            f"Workspace aktif: {workspace_label}. "
            "Semua jadwal baru yang kamu buat wajib disimpan ke workspace ini "
            "(otomatis, tanpa perlu kamu isi sendiri)."
        )
    else:
        ws_info = (
            "Workspace aktif: belum dipilih (umum). "
            "Simpan jadwal tanpa workspace, kecuali pengguna menyebut jenis agendanya "
            "(misal kuliah, belajar, atau kerja)."
        )
    return f"""Kamu adalah TempoAgent, asisten AI pribadi untuk optimasi tugas dan jadwal pengguna (Personal Task & Schedule Optimizer).

Informasi Waktu:
Zona waktu pengguna: {timezone_label} (UTC{utc_offset}).
Waktu saat ini ({timezone_label}): {current_time}.
Gunakan acuan waktu saat ini tersebut untuk menghitung dan memahami kata waktu relatif (seperti "hari ini", "besok", "lusa", "malam ini", "minggu ini", "akhir pekan", dan sejenisnya) secara langsung tanpa perlu memanggil tool tambahan untuk mencari tahu tanggal sekarang.

{ws_info}

Aturan wajib:
1. Waktu relatif: Hitung tanggal pasti berdasarkan acuan waktu di atas. Contoh: jika hari ini 2026-11-15 (Sunday), maka "besok" adalah 2026-11-16 (Monday).
2. Zona waktu: Seluruh tanggal dan jam yang kamu terima maupun kamu berikan (date, start_time, end_time, new_date, new_start_time, new_end_time) adalah dalam zona waktu pengguna ({timezone_label}). Jangan mengonversinya ke zona waktu lain.
3. Cek bentrok saat buat jadwal baru: Sebelum memanggil create_new_schedule, kamu disarankan memanggil check_availability pada tanggal tersebut. Jika bentrok, tawarkan jam alternatif yang bebas.
4. Mengaktifkan / Menonaktifkan / Mengedit / Menghapus:
   - Jika pengguna meminta "aktifkan jadwal X", "nonaktifkan jadwal Y", "ubah jam jadwal Z", atau "hapus jadwal W", langsung panggil tool yang relevan (seperti manage_schedule_by_title atau update_existing_schedule).
   - Setelah operasi selesai, berikan konfirmasi ringkas dan ramah mengenai status jadwal tersebut.
5. Target belajar atau sub-tugas: Jika diminta menyusun target belajar atau sub-tugas, masukkan seluruh poinnya ke dalam kolom description (satu poin per baris, diawali "- "), lalu buat jadwalnya dengan judul yang ringkas.
6. Format data: date harus YYYY-MM-DD; start_time dan end_time harus HH:MM (24 jam). Pastikan end_time lebih besar daripada start_time.
7. Semua informasi jadwal wajib berasal dari hasil tool, jangan mengarang data.
8. Jawab selalu dengan ringkas, ramah, dan dalam Bahasa Indonesia.
"""


class TempoAgent:
    def __init__(self) -> None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GROQ_API_KEY belum diisi. "
                "Salin .env.example menjadi .env lalu isi nilainya."
            )
        self.client = Groq(api_key=api_key)
        # Mulai dari model utama; fallback diatur saat model tidak ditemukan
        self.model = MODEL
        self.model_candidates = list(dict.fromkeys([MODEL, *FALLBACK_MODELS]))
        self._tried_models: List[str] = []
        # Zona waktu default (akan disuntikkan ulang di setiap send_message)
        default_tz = tools.resolve_timezone(None)
        # Riwayat percakapan (stateful), dimulai dari system prompt
        self.messages: List[Dict[str, Any]] = [
            {
                "role": "system",
                "content": get_system_instruction(
                    _current_time_text(default_tz), default_tz
                ),
            }
        ]

    def _create_completion(self) -> Any:
        """Panggil Groq chat completion, dengan fallback antar model
        jika model yang dipakai tidak tersedia pada API key."""
        while True:
            try:
                return self.client.chat.completions.create(
                    model=self.model,
                    messages=self.messages,
                    tools=TOOLS_SCHEMA,
                    temperature=0.4,
                )
            except Exception as api_exc:
                if _is_model_not_found(api_exc):
                    self._tried_models.append(self.model)
                    remaining = [
                        m for m in self.model_candidates if m not in self._tried_models
                    ]
                    if remaining:
                        self.model = remaining[0]
                        continue
                raise

    def _run_tool(self, name: str, raw_args: str) -> str:
        """Jalankan satu tool call dengan try...except.

        Hasil database (atau pesan error) selalu dikembalikan ke model
        untuk dirangkum menjadi jawaban Bahasa Indonesia.
        """
        try:
            function: Callable[..., Any] | None = TOOL_FUNCTIONS.get(name)
            if function is None:
                raise ValueError(f"Tool tidak dikenal: {name}")
            args = json.loads(raw_args or "{}")
            if not isinstance(args, dict):
                raise ValueError("Argumen tool harus berupa object JSON.")
            args = _normalize_args(name, args)
            missing = [
                key for key in REQUIRED_ARGS.get(name, []) if args.get(key) in (None, "")
            ]
            if missing:
                raise ValueError(f"Argumen wajib belum diisi: {', '.join(missing)}")
            return str(function(**args))
        except Exception as exc:
            # Tangani error tool, kembalikan pesan error ke model agar dirangkum
            return f"Tool {name} gagal dijalankan: {str(exc)}"

    def send_message(
        self,
        message: str,
        timezone_name: str | None = None,
        timezone: str | None = None,
        workspace: str | None = None,
    ) -> str:
        """Mengirim pesan ke Groq dengan waktu dinamis sesuai zona waktu pengguna.

        `timezone_name` / `timezone` boleh "WIB" / "WITA" / "WIT" (atau nama IANA seperti
        Asia/Makassar); jika kosong, diambil dari tabel Profiles (fallback WIB).
        `workspace` boleh "Jadwal Kuliah" / "Rencana Belajar" / "Agenda Kerja";
        jika kosong, jadwal baru disimpan tanpa workspace (umum).

        Menjalankan loop eksekusi tool call: hasil tool (dari database)
        dikembalikan ke model sampai model menghasilkan jawaban akhir.
        """
        try:
            # 1. Tentukan zona waktu & workspace request ini (dipakai juga oleh semua tool)
            active_tz = timezone_name if timezone_name is not None else timezone
            tz_label = tools.resolve_timezone(active_tz)
            ws_label = tools.resolve_workspace(workspace)
            # 2. Suntikkan waktu saat ini (zona waktu pengguna) setiap agent dipanggil
            self.messages[0]["content"] = get_system_instruction(
                _current_time_text(tz_label), tz_label, ws_label
            )
            self.messages.append({"role": "user", "content": message})

            # 2. Loop eksekusi tool call
            for _ in range(MAX_TOOL_ROUNDS):
                recovered = None
                try:
                    response = self._create_completion()
                    choice = response.choices[0].message
                except Exception as api_exc:
                    # Model salah menulis argumen tool -> Groq menolak request,
                    # tapi generasinya bisa dipakai ulang dari failed_generation
                    recovered = _recover_tool_call(api_exc)
                    if recovered is None:
                        raise

                if recovered is not None:
                    # Bangun tool call dari hasil recovery
                    name, raw_args, tool_call_id = recovered
                    tool_calls = [
                        {
                            "id": tool_call_id,
                            "type": "function",
                            "function": {"name": name, "arguments": raw_args},
                        }
                    ]
                    result = self._run_tool(name, raw_args)
                    self.messages.append(
                        {"role": "assistant", "content": None, "tool_calls": tool_calls}
                    )
                    self.messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tool_call_id,
                            "name": name,
                            "content": result,
                        }
                    )
                    continue

                if not choice.tool_calls:
                    text = (choice.content or "").strip()
                    if not text:
                        return "Maaf, saya belum bisa memproses pesan itu. Coba tulis ulang."
                    self.messages.append({"role": "assistant", "content": text})
                    return text

                # Simpan pesan assistant yang berisi tool_calls
                self.messages.append(choice.model_dump(exclude_none=True))

                for tool_call in choice.tool_calls:
                    name = tool_call.function.name
                    raw_args = tool_call.function.arguments or "{}"
                    result = self._run_tool(name, raw_args)
                    self.messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "name": name,
                            "content": result,
                        }
                    )

            return (
                "Maaf, permintaan ini terlalu banyak memanggil tool. "
                "Coba sederhanakan permintaanmu ya."
            )
        except Exception as exc:
            # Tangani error dari Groq API atau Supabase dengan pesan yang jelas
            return f"Terjadi kesalahan saat memproses permintaan: {str(exc)}"
