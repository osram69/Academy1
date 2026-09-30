// Ricava data_inizio / data_fine da un testo tipo "25 - 27 Febbraio 2026" o "7, 8 e 14 Febbraio 2026".
const MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

export function parseItalianRange(text, fallbackYear) {
  if (!text) return null;
  const t = String(text).toLowerCase();
  const m = MONTHS.findIndex((n) => t.includes(n));
  if (m < 0) return null;
  const before = t.slice(0, t.indexOf(MONTHS[m]));
  const days = (before.match(/\d{1,2}/g) || []).map(Number).filter((n) => n >= 1 && n <= 31);
  if (!days.length) return null;
  const y = (t.match(/\b(20\d{2})\b/) || [])[1] || fallbackYear;
  const iso = (d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { start: iso(Math.min(...days)), end: iso(Math.max(...days)) };
}
