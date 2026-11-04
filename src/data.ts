/* ------------------------------------------------------------------ */
/*  Cube Academy — layer dati del prototipo.                           */
/*  Date generate dinamicamente: la demo mostra sempre stati reali     */
/*  (early bird attivo, countdown, edizioni imminenti).                */
/* ------------------------------------------------------------------ */

import { courseSlug, leadingId } from "./lib/slug";
import { supabase, supabaseConfigured } from "./lib/supabase";

import { lang, locale, t } from "./i18n";
import { isaqbLinks } from "./links";
import * as COPY from "./content/course-copy";
const DAY = 86400000;

export type CourseFormat = "online" | "aula" | "prestige";
/** Come sono distribuite le 24 ore del corso. */
export type Modalita = "intensivo" | "weekend" | "serale" | "mezze_giornate";

export const MODALITA: Record<Modalita, { label: string; short: string; effort: string; schedule: string; forWho: string }> = {
  intensivo: {
    label: t("Intensivo · 3 giorni"),
    short: t("3 giorni"),
    effort: t("3 giornate · 24 ore"),
    schedule: t("3 giornate consecutive, 9:00–17:30"),
    forWho: t("Chi può liberarsi per tre giorni e vuole finire subito."),
  },
  weekend: {
    label: t("Weekend · 4 giornate"),
    short: t("Weekend"),
    effort: t("4 giornate · 24 ore"),
    schedule: t("Sabato e domenica per due weekend, 9:00–16:00"),
    forWho: t("Lavoratori dipendenti: nessun giorno di ferie e nessun permesso."),
  },
  serale: {
    label: t("Serale · 8 serate"),
    short: t("Serale"),
    effort: t("8 serate · 24 ore"),
    schedule: t("Due sere a settimana per 4 settimane, 18:00–21:00"),
    forWho: t("Chi lavora di giorno: si segue dopo l'orario d'ufficio, senza ferie."),
  },
  mezze_giornate: {
    label: t("Mezze giornate · 6 mattine"),
    short: t("Mezze giornate"),
    effort: t("6 mezze giornate · 24 ore"),
    schedule: t("Due mattine a settimana per 3 settimane, 9:00–13:00"),
    forWho: t("Chi ottiene dall'azienda permessi di formazione di mezza giornata."),
  },
};
export type CourseLevel = "Foundation" | "Advanced" | "Workshop";
export type CourseStatus = "available" | "few" | "waitlist" | "concluded";
export type Lang = "IT" | "EN";

export interface CourseModule {
  title: string;
  hours: number;
  outcome: string;
  topics: string[];
}

export interface Course {
  id: number;
  slug: string;
  short: string;
  title: string;
  level: CourseLevel;
  format: CourseFormat;
  status: CourseStatus;
  concluded: boolean;
  featured: boolean; // "In evidenza" dal pannello: l'edizione promossa nel pulsante del menu e nella card dell'introduzione
  start: Date;
  end: Date;
  effort: string;
  modalita: Modalita;
  orario: string;
  privateDiscount: boolean; // sconto privati attivo per questa edizione
  location: string;
  language: Lang;
  seatsTotal: number | null; // null = non gestito in DB
  seatsLeft: number | null;
  price: number; // listino, IVA esclusa
  earlyBirdPct: number;
  earlyBirdPrice: number | null;
  earlyBirdFrom: Date;
  earlyBirdUntil: Date;
  examIncluded: boolean;
  image: string;
  bookingUrl: string;
  tagline: string;
  description: string;
  objectives: string[];
  audience: string[];
  modules: CourseModule[];
  prerequisites: string[];
  includes: string[];
}

/* ----------------------------- formati ---------------------------- */

export const FORMAT_META: Record<CourseFormat, { label: string; blurb: string }> = {
  online: { label: t("Live Online"), blurb: t("Aula virtuale interattiva, stessi docenti, zero trasferte.") },
  aula: { label: t("In Aula"), blurb: t("Corso in presenza a Roma.") },
  prestige: { label: t("Prestige Residenziale"), blurb: t("Corso residenziale di 4 giorni con albergo e mezza pensione. Presto informazioni.") },
};

export const STATUS_META: Record<CourseStatus, { label: string }> = {
  available: { label: t("Posti disponibili") },
  few: { label: t("Ultimi posti") },
  waitlist: { label: t("Lista d'attesa") },
  concluded: { label: t("Edizione conclusa") },
};

/* --------------------------- formattatori ------------------------- */

export const eur = (n: number) =>
  n.toLocaleString(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export const eur2 = (n: number) =>
  n.toLocaleString(locale, { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

export const fmtDate = (dt: Date) => dt.toLocaleDateString(locale, { day: "numeric", month: "short" });

export const fmtRange = (a: Date, b: Date) => {
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  const start = sameMonth ? `${a.getDate()}` : fmtDate(a);
  return `${start}–${fmtDate(b)} ${b.getFullYear()}`;
};

export const fmtFull = (dt: Date) =>
  dt.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "long", year: "numeric" });

/* ------------------------------ pricing --------------------------- */

export interface LivePrice {
  unit: number;
  original: number | null;
  active: boolean;
  until: Date;
}

export const getLivePrice = (c: Course): LivePrice => {
  const now = new Date();
  const active = now >= c.earlyBirdFrom && now < c.earlyBirdUntil && c.earlyBirdPct > 0 && c.status !== "waitlist" && !c.concluded;
  return {
    unit: active ? (c.earlyBirdPrice ?? Math.round(c.price * (1 - c.earlyBirdPct))) : c.price,
    original: active ? c.price : null,
    active,
    until: c.earlyBirdUntil,
  };
};

export const VAT = 0.22;

/* -------------------------- metodi pagamento ---------------------- */

export const PAYMENT_METHODS = [
  {
    id: "stripe",
    label: t("Carta di credito / debito"),
    detail: t("Visa, Mastercard, Amex. Checkout sicuro Stripe con 3-D Secure."),
    timing: t("Conferma immediata"),
    speed: "fast" as const,
    cta: t("Paga ora con carta"),
  },
  {
    id: "paypal",
    label: t("PayPal"),
    detail: t("Usa il saldo o la carta collegata al tuo conto PayPal."),
    timing: t("Conferma immediata"),
    speed: "fast" as const,
    cta: t("Vai al checkout PayPal"),
  },
  {
    id: "sumup",
    label: t("Carta con SumUp"),
    detail: t("Pagamento con carta sul checkout sicuro SumUp."),
    timing: t("Conferma immediata"),
    speed: "fast" as const,
    cta: t("Vai al checkout SumUp"),
  },
  {
    id: "bonifico",
    label: t("Bonifico bancario"),
    detail: t("Ideale per aziende con procedura d'acquisto. L'iscrizione è confermata alla ricezione del pagamento."),
    timing: t("Conferma in 3–5 giorni"),
    speed: "slow" as const,
    cta: t("Conferma e ricevi le coordinate"),
  },
];
export type MethodId = (typeof PAYMENT_METHODS)[number]["id"];

/* ------------------------------ docente --------------------------- */

export const TRAINER = {
  name: t("Docente accreditato iSAQB®"),
  role: t("iSAQB® Accredited Trainer"),
  img: "/img/isaqb-accredited-trainer.jpg",
  bio: t("I corsi CPSA-F sono tenuti da un docente accreditato iSAQB®, come richiesto dal programma di accreditamento: la Cube Engineering organizza e conduce i corsi solo con trainer accreditati e materiale didattico accreditato iSAQB®. Ogni edizione ha un unico docente, per questo i partecipanti sono al massimo 12."),
};

/* --------------------------- contenuti base ----------------------- */

// I testi stanno in src/content/course-copy.ts (condivisi con l'HTML per i crawler); qui si traducono nella lingua del sito.
const F_OBJECTIVES = COPY.OBJECTIVES.map((s) => t(s));
const F_AUDIENCE = COPY.AUDIENCE.map((s) => t(s));
const F_PREREQUISITES = COPY.PREREQUISITES.map((s) => t(s));
const F_MODULES: CourseModule[] = COPY.MODULES.map((m) => ({ title: t(m.title), hours: 0, outcome: t(m.outcome), topics: m.topics.map((s) => t(s)) }));
const F_INCLUDES = COPY.INCLUDES.map((s) => t(s));

/* ------------------------------ corsi ----------------------------- */
/* I corsi arrivano dal database (vista Supabase corsi_public), gestito dal pannello #/admin. */

export interface ApiCourse {
  id: number;
  title: string;
  weekend: boolean;
  modalita: Modalita;
  orario: string;
  privateDiscount: boolean;
  residential: boolean;
  level: string;
  stato: number;
  open: boolean;
  price: number | null;
  earlyBirdPrice: number | null;
  earlyBirdPct: number;
  earlyBirdStart: string | null;
  earlyBirdEnd: string | null;
  start: string | null;
  end: string | null;
  location: Record<string, string>;
  language: Record<string, string>;
  bookingUrl: Record<string, string>;
  seatsTotal: number | null;
  seatsLeft: number | null;
  featured?: boolean;
}

const FORMAT_COPY: Record<CourseFormat, { image: string; tagline: string; description: string }> = {
  online: {
    image: "https://images.pexels.com/photos/18999565/pexels-photo-18999565.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: t("Aula virtuale live su Zoom con docente accreditato e simulazione d'esame nell'ultima giornata."),
    description:
      t(COPY.COURSE_INTRO),
  },
  aula: {
    image: "https://images.pexels.com/photos/3184328/pexels-photo-3184328.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: t("In presenza a Roma, con docente accreditato iSAQB® e gruppi fino a 12 partecipanti."),
    description:
      t(COPY.COURSE_INTRO),
  },
  prestige: {
    image: "https://images.pexels.com/photos/38120266/pexels-photo-38120266.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: t("Corso e soggiorno in una location d'eccezione: formazione intensiva senza distrazioni."),
    description:
      t("Il percorso Foundation in formato residenziale di 4 giorni, con albergo e mezza pensione nelle più belle città italiane. Presto maggiori informazioni."),
  },
};

const toDate = (iso: string | null, endOfDay = false) =>
  new Date(`${(iso || "").slice(0, 10)}T${endOfDay ? "18:00" : "09:00"}:00`);

function toCourse(a: ApiCourse): Course {
  const online = /online/i.test(a.location.IT || "");
  const format: CourseFormat = a.residential ? "prestige" : online ? "online" : "aula";
  const start = toDate(a.start);
  const end = toDate(a.end || a.start, true);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY) + 1);
  const concluded = a.stato === 5;
  const seatsLeft = a.seatsLeft;
  const status: CourseStatus = concluded
    ? "concluded"
    : !a.open
      ? "waitlist"
      : seatsLeft != null && seatsLeft <= 5
        ? "few"
        : "available";
  const price = a.price ?? 0;
  const copy = FORMAT_COPY[format];
  // se ci sono entrambi i prezzi, lo sconto mostrato è quello reale tra i due
  const pct = a.earlyBirdPrice && price ? 1 - a.earlyBirdPrice / price : a.earlyBirdPct;
  const loc = a.location[lang.toUpperCase()] || a.location.IT || "";
  const mod = MODALITA[a.modalita];
  const short = `CPSA-F ${a.modalita !== "intensivo" ? mod.short : online ? t("Online") : loc} · ${fmtDate(start)}`;
  return {
    id: a.id,
    slug: courseSlug({ id: a.id, level: a.level, online, residential: a.residential, locationIt: a.location.IT || "", start: a.start }),
    short,
    title: a.title,
    level: (a.level as CourseLevel) || "Foundation",
    format,
    status,
    concluded,
    featured: a.featured === true,
    start,
    end,
    effort: a.modalita !== "intensivo" ? mod.effort : days === 3 ? mod.effort : t("{d} giornate · {h} ore", { d: days, h: days * 8 }),
    modalita: a.modalita,
    orario: a.orario || mod.schedule,
    privateDiscount: a.privateDiscount,
    location: online ? t("Aula virtuale live") : loc,
    language: /^ital/i.test(a.language.IT || "") ? "IT" : "EN",
    seatsTotal: a.seatsTotal,
    seatsLeft,
    price,
    earlyBirdPct: pct > 0 ? pct : 0,
    earlyBirdPrice: a.earlyBirdPrice,
    earlyBirdFrom: a.earlyBirdStart ? new Date(a.earlyBirdStart) : new Date(0),
    earlyBirdUntil: a.earlyBirdEnd ? new Date(a.earlyBirdEnd) : new Date(0),
    examIncluded: false,
    image: copy.image,
    tagline: copy.tagline,
    description: copy.description,
    bookingUrl: a.bookingUrl.IT || "",
    objectives: F_OBJECTIVES,
    audience: F_AUDIENCE,
    modules: F_MODULES,
    prerequisites: F_PREREQUISITES,
    includes: F_INCLUDES,
  };
}

/** Lista corsi, popolata da loadCourses() prima del render (vedi main.tsx). */
export let COURSES: Course[] = [];

interface PublicRow {
  id_corso: number;
  titolo: string;
  livello: string;
  stato: number;
  iscrizioni_aperte: boolean;
  standard_price: number | null;
  early_bird_price: number | null;
  early_bird_start: string | null;
  early_bird_end: string | null;
  early_bird_percentuale: number | string;
  data_inizio: string | null;
  data_fine: string | null;
  posti_totali: number | null;
  posti_disponibili: number | null;
  luogo_it: string | null;
  luogo_en?: string | null;
  luogo_fr?: string | null;
  luogo_de?: string | null;
  modalita: string | null;
  orario_it: string | null;
  sconto_privati?: boolean | null;
  lingua_it: string | null;
  link_booking_it: string | null;
  // solo workshop
  immagine_url?: string | null;
  link_evento?: string | null;
  home_subtitle_it?: string | null;
  home_subtitle_en?: string | null;
  home_subtitle_fr?: string | null;
  home_subtitle_de?: string | null;
  titolo_en?: string | null;
  titolo_fr?: string | null;
  titolo_de?: string | null;
  ora_inizio?: string | null;
  ora_fine?: string | null;
  link_zoom?: string | null;
  in_evidenza?: boolean | null; // per i workshop: "attiva nastro"
}

/* ----------------------------- workshop ---------------------------- */
/* Presentazioni gratuite di circa un'ora: non sono corsi (niente prezzi, iscrizioni o ordini).
   La partecipazione si prenota sull'evento LinkedIn indicato nel pannello. */

export interface Workshop {
  id: string;
  title: string;
  start: Date;
  time: string; // es. "18:00–19:00"
  place: string;
  language: string; // nome della lingua nella lingua del sito (Italiano / Italian / Italien / Italienisch)
  languageCode: "it" | "en" | "fr" | "de";
  description: string;
  image: string | null;
  eventUrl: string;
  zoomUrl: string;
  ribbon: boolean; // "attiva nastro": annunciato dal nastro sotto il menu
  startsAt: Date | null; // istante di inizio (ora italiana), null se l'orario non è indicato
  endsAt: Date | null;
  concluded: boolean;
}

export let WORKSHOPS: Workshop[] = [];

/** Istante corrispondente a "AAAA-MM-GG HH:MM" nell'ora italiana, a prescindere dal fuso del visitatore. */
function romeInstant(day: string, hhmm: string): Date {
  const [y, mo, d] = day.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Rome", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(new Date(guess))
      .map((x) => [x.type, x.value])
  );
  const asRome = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return new Date(guess - (asRome - guess));
}

/** Orario "HH:MM" dal campo dedicato oppure dal testo libero (es. "18:00–19:00"). */
export function workshopTimes(r: { ora_inizio?: string | null; ora_fine?: string | null; orario_it?: string | null }): { from: string; to: string } {
  const norm = (v?: string | null) => {
    const m = /(\d{1,2})[:.](\d{2})/.exec(v ?? "");
    return m ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
  };
  const free = String(r.orario_it ?? "").match(/(\d{1,2})[:.](\d{2})/g) ?? [];
  return { from: norm(r.ora_inizio) || norm(free[0]), to: norm(r.ora_fine) || norm(free[1]) };
}

/** Fascia in cui il pulsante Zoom è attivo: da 1 ora prima dell'inizio alla fine del workshop. */
export function zoomState(w: Workshop, now: number): "none" | "locked" | "open" | "live" | "ended" {
  if (!w.zoomUrl || !w.startsAt || !w.endsAt) return "none";
  if (now >= w.endsAt.getTime()) return "ended";
  if (now >= w.startsAt.getTime()) return "live";
  return now >= w.startsAt.getTime() - 3600000 ? "open" : "locked";
}

/** Ora (italiana) in cui si attiva il pulsante Zoom, es. "17:00". */
export const zoomOpensAt = (w: Workshop) =>
  w.startsAt ? new Date(w.startsAt.getTime() - 3600000).toLocaleTimeString(locale, { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" }) : "";

/** Le 4 lingue in cui si può tenere un workshop, con il nome nella lingua stessa. */
export const WORKSHOP_LANGUAGES = [
  { code: "it", name: "Italiano" },
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
] as const;

/** Riconosce la lingua dal testo salvato (es. "Italiano", "english", "Français"); in assenza di indicazione: italiano. */
export function workshopLanguage(raw?: string | null) {
  const s = String(raw ?? "").trim().toLowerCase();
  const code = /^(en|ing)/.test(s) ? "en" : /^(fr)/.test(s) ? "fr" : /^(de|ted|ger)/.test(s) ? "de" : "it";
  return WORKSHOP_LANGUAGES.find((l) => l.code === code)!;
}

/** Nome della lingua nella lingua del sito: "Italiano", "Italian", "Italien", "Italienisch". */
export function languageLabel(code: "it" | "en" | "fr" | "de"): string {
  try {
    const n = new Intl.DisplayNames([lang], { type: "language" }).of(code) ?? "";
    if (n) return n.charAt(0).toUpperCase() + n.slice(1);
  } catch {
    /* Intl.DisplayNames non disponibile: si usa il nome nella lingua stessa */
  }
  return WORKSHOP_LANGUAGES.find((l) => l.code === code)!.name;
}

const toWorkshop = (r: PublicRow): Workshop => {
  const key = lang as "it" | "en" | "fr" | "de";
  const day = (r.data_inizio || "").slice(0, 10);
  const start = new Date(`${day}T00:00:00`);
  const times = workshopTimes(r);
  const startsAt = times.from ? romeInstant(day, times.from) : null;
  const endsAt = startsAt ? (times.to ? romeInstant(day, times.to) : new Date(startsAt.getTime() + 3600000)) : null;
  const endOfDay = new Date(start.getTime() + DAY - 1);
  return {
    id: String(r.id_corso),
    title: plain((r[`titolo_${key}` as "titolo_en"] || r.titolo) as string),
    start,
    time: r.orario_it ?? "",
    place: (r[`luogo_${key}` as "luogo_it"] || r.luogo_it || "").trim(),
    language: languageLabel(workshopLanguage(r.lingua_it).code),
    languageCode: workshopLanguage(r.lingua_it).code,
    description: plain((r[`home_subtitle_${key}` as "home_subtitle_it"] || r.home_subtitle_it || "")),
    image: r.immagine_url || null,
    eventUrl: r.link_evento || "",
    zoomUrl: r.link_zoom || "",
    ribbon: r.in_evidenza === true,
    startsAt,
    endsAt,
    // concluso a fine workshop se l'orario è noto, altrimenti a fine giornata
    concluded: r.stato === 5 || (endsAt ?? endOfDay).getTime() < Date.now(),
  };
};

/** Prossimi workshop, dal più vicino. */
export const upcomingWorkshops = () => WORKSHOPS.filter((w) => !w.concluded).sort((a, b) => a.start.getTime() - b.start.getTime());
export const pastWorkshops = () => WORKSHOPS.filter((w) => w.concluded).sort((a, b) => b.start.getTime() - a.start.getTime());

const ENTITIES: Record<string, string> = { "&reg;": "®", "&amp;": "&", "&nbsp;": " ", "&quot;": '"', "&#039;": "'", "&trade;": "™" };
const plain = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(x?[0-9a-f]+);/gi, (_e, n: string) => String.fromCodePoint(n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : parseInt(n, 10)))
    .replace(/&[a-z]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? e)
    .replace(/\s+/g, " ")
    .trim();

const fromRow = (r: PublicRow): ApiCourse => ({
  id: r.id_corso,
  title: plain(r.titolo),
  weekend: /weekend/i.test(r.titolo),
  modalita: (r.modalita && r.modalita in MODALITA ? r.modalita : /weekend/i.test(r.titolo) ? "weekend" : "intensivo") as Modalita,
  orario: r.orario_it ?? "",
  privateDiscount: r.sconto_privati !== false,
  residential: /residential/i.test(r.titolo),
  level: (["Foundation", "Advanced", "Workshop"].find((l) => l.toLowerCase() === String(r.livello ?? "").trim().toLowerCase()) ?? "Foundation") as CourseLevel,
  stato: r.stato,
  open: r.iscrizioni_aperte,
  price: r.standard_price,
  earlyBirdPrice: r.early_bird_price,
  earlyBirdPct: Number(r.early_bird_percentuale) / 100,
  earlyBirdStart: r.early_bird_start,
  earlyBirdEnd: r.early_bird_end,
  start: r.data_inizio,
  end: r.data_fine ?? r.data_inizio,
  location: { IT: r.luogo_it ?? "", EN: r.luogo_en ?? "", FR: r.luogo_fr ?? "", DE: r.luogo_de ?? "" },
  language: { IT: r.lingua_it ?? "" },
  bookingUrl: { IT: r.link_booking_it ?? "" },
  seatsTotal: r.posti_totali,
  seatsLeft: r.posti_disponibili,
  featured: r.in_evidenza === true,
});

export async function loadCourses(): Promise<void> {
  if (!supabaseConfigured) throw new Error("Supabase non configurato (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
  // vista pubblica: solo corsi visibili e campi sicuri (vedi supabase/schema.sql)
  const { data, error } = await supabase.from("corsi_public").select("*").order("data_inizio", { ascending: true });
  if (error) throw error;
  // i workshop (livello "Workshop") hanno un modello proprio: non entrano nell'elenco dei corsi
  const rows = (data as PublicRow[]).filter((r) => r.data_inizio);
  const isWorkshop = (r: PublicRow) => String(r.livello ?? "").trim().toLowerCase() === "workshop";
  WORKSHOPS = rows.filter(isWorkshop).filter((r) => r.stato !== 2).map(toWorkshop);
  COURSES = rows.filter((r) => !isWorkshop(r)).map(fromRow).map(toCourse);
}

export const upcomingCourses = () =>
  COURSES.filter((c) => !c.concluded).sort((a, b) => a.start.getTime() - b.start.getTime());

export const concludedCourses = () =>
  COURSES.filter((c) => c.concluded).sort((a, b) => b.start.getTime() - a.start.getTime());

/** Prossima edizione con iscrizioni aperte (fallback: la prima in programma, poi l'ultima conclusa). */
export const nextCourse = (): Course => {
  const up = upcomingCourses();
  return up.find((c) => c.status !== "waitlist") ?? up[0] ?? concludedCourses()[0] ?? EMPTY_COURSE;
};

/** Edizione promossa nel pulsante "Iscriviti" del menu e nella card dell'introduzione: la prima in programma segnata "In evidenza"
 *  nel pannello; se nessuna lo è, la prossima edizione con iscrizioni aperte. */
export const featuredCourse = (): Course => upcomingCourses().find((c) => c.featured) ?? nextCourse();

/** Trova il corso dall'indirizzo: conta solo l'id numerico in testa, il resto dello slug è descrittivo. */
export const bySlug = (slug: string) => {
  const id = leadingId(slug);
  return COURSES.find((c) => c.slug === slug) ?? (id != null ? COURSES.find((c) => c.id === id) : undefined);
};

const EMPTY_COURSE: Course = {
  ...toCourse({
    id: 0, title: t("CPSA-Foundation®"), weekend: false, modalita: "intensivo", orario: "", privateDiscount: true, residential: false, level: "Foundation", stato: 0, open: false,
    price: 0, earlyBirdPrice: null, earlyBirdPct: 0, earlyBirdStart: null, earlyBirdEnd: null,
    start: new Date().toISOString(), end: new Date().toISOString(), location: {}, language: {}, bookingUrl: {},
    seatsTotal: null, seatsLeft: null,
  }),
};


/* ------------------------------ numeri ---------------------------- */

export const STATS = [
  { value: "iSAQB®", label: t("Training Provider accreditato") },
  { value: t("3 giorni"), label: t("24 ore di formazione live") },
  { value: t("Max 12"), label: t("partecipanti per edizione") },
  { value: "2024", label: t("accreditamento iSAQB®") },
];

/* --------------------------- testimonianze ------------------------ */

/* -------------------------------- FAQ ----------------------------- */

export const FAQS = COPY.FAQS_COPY.map((f) => ({
  q: t(f.q),
  a: t(f.a),
  // la risposta sull'esame rimanda alle pagine ufficiali iSAQB®
  ...(f.links === "exam" ? { links: [isaqbLinks().exams, isaqbLinks().certification, isaqbLinks().cpsaF] } : {}),
}));

export const ORG = {
  name: t("Cube Academy"),
  company: "Cube Engineering S.r.l.",
  vat: "12870461006",
  rea: "RM-1406493",
  legalAddress: "Via San Martino Della Battaglia, 31 - 00185 Roma",
  email: "academy@cubeng.eu",
  phone: "+39 06 92.92.87.80",
  address: t("Via Venti Settembre, 118 - 00187 Roma"),
};
