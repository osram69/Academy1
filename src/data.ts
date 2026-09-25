/* ------------------------------------------------------------------ */
/*  Cube Academy — layer dati del prototipo.                           */
/*  Date generate dinamicamente: la demo mostra sempre stati reali     */
/*  (early bird attivo, countdown, edizioni imminenti).                */
/* ------------------------------------------------------------------ */

const DAY = 86400000;
const d = (daysFromNow: number) => new Date(Date.now() + daysFromNow * DAY);

export type CourseFormat = "online" | "aula" | "prestige";
export type CourseLevel = "Foundation" | "Advanced" | "Workshop";
export type CourseStatus = "available" | "few" | "waitlist";
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
  start: Date;
  end: Date;
  effort: string;
  location: string;
  language: Lang;
  seatsTotal: number;
  seatsLeft: number;
  price: number; // listino, IVA esclusa
  earlyBirdPct: number;
  earlyBirdUntil: Date;
  examIncluded: boolean;
  image: string;
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
  const active = new Date() < c.earlyBirdUntil && c.status !== "waitlist";
  return {
    unit: active ? Math.round(c.price * (1 - c.earlyBirdPct)) : c.price,
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

export const COURSES: Course[] = [
  {
    slug: "cpsa-f-online",
    short: "CPSA-F Live Online",
    title: "CPSA-Foundation® — Certificazione in Software Architecture",
    level: "Foundation",
    format: "online",
    status: "available",
    start: d(38),
    end: d(41),
    effort: "4 giornate · 32 ore · 9:00–18:00 CET",
    location: "Aula virtuale live (Zoom)",
    language: "IT",
    seatsTotal: 20,
    seatsLeft: 12,
    price: 1800,
    earlyBirdPct: 0.15,
    earlyBirdUntil: d(10),
    examIncluded: true,
    image:
      "https://images.pexels.com/photos/18999565/pexels-photo-18999565.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: "L'edizione online più intensiva: quattro giornate live, esercitazioni in breakout room e simulazione d'esame il quarto giorno.",
    description:
      "Il percorso Foundation copre l'intero curriculum iSAQB 2023: dai fondamenti del ruolo alla progettazione, dalla documentazione alla valutazione della qualità. Le lezioni alternano teoria, casi reali dai progetti del docente e workshop di gruppo con revisione in plenaria. Il quarto giorno si chiude con una simulazione completa d'esame e un piano di studio individuale.",
    objectives: F_OBJECTIVES,
    audience: F_AUDIENCE,
    modules: F_MODULES,
    prerequisites: F_PREREQUISITES,
    includes: F_INCLUDES,
  },
  {
    slug: "cpsa-f-milano",
    short: "CPSA-F Milano",
    title: "CPSA-Foundation® — Edizione in Aula a Milano",
    level: "Foundation",
    format: "aula",
    status: "few",
    start: d(66),
    end: d(69),
    effort: "4 giornate · 32 ore · 9:00–18:00",
    location: "Milano — Talent Garden Calabiana",
    language: "IT",
    seatsTotal: 18,
    seatsLeft: 3,
    price: 1850,
    earlyBirdPct: 0.15,
    earlyBirdUntil: d(24),
    examIncluded: true,
    image:
      "https://images.pexels.com/photos/3184328/pexels-photo-3184328.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: "Full immersion in presenza: lavagne, post-it, networking a pranzo con professionisti di tutta Italia.",
    description:
      "Stessa qualità del curriculum iSAQB, con l'energia dell'aula fisica: esercitazioni al flipchart, design review a coppie e conversationi che continuano durante le pause. La sede è a due passi dai Navigli, raggiungibile in metro (M2 Porta Genova).",
    objectives: F_OBJECTIVES,
    audience: F_AUDIENCE,
    modules: F_MODULES,
    prerequisites: F_PREREQUISITES,
    includes: [...F_INCLUDES, "Pranzi e coffee break inclusi nei 4 giorni"],
  },
  {
    slug: "cpsa-f-prestige-toscana",
    short: "CPSA-F Prestige · Toscana",
    title: "CPSA-Foundation® Prestige — Residenziale in Toscana",
    level: "Foundation",
    format: "prestige",
    status: "available",
    start: d(94),
    end: d(98),
    effort: "5 giornate · 32 ore + sessioni serali",
    location: "Villa Colombai — Greve in Chianti (FI)",
    language: "IT",
    seatsTotal: 14,
    seatsLeft: 8,
    price: 3400,
    earlyBirdPct: 0.15,
    earlyBirdUntil: d(30),
    examIncluded: true,
    image:
      "https://images.pexels.com/photos/38120266/pexels-photo-38120266.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: "Cinque giorni tra le colline del Chianti: corso, hotel 4★, cene conviviali e una masterclass serale sotto le stelle.",
    description:
      "Il formato Prestige trasforma la certificazione in un'esperienza: si studia al mattino nella limonaia della villa, si progetta nel pomeriggio sotto il portico, e la sera si discute di architettura davanti a un calice. Il ritmo residenziale — senza pendolarismo e distrazioni — è il modo più profondo che conosciamo per interiorizzare il curriculum. Gruppo volutamente ristretto: massimo 14 partecipanti.",
    objectives: F_OBJECTIVES,
    audience: F_AUDIENCE,
    modules: [
      ...F_MODULES.slice(0, 3),
      {
        title: "Giorno 4 — Qualità ed evoluzione + masterclass serale",
        hours: 8,
        topics: [
          "Valutazione architetturale: scenari e metriche",
          "Evoluzione e modernizzazione dei legacy system",
          "Masterclass serale: case study reale raccontato dal docente",
          "Cena conviviale con i trainer",
        ],
      },
      {
        title: "Giorno 5 — Simulazione d'esame e commit finale",
        hours: 6,
        topics: [
          "Simulazione completa d'esame CPSA-F con correzione guidata",
          "Retrospettiva sul sistema progettato nella settimana",
          "Piano di studio personalizzato e iscrizione all'esame",
        ],
      },
    ],
    prerequisites: F_PREREQUISITES,
    includes: [
      ...F_INCLUDES,
      "Hotel 4★ nella villa: 4 notti in camera singola",
      "Tutti i pasti inclusi, dal lunedì al venerdì",
      "Cena conviviale con degustazione in cantina",
      "Transfer organizzato da/per Firenze S. M. Novella",
    ],
  },
  {
    slug: "cpsa-f-online-en",
    short: "CPSA-F Online (EN)",
    title: "CPSA-Foundation® — English Live Online Edition",
    level: "Foundation",
    format: "online",
    status: "available",
    start: d(52),
    end: d(55),
    effort: "4 days · 32 hours · 9:00–18:00 CET",
    location: "Aula virtuale live (Zoom)",
    language: "EN",
    seatsTotal: 20,
    seatsLeft: 11,
    price: 1800,
    earlyBirdPct: 0.15,
    earlyBirdUntil: d(8),
    examIncluded: true,
    image:
      "https://images.pexels.com/photos/18999478/pexels-photo-18999478.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: "English edition with international cohort — ideal for distributed teams across Europe.",
    description:
      "The full iSAQB Foundation curriculum taught in English, with participants joining from across Europe. Same structure as the Italian edition: live sessions, group workshops in breakout rooms and a full mock exam on day four.",
    objectives: F_OBJECTIVES,
    audience: F_AUDIENCE,
    modules: F_MODULES,
    prerequisites: F_PREREQUISITES,
    includes: F_INCLUDES,
  },
  {
    slug: "adr-masterclass",
    short: "Masterclass ADR",
    title: "Masterclass — ADR & Architecture Documentation",
    level: "Advanced",
    format: "aula",
    status: "available",
    start: d(45),
    end: d(46),
    effort: "2 giornate · 16 ore · 9:30–17:30",
    location: "Bologna — Sede Cube Engineering",
    language: "IT",
    seatsTotal: 16,
    seatsLeft: 6,
    price: 890,
    earlyBirdPct: 0.1,
    earlyBirdUntil: d(18),
    examIncluded: false,
    image:
      "https://images.pexels.com/photos/34774352/pexels-photo-34774352.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: "Due giorni per smettere di documentare 'dopo': decision log vivi, ADR nei pull request e arc42 senza burocrazia.",
    description:
      "Una masterclass pratica sul tema che ogni team rimanda: la documentazione d'architettura. Si lavora sul proprio caso reale (portate un sistema che conoscete) impostando decision log, ADR template e una struttura arc42 sostenibile nel tempo.",
    objectives: [
      "Scrivere ADR che il team legge davvero, integrati nel flusso di code review",
      "Impostare un decision log condiviso e ricercabile",
      "Modellare il sistema con C4 in meno di un'ora",
      "Ridurre il rischio 'conoscenza nella testa di uno solo'",
    ],
    audience: ["Software architect e tech lead", "Team di 3+ persone che vogliono un metodo comune", "Chi ha frequentato CPSA-F e vuole approfondire il tema"],
    modules: [
      {
        title: "Giorno 1 — Decisioni prima di tutto",
        hours: 8,
        topics: ["Anatomia di una decisione architetturale", "ADR: template, tono, antipattern", "ADR nei pull request: demo live", "Workshop sul proprio caso"],
      },
      {
        title: "Giorno 2 — Struttura che dura",
        hours: 8,
        topics: ["arc42 essenziale: le 6 sezioni che contano", "C4 model hands-on", "Automatizzare gli snippet dal codice", "Design review finale sui casi dei partecipanti"],
      },
    ],
    prerequisites: ["Esperienza su almeno un progetto in produzione", "Portare un'architettura reale su cui lavorare (anche anonimizzata)"],
    includes: ["Template library ADR + arc42 in italiano e inglese", "Pranzi inclusi", "Attestato di partecipazione"],
  },
  {
    slug: "exam-sprint",
    short: "Exam Sprint",
    title: "CPSA-F Exam Readiness Sprint",
    level: "Workshop",
    format: "online",
    status: "available",
    start: d(20),
    end: d(21),
    effort: "2 mezze giornate · 8 ore · 14:00–18:00 CET",
    location: "Aula virtuale live (Zoom)",
    language: "IT",
    seatsTotal: 24,
    seatsLeft: 15,
    price: 590,
    earlyBirdPct: 0.1,
    earlyBirdUntil: d(5),
    examIncluded: false,
    image:
      "https://images.pexels.com/photos/3184317/pexels-photo-3184317.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: "Hai già studiato? Due pomeriggi di simulazioni, correzione guidata e strategy per arrivare all'esame senza ansia.",
    description:
      "Uno sprint pensato per chi ha completato un corso Foundation (con noi o altrove) e vuole misurarsi con il formato d'esame: due simulazioni cronometrate, analisi delle domande trabocchetto e tecniche di gestione del tempo.",
    objectives: [
      "Completare due simulazioni d'esame in condizioni reali",
      "Riconoscere gli schemi ricorrenti delle domande iSAQB",
      "Colmare in modo mirato i gap emersi, con piano di ripasso",
    ],
    audience: ["Chi ha già frequentato un corso CPSA-F", "Self-learner che studiano sul curriculum pubblico", "Chi deve riprovare l'esame"],
    modules: [
      { title: "Pomeriggio 1 — Simulazione e diagnosi", hours: 4, topics: ["Simulazione cronometrata n. 1", "Correzione guidata e diagnosi dei gap", "Tecniche di gestione del tempo"] },
      { title: "Pomeriggio 2 — AllTricks e simulazione finale", hours: 4, topics: ["Domande trabocchetto: pattern e contromisure", "Simulazione cronometrata n. 2", "Piano di ripasso personalizzato"] },
    ],
    prerequisites: ["Aver già studiato il curriculum Foundation (corso o auto-studio)"],
    includes: ["Banca dati di 160 domande commentate", "Registrazioni disponibili per 14 giorni"],
  },
  {
    slug: "cpsa-f-prestige-como",
    short: "CPSA-F Prestige · Como",
    title: "CPSA-Foundation® Prestige — Residenziale Lago di Como",
    level: "Foundation",
    format: "prestige",
    status: "waitlist",
    start: d(150),
    end: d(154),
    effort: "5 giornate · 32 ore + sessioni serali",
    location: "Villa Serbellini — Tremezzo (CO)",
    language: "IT",
    seatsTotal: 14,
    seatsLeft: 0,
    price: 3400,
    earlyBirdPct: 0.15,
    earlyBirdUntil: d(60),
    examIncluded: true,
    image:
      "https://images.pexels.com/photos/13829917/pexels-photo-13829917.png?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tagline: "L'edizione più richiesta dell'anno: attualmente al completo, con lista d'attesa aperta.",
    description:
      "Il formato Prestige sul Lago di Como. Edizione al completo: iscrivendoti alla lista d'attesa sarai ricontattato in caso di rinuncia e avrai accesso prioritario alla prossima data.",
    objectives: F_OBJECTIVES,
    audience: F_AUDIENCE,
    modules: F_MODULES,
    prerequisites: F_PREREQUISITES,
    includes: F_INCLUDES,
  },
];

export const nextCourse = () =>
  COURSES.filter((c) => c.status !== "waitlist").sort((a, b) => a.start.getTime() - b.start.getTime())[0];

export const bySlug = (slug: string) => COURSES.find((c) => c.slug === slug);

/* ------------------------------ numeri ---------------------------- */

export const STATS = [
  { value: "740+", label: "professionisti certificati" },
  { value: "98,4%", label: "esame superato al primo tentativo" },
  { value: "4,9/5", label: "valutazione media · 212 recensioni" },
  { value: "13", label: "anni di corsi, dal 2013" },
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
