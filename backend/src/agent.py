import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, List

from dotenv import load_dotenv
# pyrefly: ignore[missing-import]
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


def _is_model_not_found(exc: Exception) -> bool:
    """True jika error karena model tidak tersedia pada API key ini."""
    text = str(exc).lower()
    return "model_not_found" in text or "does not exist or you do not have access" in text


# Alias argumen yang sering salah ditulis model, dipetakan ke nama resmi
ARG_ALIASES: Dict[str, Dict[str, str]] = {
    "check_availability": {
        "schedule_date": "date",
        "tanggal": "date",
        "day": "date",
    },
    "create_new_schedule": {
        "schedule_date": "date",
        "tanggal": "date",
        "start": "start_time",
        "end": "end_time",
        "jam_mulai": "start_time",
        "jam_selesai": "end_time",
    },
}

# Argumen wajib per tool (dipakai untuk validasi sebelum eksekusi)
REQUIRED_ARGS: Dict[str, List[str]] = {
    "check_availability": ["date"],
    "create_new_schedule": ["title", "description", "date", "start_time", "end_time"],
}


def _normalize_args(name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    """Petakan alias argumen ke nama parameter yang benar."""
    aliases = ARG_ALIASES.get(name, {})
    normalized: Dict[str, Any] = {}
    for key, value in args.items():
        normalized[aliases.get(key, key)] = value
    return normalized


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
            import ast

            data = ast.literal_eval(raw)
        except Exception:
            return None
    if not isinstance(data, dict):
        return None
    failed = data.get("failed_generation") or (
        data.get("error", {}).get("failed_generation")
        if isinstance(data.get("error"), dict)
        else None
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

# Fungsi tool yang tersedia untuk function calling
TOOL_FUNCTIONS: Dict[str, Callable[..., Any]] = {
    "check_availability": tools.check_availability,
    "create_new_schedule": tools.create_new_schedule,
}

# Skema tool bergaya OpenAI function calling (dipakai Groq)
TOOLS_SCHEMA: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "check_availability",
            "description": (
                "Memeriksa seluruh jadwal yang sudah tersimpan pada tanggal "
                "tertentu. WAJIB dipanggil sebelum create_new_schedule."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {
                        "type": "string",
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
                },
                "required": ["title", "description", "date", "start_time", "end_time"],
            },
        },
    },
]


def get_system_instruction(current_time: str) -> str:
    """Membuat system instruction dengan waktu dinamis yang disuntikkan."""
    return f"""Kamu adalah TempoAgent, asisten AI pribadi untuk optimasi tugas dan jadwal pengguna (Personal Task & Schedule Optimizer).

Informasi Waktu:
Waktu saat ini adalah: {current_time}.
Gunakan acuan waktu saat ini tersebut untuk menghitung dan memahami kata waktu relatif (seperti "hari ini", "besok", "lusa", "malam ini", "minggu ini", "akhir pekan", dan sejenisnya) secara langsung tanpa perlu memanggil tool tambahan untuk mencari tahu tanggal sekarang.

Aturan wajib:
1. Waktu relatif: Hitung tanggal pasti berdasarkan acuan waktu di atas. Contoh: jika hari ini 2026-11-15 (Sunday), maka "besok" adalah 2026-11-16 (Monday).
2. Cek bentrok: Sebelum memanggil create_new_schedule, kamu WAJIB memanggil check_availability pada tanggal tersebut. Jika jadwal baru bentrok dengan jadwal yang sudah ada, jangan buat jadwalnya; beri tahu pengguna jadwal yang bentrok dan tawarkan jam alternatif yang bebas.
3. Target belajar atau sub-tugas: Jika diminta menyusun target belajar atau sub-tugas, masukkan seluruh poinnya ke dalam kolom description (satu poin per baris, diawali "- "), lalu buat jadwalnya dengan judul yang ringkas.
4. Format data: date harus YYYY-MM-DD; start_time dan end_time harus HH:MM (24 jam). Pastikan end_time lebih besar daripada start_time.
5. Setelah jadwal berhasil dibuat, konfirmasikan judul, tanggal, dan jamnya secara ringkas.
6. Penghapusan jadwal dilakukan lewat tombol Hapus pada panel jadwal di sebelah kanan aplikasi; jika diminta menghapus jadwal, arahkan pengguna ke tombol tersebut.
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
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S (%A)")
        # Riwayat percakapan (stateful), dimulai dari system prompt
        self.messages: List[Dict[str, Any]] = [
            {"role": "system", "content": get_system_instruction(current_time)}
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
                        m
                        for m in self.model_candidates
                        if m not in self._tried_models
                    ]
                    if remaining:
                        self.model = remaining[0]
                        continue
                raise

    def send_message(self, message: str) -> str:
        """Mengirim pesan ke Groq dengan waktu dinamis yang di-inject langsung.

        Menjalankan loop eksekusi tool call: hasil tool (dari database)
        dikembalikan ke model sampai model menghasilkan jawaban akhir.
        """
        try:
            # 1. Suntikkan waktu saat ini secara dinamis setiap kali agent dipanggil
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S (%A)")
            self.messages[0]["content"] = get_system_instruction(current_time)
            self.messages.append({"role": "user", "content": message})

            # 2. Loop eksekusi tool call
            for _ in range(MAX_TOOL_ROUNDS):
                recovered = None
                choice = None
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
                        {
                            "role": "assistant",
                            "content": None,
                            "tool_calls": tool_calls,
                        }
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
                    self.messages.append(
                        {"role": "assistant", "content": text}
                    )
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
            # 4. Tangani error dari Groq API atau Supabase dengan pesan yang jelas
            return f"Terjadi kesalahan saat memproses permintaan: {str(exc)}"

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
            # 3. Tangani error tool, kembalikan pesan error ke model
            return f"Tool {name} gagal dijalankan: {str(exc)}"
