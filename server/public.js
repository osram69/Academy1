import { LANGS, langCol } from "./columns.js";

const ENT = { "&reg;": "®", "&amp;": "&", "&nbsp;": " ", "&quot;": '"', "&#039;": "'", "&apos;": "'", "&lt;": "<", "&gt;": ">", "&trade;": "™" };
const clean = (html) =>
  String(html || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z#0-9]+;/gi, (e) => ENT[e.toLowerCase()] ?? e)
    .replace(/\s+/g, " ")
    .trim();

const zero = (v) => (!v || String(v).startsWith("0000") ? null : String(v).replace(" ", "T"));
const perLang = (base, r) => Object.fromEntries(LANGS.map((l) => [l, r[langCol(base, l)] ?? ""]));

/** Stati visibili sul sito pubblico. 2 = "Non visualizzato" resta nascosto; 5 = Completato -> card "conclusa". */
export const PUBLIC_STATES = [0, 1, 3, 4, 5];

/** Riga DB -> oggetto pubblico. Non espone codici sconto né l'HTML lungo. */
export function toPublic(r) {
  const eb = r.early_bird_price, std = r.standard_price;
  let pct = Number(r.early_bird_percentuale) / 100;
  if (!(pct > 0) && eb && std) pct = 1 - eb / std;
  return {
    id: r.id_corso,
    title: clean(r.Titolo),
    weekend: /weekend/i.test(r.Titolo || ""),
    residential: /residential/i.test(r.Titolo || ""),
    level: r.Livello || "Foundation",
    stato: r.stato,
    featured: !!r.in_evidenza,
    open: !!r.iscrizioni_aperte,
    price: std ?? null,
    earlyBirdPrice: eb ?? null,
    earlyBirdPct: pct > 0 ? pct : 0,
    earlyBirdStart: zero(r.early_bird_start),
    earlyBirdEnd: zero(r.early_bird_end),
    start: r.data_inizio || null,
    end: r.data_fine || r.data_inizio || null,
    dateText: perLang("Data", r),
    location: perLang("Luogo", r),
    language: perLang("Lingua", r),
    notes: perLang("Note", r),
    subtitle: perLang("home_subtitle", r),
    readMoreUrl: Object.fromEntries(LANGS.map((l) => [l, r[`link_readmore_${l}`] || ""])),
    bookingUrl: Object.fromEntries(LANGS.map((l) => [l, r[`link_booking_${l}`] || ""])),
    seatsTotal: r.posti_totali ?? null,
    seatsLeft: r.posti_disponibili ?? null,
  };
}
