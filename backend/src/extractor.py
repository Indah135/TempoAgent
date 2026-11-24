import base64
import csv
import io
import json
import mimetypes
import os
import re
from pathlib import Path
from typing import Any, Dict, List

from dotenv import load_dotenv
from groq import Groq
import openpyxl
import pypdf

# Muat environment variable dari .env
load_dotenv(Path(__file__).resolve().parents[1] / ".env")
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
VISION_FALLBACKS = [
    "llama-3.2-11b-vision-preview",
    "llama-3.2-90b-vision-preview",
]

TEXT_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
TEXT_FALLBACKS = [
    "llama-3.3-70b-versatile",
    "openai/gpt-oss-120b",
]

EXTRACTION_SYSTEM_PROMPT = """Kamu adalah asisten ahli ekstraksi data jadwal dan agenda kuliah/kerja.
Tugasmu adalah menganalisis teks atau gambar jadwal yang diberikan dan mengekstrak semua jadwal/mata kuliah/kegiatan ke dalam format JSON yang valid.

Aturan Wajib:
1. Output WAJIB berupa JSON Array murni yang berisi objek dengan format persis seperti ini:
[
  {
    "title": "Nama Mata Kuliah / Kegiatan",
    "description": "Ruang kelas, dosen, kode MK, atau catatan tambahan jika ada",
    "day": "Senin",
    "start_time": "08:00",
    "end_time": "10:00"
  }
]
2. "day" harus menggunakan salah satu nama hari Bahasa Indonesia: "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu".
3. "start_time" dan "end_time" harus format 24 jam "HH:MM" (contoh: "07:30", "13:00"). Jika jam selesai tidak tercantum, buat durasi default 90 menit setelah jam mulai.
4. "title" harus ringkas dan jelas. Masukkan informasi ruangan/gedung/dosen ke dalam "description".
5. Jangan tambahkan penjelasan pembuka atau penutup apapun di luar JSON array. Output harus langsung dapat di-parse oleh json.loads().
"""


def get_groq_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY belum dikonfigurasi di file .env")
    return Groq(api_key=api_key)


def _clean_json_response(raw_text: str) -> List[Dict[str, Any]]:
    """Membersihkan output teks dari LLM dan mengonversinya menjadi Python list of dict."""
    text = raw_text.strip()
    # Hilangkan blok kode markdown jika ada
    if "```" in text:
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"```$", "", text, flags=re.MULTILINE).strip()

    # Cari kurung siku JSON array terluar
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1 and end > start:
        text = text[start : end + 1]

    try:
        data = json.loads(text)
        if isinstance(data, list):
            cleaned = []
            for item in data:
                if isinstance(item, dict) and item.get("title") and item.get("day"):
                    cleaned.append(
                        {
                            "title": str(item.get("title", "")).strip(),
                            "description": str(item.get("description", "")).strip(),
                            "day": str(item.get("day", "Senin")).strip().capitalize(),
                            "start_time": str(item.get("start_time", "08:00")).strip()[:5],
                            "end_time": str(item.get("end_time", "10:00")).strip()[:5],
                        }
                    )
            return cleaned
        return []
    except Exception as exc:
        raise ValueError(f"Gagal mem-parse JSON hasil ekstraksi model: {exc}\nOutput mentah: {raw_text[:200]}")


def _call_groq_text(prompt: str) -> str:
    """Mengirim prompt teks ke model teks (llama-3.3-70b-versatile)."""
    client = get_groq_client()
    models_to_try = [TEXT_MODEL] + [m for m in TEXT_FALLBACKS if m != TEXT_MODEL]
    last_err = None

    for model_name in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
            )
            return response.choices[0].message.content or ""
        except Exception as exc:
            last_err = exc
            continue

    raise RuntimeError(f"Gagal memanggil model teks Groq: {last_err}")


def _call_groq_vision(image_base64: str, mime_type: str) -> str:
    """Mengirim gambar base64 ke model vision Groq (meta-llama/llama-4-scout-17b-16e-instruct)."""
    client = get_groq_client()
    models_to_try = [VISION_MODEL] + VISION_FALLBACKS
    last_err = None

    image_data_url = f"data:{mime_type};base64,{image_base64}"
    prompt_text = (
        "Ekstrak seluruh jadwal mata kuliah atau agenda dari foto/gambar ini "
        "menjadi JSON array sesuai instruksi sistem."
    )

    for model_name in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt_text},
                            {
                                "type": "image_url",
                                "image_url": {"url": image_data_url},
                            },
                        ],
                    },
                ],
                temperature=0.2,
            )
            return response.choices[0].message.content or ""
        except Exception as exc:
            last_err = exc
            continue

    raise RuntimeError(f"Gagal memanggil model vision Groq: {last_err}")


def _sniff_image_mime(data: bytes) -> str | None:
    """Deteksi tipe gambar dari magic bytes (tanpa peduli nama/ekstensi file)."""
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


IMAGE_EXTS = {".jpg", ".jpeg", ".jpe", ".jfif", ".png", ".webp"}


def _image_mime_from_ext(ext: str) -> str | None:
    if ext in {".jpg", ".jpeg", ".jpe", ".jfif"}:
        return "image/jpeg"
    if ext == ".png":
        return "image/png"
    if ext == ".webp":
        return "image/webp"
    return None


def extract_from_image(
    file_bytes: bytes, filename: str, mime_type: str | None = None
) -> List[Dict[str, Any]]:
    """Ekstraksi jadwal dari file gambar (JPG/JPEG/JFIF, PNG, WEBP)."""
    if not mime_type or not mime_type.startswith("image/"):
        ext = Path(filename).suffix.lower()
        guessed, _ = mimetypes.guess_type(filename)
        mime_type = (
            _sniff_image_mime(file_bytes)
            or guessed
            or _image_mime_from_ext(ext)
            or "image/jpeg"
        )

    image_b64 = base64.b64encode(file_bytes).decode("utf-8")
    raw_output = _call_groq_vision(image_b64, mime_type)
    return _clean_json_response(raw_output)


def extract_from_pdf(file_bytes: bytes) -> List[Dict[str, Any]]:
    """Ekstraksi teks dari PDF menggunakan pypdf lalu proses dengan model teks."""
    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    extracted_text = []

    for i, page in enumerate(reader.pages):
        page_text = page.extract_text()
        if page_text:
            extracted_text.append(f"--- Halaman {i + 1} ---\n{page_text}")

    full_text = "\n\n".join(extracted_text).strip()
    if not full_text:
        raise ValueError("Dokumen PDF tidak memiliki teks yang terbaca (mungkin berupa hasil scan murni tanpa OCR).")

    prompt = (
        f"Berikut adalah isi dokumen PDF jadwal:\n\n{full_text}\n\n"
        "Ekstrak semua jadwal di atas menjadi JSON array sesuai aturan sistem."
    )
    raw_output = _call_groq_text(prompt)
    return _clean_json_response(raw_output)


def extract_from_excel(file_bytes: bytes) -> List[Dict[str, Any]]:
    """Ekstraksi tabel dari file Excel (.xlsx) menggunakan openpyxl lalu proses dengan model teks."""
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
    all_lines = []

    for sheet_name in wb.sheetnames:
        sheet = wb[sheet_name]
        all_lines.append(f"=== Sheet: {sheet_name} ===")
        for row in sheet.iter_rows(values_only=True):
            row_vals = [str(v) if v is not None else "" for v in row]
            if any(row_vals):
                all_lines.append(" | ".join(row_vals))

    full_text = "\n".join(all_lines).strip()
    if not full_text:
        raise ValueError("File Excel tidak berisi data yang dapat dibaca.")

    prompt = (
        f"Berikut adalah data spreadsheet Excel jadwal:\n\n{full_text}\n\n"
        "Ekstrak semua jadwal di atas menjadi JSON array sesuai aturan sistem."
    )
    raw_output = _call_groq_text(prompt)
    return _clean_json_response(raw_output)


def extract_from_csv(file_bytes: bytes) -> List[Dict[str, Any]]:
    """Ekstraksi teks dari file CSV lalu proses dengan model teks."""
    try:
        decoded = file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        decoded = file_bytes.decode("latin-1")

    reader = csv.reader(io.StringIO(decoded))
    lines = [" | ".join(row) for row in reader if any(row)]
    full_text = "\n".join(lines).strip()

    if not full_text:
        raise ValueError("File CSV kosong.")

    prompt = (
        f"Berikut adalah data CSV jadwal:\n\n{full_text}\n\n"
        "Ekstrak semua jadwal di atas menjadi JSON array sesuai aturan sistem."
    )
    raw_output = _call_groq_text(prompt)
    return _clean_json_response(raw_output)


def extract_schedule_from_file(
    file_bytes: bytes, filename: str, content_type: str | None = None
) -> List[Dict[str, Any]]:
    """Router utama untuk mengekstrak jadwal berdasarkan jenis file.

    Mendukung foto JPEG (.jpg/.jpeg/.jpe/.jfif), PNG, WEBP, PDF, Excel, dan CSV.
    Jika ekstensi tidak dikenal, tipe file dideteksi dari magic bytes
    dan/atau content-type browser agar foto JPEG tetap terbaca.
    """
    ext = Path(filename).suffix.lower()
    sniffed = _sniff_image_mime(file_bytes)

    # Gambar: ekstensi dikenal, magic bytes cocok, atau content-type browser image/*
    if (
        ext in IMAGE_EXTS
        or sniffed is not None
        or (content_type or "").startswith("image/")
    ):
        mime = (
            sniffed
            or (content_type if (content_type or "").startswith("image/") else None)
            or _image_mime_from_ext(ext)
            or "image/jpeg"
        )
        return extract_from_image(file_bytes, filename, mime_type=mime)

    if ext == ".pdf":
        return extract_from_pdf(file_bytes)
    if ext in {".xlsx", ".xls"}:
        return extract_from_excel(file_bytes)
    if ext == ".csv":
        return extract_from_csv(file_bytes)

    raise ValueError(
        f"Format file '{ext or filename}' tidak didukung. "
        "Gunakan foto (JPG/JPEG, PNG, WEBP), PDF (.pdf), Excel (.xlsx), atau CSV (.csv)."
    )
