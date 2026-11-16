// Zona waktu Indonesia yang didukung TempoAgent
export const TIMEZONE_OPTIONS = [
  {
    value: 'WIB',
    label: 'WIB — Waktu Indonesia Barat (UTC+07:00)',
    iana: 'Asia/Jakarta',
  },
  {
    value: 'WITA',
    label: 'WITA — Waktu Indonesia Tengah (UTC+08:00)',
    iana: 'Asia/Makassar',
  },
  {
    value: 'WIT',
    label: 'WIT — Waktu Indonesia Timur (UTC+09:00)',
    iana: 'Asia/Jayapura',
  },
];

const IANA_TO_TZ = {
  'Asia/Jakarta': 'WIB',
  'Asia/Pontianak': 'WIB',
  'Asia/Makassar': 'WITA',
  'Asia/Jayapura': 'WIT',
  'Asia/Merauke': 'WIT',
};

export function getIanaZone(timezone) {
  const match = TIMEZONE_OPTIONS.find((opt) => opt.value === timezone);
  return match ? match.iana : 'Asia/Jakarta';
}

// Deteksi zona waktu dari browser pengguna (fallback: WIB)
export function detectTimezone() {
  try {
    const iana = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (iana && IANA_TO_TZ[iana]) return IANA_TO_TZ[iana];
    // Fallback berdasarkan offset UTC perangkat
    const offsetHours = -new Date().getTimezoneOffset() / 60;
    if (offsetHours >= 9) return 'WIT';
    if (offsetHours >= 8) return 'WITA';
    return 'WIB';
  } catch (_) {
    return 'WIB';
  }
}
