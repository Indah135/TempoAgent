import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

from . import tools

load_dotenv()

MODEL = "gemini-2.5-flash"

SYSTEM_INSTRUCTION = """
Kamu adalah TempoAgent, asisten AI pribadi untuk optimasi tugas dan jadwal pengguna
(Personal Task & Schedule Optimizer).

Aturan wajib:
1. Waktu relatif: setiap kali pengguna menyebut waktu relatif (hari ini, besok, lusa,
   malam ini, minggu ini, akhir pekan, dan sejenisnya), panggil tool get_current_datetime
   lebih dulu untuk menentukan tanggal dan jam pasti sebelum mengecek atau membuat jadwal.
2. Cek bentrok: sebelum memanggil create_new_schedule, kamu WAJIB memanggil
   check_availability pada tanggal tersebut. Jika jadwal baru bentrok dengan jadwal yang
   sudah ada, jangan buat jadwalnya; beri tahu pengguna jadwal yang bentrok dan tawarkan
   jam alternatif yang bebas.
3. Target belajar atau sub-tugas: jika diminta menyusun target belajar atau sub-tugas,
   masukkan seluruh poinnya ke dalam kolom description (satu poin per baris, diawali "- "),
   lalu buat jadwalnya dengan judul yang ringkas.
4. Format data: date harus YYYY-MM-DD; start_time dan end_time harus HH:MM (24 jam).
   Pastikan end_time lebih besar daripada start_time.
5. Setelah jadwal berhasil dibuat, konfirmasikan judul, tanggal, dan jamnya secara ringkas.
6. Penghapusan jadwal dilakukan lewat tombol Hapus pada panel jadwal di sebelah kanan
   aplikasi; jika diminta menghapus jadwal, arahkan pengguna ke tombol tersebut.
7. Semua informasi jadwal wajib berasal dari hasil tool, jangan mengarang data.
8. Jawab selalu dengan ringkas, ramah, dan dalam Bahasa Indonesia.
"""


class TempoAgent:
    def __init__(self) -> None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY belum diisi. "
                "Salin .env.example menjadi .env lalu isi nilainya."
            )
        self.client = genai.Client(api_key=api_key)
        self.chat = self.client.chats.create(
            model=MODEL,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                tools=[
                    tools.get_current_datetime,
                    tools.check_availability,
                    tools.create_new_schedule,
                ],
                temperature=0.4,
            ),
        )

    def send_message(self, message: str) -> str:
        response = self.chat.send_message(message)
        text = response.text
        if not text:
            return "Maaf, saya belum bisa memproses pesan itu. Coba tulis ulang."
        return text
