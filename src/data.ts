/* ------------------------------------------------------------------ */
/*  Cube Academy — layer dati del prototipo.                           */
/*  Date generate dinamicamente: la demo mostra sempre stati reali     */
/*  (early bird attivo, countdown, edizioni imminenti).                */
/* ------------------------------------------------------------------ */

import { supabase, supabaseConfigured } from "./lib/supabase";

import { lang, locale, t } from "./i18n";
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
  modalita: Modalita;
  orario: string;
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
  bio: t("I corsi CPSA-F sono tenuti da un docente accreditato iSAQB®, come richiesto dal programma di accreditamento: Cube Engineering organizza e conduce i corsi solo con trainer accreditati e materiale didattico accreditato iSAQB®. Ogni edizione ha un unico docente, per questo i partecipanti sono al massimo 12."),
};

/* --------------------------- contenuti base ----------------------- */

const F_OBJECTIVES = [
  t("Comprendere i concetti fondamentali e la terminologia dell'architettura software"),
  t("Analizzare e definire i requisiti architetturali, inclusi i requisiti di qualità"),
  t("Applicare metodologie e strumenti per la progettazione e documentazione dell'architettura software"),
  t("Valutare diverse soluzioni architetturali rispetto ai requisiti e ai vincoli aziendali e tecnici"),
  t("Collaborare efficacemente con team multidisciplinari e stakeholder"),
];

const F_AUDIENCE = [
  t("Software Architect"),
  t("Sviluppatori senior e Lead Developer"),
  t("Project Manager con focus tecnico"),
  t("IT Consultant e Technical Leader"),
  t("Esperti di requisiti e ingegneri del software"),
];

const F_PREREQUISITES = [
  t("Almeno 18 mesi di esperienza pratica nello sviluppo di software, acquisita programmando vari progetti o sistemi al di fuori dell'istruzione"),
  t("Conoscenza ed esperienza pratica in almeno un linguaggio di programmazione, preferibilmente ad oggetti"),
  t("Nozioni di base di UML (diagrammi di classe, di pacchetto, di componente e di sequenza) e loro relazione con il codice sorgente"),
  t("Esperienza pratica nella documentazione tecnica"),
];

const F_MODULES: CourseModule[] = [
  {
    title: t("Introduzione all'architettura software"),
    hours: 0,
    topics: [t("Concetti base e terminologia"), t("Ruolo e responsabilità dell'architetto software")],
  },
  {
    title: t("Requisiti e qualità del software"),
    hours: 0,
    topics: [t("Raccolta e gestione dei requisiti architetturali"), t("Requisiti di qualità e scenari di qualità")],
  },
  {
    title: t("Progettazione dell'architettura software"),
    hours: 0,
    topics: [
      t("Modelli architetturali e stili (ad esempio Layered Architecture, Microservices, Event-Driven Architecture)"),
      t("Decisioni architetturali e trade-off"),
    ],
  },
  {
    title: t("Documentazione e comunicazione"),
    hours: 0,
    topics: [t("Tecniche di documentazione dell'architettura"), t("Comunicazione con stakeholder tecnici e non tecnici")],
  },
  {
    title: t("Valutazione delle architetture software"),
    hours: 0,
    topics: [t("Strumenti e tecniche per valutare la qualità dell'architettura"), t("Analisi dei rischi e mitigazione")],
  },
];

const F_INCLUDES = [
  t("Corso sincrono con docente accreditato iSAQB® (max 12 partecipanti)"),
  t("Materiale Cube Academy / iSAQB®"),
  t("Simulazione d'esame con discussione e correzione (ultima giornata)"),
  t("Attestato di partecipazione Cube Academy, su richiesta"),
];

/* ------------------------------ corsi ----------------------------- */
/* I corsi arrivano dal database (vista Supabase corsi_public), gestito dal pannello #/admin. */

export interface ApiCourse {
  id: number;
  title: string;
  weekend: boolean;
  modalita: Modalita;
  orario: string;
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
    tagline: t("Aula virtuale live su Zoom con docente accreditato e simulazione d'esame nell'ultima giornata."),
    description:
      t("Il corso iSAQB® CPSA Foundation Level fornisce una solida base per apprendere i principi fondamentali della progettazione e gestione dell'architettura software, con l'obiettivo di creare sistemi robusti, scalabili e facilmente manutenibili."),
  },
  aula: {
    image: "https://images.pexels.com/photos/3184328/pexels-photo-3184328.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: t("In presenza a Roma, con docente accreditato iSAQB® e gruppi fino a 12 partecipanti."),
    description:
      t("Lo stesso programma iSAQB® CPSA Foundation Level, seguito in aula a Roma."),
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
    slug: String(a.id),
    short,
    title: a.title,
    level: (a.level as CourseLevel) || "Foundation",
    format,
    status,
    concluded,
    start,
    end,
    effort: a.modalita !== "intensivo" ? mod.effort : days === 3 ? mod.effort : t("{d} giornate · {h} ore", { d: days, h: days * 8 }),
    modalita: a.modalita,
    orario: a.orario || mod.schedule,
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
  modalita: (r.modalita && r.modalita in MODALITA ? r.modalita : /weekend/i.test(r.titolo) ? "weekend" : "intensivo") as Modalita,
  orario: r.orario_it ?? "",
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
  location: { IT: r.luogo_it ?? "", EN: r.luogo_en ?? "", FR: r.luogo_fr ?? "", DE: r.luogo_de ?? "" },
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
    id: 0, title: t("CPSA-Foundation®"), weekend: false, modalita: "intensivo", orario: "", residential: false, level: "Foundation", stato: 0, open: false,
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

export const FAQS = [
  {
    q: t("L'esame di certificazione è incluso nel prezzo?"),
    a: t("No. La tassa d'esame CPSA-F (280 € + IVA) non è inclusa nel prezzo del corso e si paga separatamente all'ente di certificazione autorizzato iSAQB®, con cui organizzi l'esame in autonomia al termine del corso. Durante l'ultima giornata svolgiamo una simulazione d'esame con discussione e correzione."),
  },
  {
    q: t("Posso pagare con bonifico e fattura alla mia azienda?"),
    a: t("Certo. Durante l'iscrizione scegli il soggetto fatturante (privato, libero professionista, azienda italiana o estera) e inserisci P.IVA, codice SDI e PEC. "),
  },
  {
    q: t("Come funziona la politica di rimborso?"),
    a: t("Se il corso non viene erogato per mancato raggiungimento del numero minimo di partecipanti, la quota versata è rimborsata (in alternativa puoi scegliere un'altra data). Per altre esigenze, come la sostituzione di un partecipante, scrivi a academy@cubeng.eu."),
  },
  {
    q: t("Cosa sono i corsi Prestige residenziali?"),
    a: t("I corsi residenziali durano 4 giorni e comprendono albergo e mezza pensione, nelle più belle città italiane. Le informazioni arriveranno presto: scrivi a academy@cubeng.eu per essere avvisato."),
  },
  {
    q: t("Serve esperienza da architetto per iscriversi?"),
    a: t("No: servono almeno 18 mesi di esperienza in sviluppo software. Il corso Foundation è pensato per costruire il metodo, parte dalle basi del ruolo. Se hai dubbi sul livello, scrivici a academy@cubeng.eu."),
  },
  {
    q: t("Organizzate edizioni dedicate per il nostro team?"),
    a: t("Per gruppi aziendali puoi contattarci per valutare edizioni dedicate. Scrivi a academy@cubeng.eu."),
  },
];

export const ORG = {
  name: t("Cube Academy"),
  company: "Cube Engineering S.r.l.",
  vat: "",
  email: "academy@cubeng.eu",
  phone: "+39 06 92.92.87.80",
  address: t("Via Venti Settembre, 118 - 00187 Roma"),
};
