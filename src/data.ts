/* ------------------------------------------------------------------ */
/*  Cube Academy — layer dati del prototipo.                           */
/*  Date generate dinamicamente: la demo mostra sempre stati reali     */
/*  (early bird attivo, countdown, edizioni imminenti).                */
/* ------------------------------------------------------------------ */

import { supabase, supabaseConfigured } from "./lib/supabase";

const DAY = 86400000;

export type CourseFormat = "online" | "aula" | "prestige";
export type CourseLevel = "Foundation" | "Advanced" | "Workshop";
export type CourseStatus = "available" | "few" | "waitlist" | "concluded";
export type Lang = "IT" | "EN";

export interface CourseModule {
  title: string;
  hours: number;
  topics: string[];
}

export interface Course {
  slug: string;
  short: string;
  title: string;
  level: CourseLevel;
  format: CourseFormat;
  status: CourseStatus;
  concluded: boolean;
  start: Date;
  end: Date;
  effort: string;
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
  online: { label: "Live Online", blurb: "Aula virtuale interattiva, stessi docenti, zero trasferte." },
  aula: { label: "In Aula", blurb: "Full immersion nelle nostre sedi di Milano e Bologna." },
  prestige: { label: "Prestige Residenziale", blurb: "Corso + hotel 4★ in location italiane d'eccezione." },
};

export const STATUS_META: Record<CourseStatus, { label: string }> = {
  available: { label: "Posti disponibili" },
  few: { label: "Ultimi posti" },
  waitlist: { label: "Lista d'attesa" },
  concluded: { label: "Edizione conclusa" },
};

/* --------------------------- formattatori ------------------------- */

export const eur = (n: number) =>
  n.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export const eur2 = (n: number) =>
  n.toLocaleString("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

const MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

export const fmtDate = (dt: Date) => `${dt.getDate()} ${MONTHS[dt.getMonth()]}`;

export const fmtRange = (a: Date, b: Date) => {
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  const start = sameMonth ? `${a.getDate()}` : fmtDate(a);
  return `${start}–${fmtDate(b)} ${b.getFullYear()}`;
};

export const fmtFull = (dt: Date) =>
  dt.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

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

export const COUPONS: Record<string, { pct: number; label: string }> = {
  ARCHI10: { pct: 0.1, label: "Sconto community −10%" },
  TEAM5: { pct: 0.05, label: "Sconto team −5%" },
};

export const VAT = 0.22;

/* -------------------------- metodi pagamento ---------------------- */

export const PAYMENT_METHODS = [
  {
    id: "stripe",
    label: "Carta di credito / debito",
    detail: "Visa, Mastercard, Amex. Checkout sicuro Stripe con 3-D Secure.",
    timing: "Conferma immediata",
    speed: "fast" as const,
    cta: "Paga ora con carta",
  },
  {
    id: "paypal",
    label: "PayPal",
    detail: "Usa il saldo o la carta collegata. Anche in 3 rate, se eleggibile.",
    timing: "Conferma immediata",
    speed: "fast" as const,
    cta: "Vai al checkout PayPal",
  },
  {
    id: "sumup",
    label: "Link di pagamento SumUp",
    detail: "Ricevi via email un link per pagare con carta quando preferisci, entro 48h.",
    timing: "Link entro 1 ora lavorativa",
    speed: "mid" as const,
    cta: "Inviami il link di pagamento",
  },
  {
    id: "bonifico",
    label: "Bonifico bancario",
    detail: "Ideale per aziende con procedura d'acquisto. I posti restano bloccati 7 giorni lavorativi.",
    timing: "Conferma in 3–5 giorni",
    speed: "slow" as const,
    cta: "Conferma e ricevi le coordinate",
  },
];
export type MethodId = (typeof PAYMENT_METHODS)[number]["id"];

export const BANK = {
  holder: "Cube Engineering S.r.l.",
  iban: "IT60 X054 2811 1010 0000 0123 456",
  bank: "Banca di Credito Cooperativo — Sede di Bologna",
  bic: "ICRAITRRXXX",
};

/* ------------------------------ docente --------------------------- */

export const TRAINER = {
  name: "Ing. Luca Ferrandi",
  role: "iSAQB® Accredited Trainer · Software Architect",
  img: "https://images.pexels.com/photos/28442318/pexels-photo-28442318.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  bio: "Da oltre vent'anni progetta sistemi distribuiti mission-critical per banche, telco e pubblica amministrazione. Trainer accreditato iSAQB dal 2015, ha certificato più di 700 professionisti in 4 lingue. Membro attivo dei working group iSAQB sul curriculum Foundation.",
};

/* --------------------------- contenuti base ----------------------- */

const F_OBJECTIVES = [
  "Progettare architetture software a partire da requisiti e vincoli, non per abitudine",
  "Padroneggiare principi di design, pattern architetturali e trade-off documentati",
  "Documentare l'architettura in modo comunicabile (arc42, C4, ADR)",
  "Valutare la qualità di un'architettura con scenari e metriche oggettive",
  "Comunicare decisioni tecniche a stakeholder tecnici e di business",
  "Presentarti all'esame CPSA-F con simulazioni reali e feedback del trainer",
];

const F_AUDIENCE = [
  "Software architect e aspiranti tali",
  "Sviluppatrici e sviluppatori senior (3+ anni)",
  "Technical lead e engineering manager",
  "IT consultant che progettano soluzioni per clienti",
  "Project manager tecnici che devono dialogare con gli architect",
];

const F_PREREQUISITES = [
  "Almeno 18 mesi di esperienza nello sviluppo software (consigliati 3+ anni)",
  "Conoscenza pratica di almeno un linguaggio ad oggetti o funzionale",
  "Utili ma non obbligatorie: nozioni di UML e di sviluppo a componenti",
  "Nessuna certificazione precedente richiesta",
];

const F_MODULES: CourseModule[] = [
  {
    title: "Giorno 1 — Fondamenti e ruolo dell'architetto",
    hours: 8,
    topics: [
      "Che cos'è (e non è) l'architettura software: definizioni iSAQB",
      "Il ruolo dell'architetto nel ciclo di vita e nei team agili",
      "Obiettivi di qualità ISO 25010 e alberi di qualità",
      "Vincoli tecnici, organizzativi e legge di Conway",
    ],
  },
  {
    title: "Giorno 2 — Progettazione: principi e pattern",
    hours: 8,
    topics: [
      "Principi: modularità, accoppiamento, coesione, SOLID applicato all'architettura",
      "Pattern architetturali: layer, hexagonal, microservizi, event-driven",
      "Gestione delle dipendenze e interfacce tra componenti",
      "Workshop: da requisiti a struttura, in gruppi",
    ],
  },
  {
    title: "Giorno 3 — Documentare e comunicare",
    hours: 8,
    topics: [
      "arc42 e C4 model: documentare ciò che serve, niente di più",
      "Architecture Decision Records (ADR) e decision log",
      "Viste architetturali: contesto, building block, runtime, deployment",
      "Workshop: documentare il caso del Giorno 2 e presentarlo",
    ],
  },
  {
    title: "Giorno 4 — Qualità, evoluzione ed esame",
    hours: 8,
    topics: [
      "Valutazione architetturale: scenari, ATAM semplificato, metriche",
      "Evoluzione, debito tecnico e modernizzazione dei legacy system",
      "Simulazione completa d'esame CPSA-F con correzione guidata",
      "Q&A finale, piano di studio personalizzato e tips per l'esame",
    ],
  },
];

const F_INCLUDES = [
  "Voucher d'esame CPSA-F incluso (valore € 250)",
  "Slide, workbook e repository di esercizi in PDF",
  "Registrazioni delle sessioni disponibili per 30 giorni",
  "Attestato di partecipazione Cube Academy",
  "Accesso alla community alumni (2.400+ iscritti)",
  "Supporto del trainer via email fino all'esame",
];

/* ------------------------------ corsi ----------------------------- */
/* I corsi arrivano dal database (vista Supabase corsi_public), gestito dal pannello #/admin. */

export interface ApiCourse {
  id: number;
  title: string;
  weekend: boolean;
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
}

const FORMAT_COPY: Record<CourseFormat, { image: string; tagline: string; description: string }> = {
  online: {
    image: "https://images.pexels.com/photos/18999565/pexels-photo-18999565.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: "Aula virtuale live: esercitazioni in breakout room e simulazione d'esame con il trainer.",
    description:
      "Il percorso Foundation copre l'intero curriculum iSAQB: dai fondamenti del ruolo alla progettazione, dalla documentazione alla valutazione della qualità. Le lezioni alternano teoria, casi reali dai progetti del docente e workshop di gruppo con revisione in plenaria.",
  },
  aula: {
    image: "https://images.pexels.com/photos/3184328/pexels-photo-3184328.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: "Full immersion in presenza: lavagne, post-it e networking con professionisti di tutta Italia.",
    description:
      "Stessa qualità del curriculum iSAQB, con l'energia dell'aula fisica: esercitazioni al flipchart, design review a coppie e conversazioni che continuano durante le pause.",
  },
  prestige: {
    image: "https://images.pexels.com/photos/38120266/pexels-photo-38120266.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: "Corso e soggiorno in una location d'eccezione: formazione intensiva senza distrazioni.",
    description:
      "Il percorso Foundation in formato residenziale: l'intero curriculum iSAQB, esercitazioni di gruppo e simulazione d'esame, con soggiorno in una location selezionata.",
  },
};

const toDate = (iso: string | null, endOfDay = false) =>
  new Date(`${(iso || "").slice(0, 10)}T${endOfDay ? "18:00" : "09:00"}:00`);

function toCourse(a: ApiCourse): Course {
  const online = /online/i.test(a.location.IT || "");
  const format: CourseFormat = a.residential ? "prestige" : online ? "online" : "aula";
  const start = toDate(a.start);
  const end = toDate(a.end || a.start, true);
  const days = a.weekend ? 4 : Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY) + 1);
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
  const loc = a.location.IT || "";
  const short = `CPSA-F ${a.weekend ? "Weekend" : online ? "Online" : loc} · ${fmtDate(start)}`;
  return {
    slug: String(a.id),
    short,
    title: a.title,
    level: (a.level as CourseLevel) || "Foundation",
    format,
    status,
    concluded,
    start,
    end,
    effort: `${days} giornate · ${days * 8} ore`,
    location: online ? "Aula virtuale live" : loc,
    language: /^ital/i.test(a.language.IT || "") ? "IT" : "EN",
    seatsTotal: a.seatsTotal,
    seatsLeft,
    price,
    earlyBirdPct: pct > 0 ? pct : 0,
    earlyBirdPrice: a.earlyBirdPrice,
    earlyBirdFrom: a.earlyBirdStart ? new Date(a.earlyBirdStart) : new Date(0),
    earlyBirdUntil: a.earlyBirdEnd ? new Date(a.earlyBirdEnd) : new Date(0),
    examIncluded: true,
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
  lingua_it: string | null;
  link_booking_it: string | null;
}

const ENTITIES: Record<string, string> = { "&reg;": "®", "&amp;": "&", "&nbsp;": " ", "&quot;": '"', "&#039;": "'", "&trade;": "™" };
const plain = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? e)
    .replace(/\s+/g, " ")
    .trim();

const fromRow = (r: PublicRow): ApiCourse => ({
  id: r.id_corso,
  title: plain(r.titolo),
  weekend: /weekend/i.test(r.titolo),
  residential: /residential/i.test(r.titolo),
  level: r.livello,
  stato: r.stato,
  open: r.iscrizioni_aperte,
  price: r.standard_price,
  earlyBirdPrice: r.early_bird_price,
  earlyBirdPct: Number(r.early_bird_percentuale) / 100,
  earlyBirdStart: r.early_bird_start,
  earlyBirdEnd: r.early_bird_end,
  start: r.data_inizio,
  end: r.data_fine ?? r.data_inizio,
  location: { IT: r.luogo_it ?? "" },
  language: { IT: r.lingua_it ?? "" },
  bookingUrl: { IT: r.link_booking_it ?? "" },
  seatsTotal: r.posti_totali,
  seatsLeft: r.posti_disponibili,
});

export async function loadCourses(): Promise<void> {
  if (!supabaseConfigured) throw new Error("Supabase non configurato (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
  // vista pubblica: solo corsi visibili e campi sicuri (vedi supabase/schema.sql)
  const { data, error } = await supabase.from("corsi_public").select("*").order("data_inizio", { ascending: true });
  if (error) throw error;
  COURSES = (data as PublicRow[]).map(fromRow).filter((r) => r.start).map(toCourse);
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

export const bySlug = (slug: string) => COURSES.find((c) => c.slug === slug);

const EMPTY_COURSE: Course = {
  ...toCourse({
    id: 0, title: "CPSA-Foundation®", weekend: false, residential: false, level: "Foundation", stato: 0, open: false,
    price: 0, earlyBirdPrice: null, earlyBirdPct: 0, earlyBirdStart: null, earlyBirdEnd: null,
    start: new Date().toISOString(), end: new Date().toISOString(), location: {}, language: {}, bookingUrl: {},
    seatsTotal: null, seatsLeft: null,
  }),
};


/* ------------------------------ numeri ---------------------------- */

export const STATS = [
  { value: "740+", label: "professionisti certificati" },
  { value: "98,4%", label: "esame superato al primo tentativo" },
  { value: "4,9/5", label: "valutazione media · 212 recensioni" },
  { value: "2", label: "anni di corsi, dal 2024" },
];

/* --------------------------- testimonianze ------------------------ */

export const TESTIMONIALS = [
  {
    quote:
      "Avevo letto il curriculum da solo e mi sembrava arido. In aula tutto è diventato concreto: i workshop sui casi reali valgono da soli il prezzo del corso. Esame superato con 82%.",
    name: "Giulia Moretti",
    role: "Lead Software Engineer · Gruppo bancario, Milano",
    img: "https://images.pexels.com/photos/8312669/pexels-photo-8312669.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
  {
    quote:
      "L'azienda ha iscritto quattro di noi con fattura e bonifico: processo impeccabile, fatturazione elettronica arrivata in giornata. Il formato Prestige in Toscana? Il miglior corso della mia carriera.",
    name: "Marco Santini",
    role: "Solution Architect · System integrator, Roma",
    img: "https://images.pexels.com/photos/7752846/pexels-photo-7752846.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
  {
    quote:
      "Docente di livello raro: ha risposto a ogni domanda con un esempio da un progetto vero, mai con la slide. Il voucher d'esame incluso e la simulazione finale tolgono ogni incertezza.",
    name: "Elena Pagano",
    role: "Engineering Manager · Scale-up fintech, Torino",
    img: "https://images.pexels.com/photos/33680700/pexels-photo-33680700.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
];

/* -------------------------------- FAQ ----------------------------- */

export const FAQS = [
  {
    q: "L'esame di certificazione è incluso nel prezzo?",
    a: "Sì, per tutti i corsi Foundation il voucher d'esame CPSA-F (valore € 250) è incluso: prenotiamo noi la sessione presso l'ente certificatore. L'esame è online, in italiano o inglese, con proctoring da remoto quando preferisci tu.",
  },
  {
    q: "Posso pagare con bonifico e fattura alla mia azienda?",
    a: "Certo: circa il 60% delle iscrizioni è aziendale. Durante l'iscrizione scegli il soggetto fatturante (privato, libero professionista, azienda italiana o estera) e inserisci P.IVA, codice SDI e PEC. Fattura elettronica emessa entro 48h dal pagamento. Con il bonifico i posti restano bloccati 7 giorni lavorativi.",
  },
  {
    q: "Come funziona la politica di rimborso?",
    a: "Rimborso del 100% fino a 14 giorni prima dell'inizio, 50% fino a 7 giorni prima. Oltre quel termine puoi sempre sostituire il partecipante gratuitamente o spostare l'iscrizione a una data futura (una volta). Se annulliamo noi l'edizione, rimborso integrale garantito.",
  },
  {
    q: "Cosa comprende il formato Prestige residenziale?",
    a: "Corso completo, voucher d'esame, 4 notti in hotel 4★ in camera singola, tutti i pasti, la cena conviviale con degustazione e il transfer da Firenze o Como. Porta solo il laptop: gruppi da massimo 14 persone.",
  },
  {
    q: "Serve esperienza da architetto per iscriversi?",
    a: "No: servono almeno 18 mesi di esperienza in sviluppo software. Il corso Foundation è pensato per costruire il metodo, parte dalle basi del ruolo. Se hai dubbi sul livello, scrivici: ti facciamo una call di orientamento gratuita di 15 minuti.",
  },
  {
    q: "Organizzate edizioni dedicate per il nostro team?",
    a: "Sì: per gruppi da 8+ persone attiviamo edizioni private (online, nella vostra sede o in formato Prestige) con casi di studio costruiti sul vostro dominio. Scrivi a academy@cubeng.eu per un preventivo in 48 ore.",
  },
];

export const ORG = {
  name: "Cube Academy",
  company: "Cube Engineering S.r.l.",
  vat: "P.IVA 04871201201",
  email: "academy@cubeng.eu",
  phone: "+39 051 042 1234",
  address: "Via dell'Innovazione 12, 40126 Bologna",
};
