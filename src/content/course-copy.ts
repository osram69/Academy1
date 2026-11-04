/**
 * Testi del corso CPSA-Foundation nella lingua di partenza (italiano), usati da due parti:
 *  - il sito (src/data.ts), che li traduce nel browser con t();
 *  - l'HTML per i crawler (src/lib/seo-content.ts), che li traduce sul server con gli stessi dizionari.
 * Le chiavi di traduzione sono questi stessi testi: modificarne uno richiede di aggiornare src/i18n/{en,fr,de}.ts.
 */

export const OBJECTIVES = [
  "Comprendere i concetti fondamentali e la terminologia dell'architettura software",
  "Analizzare e definire i requisiti architetturali, inclusi i requisiti di qualità",
  "Applicare metodologie e strumenti per la progettazione e documentazione dell'architettura software",
  "Valutare diverse soluzioni architetturali rispetto ai requisiti e ai vincoli aziendali e tecnici",
  "Collaborare efficacemente con team multidisciplinari e stakeholder",
];

export const AUDIENCE = [
  "Software Architect",
  "Sviluppatori senior e Lead Developer",
  "Project Manager con focus tecnico",
  "IT Consultant e Technical Leader",
  "Esperti di requisiti e ingegneri del software",
];

export const PREREQUISITES = [
  "Almeno 18 mesi di esperienza pratica nello sviluppo di software, acquisita programmando vari progetti o sistemi al di fuori dell'istruzione",
  "Conoscenza ed esperienza pratica in almeno un linguaggio di programmazione, preferibilmente ad oggetti",
  "Nozioni di base di UML (diagrammi di classe, di pacchetto, di componente e di sequenza) e loro relazione con il codice sorgente",
  "Esperienza pratica nella documentazione tecnica",
];

export const MODULES: { title: string; topics: string[] }[] = [
  {
    title: "Introduzione all'architettura software",
    topics: ["Concetti base e terminologia", "Ruolo e responsabilità dell'architetto software"],
  },
  {
    title: "Requisiti e qualità del software",
    topics: ["Raccolta e gestione dei requisiti architetturali", "Requisiti di qualità e scenari di qualità"],
  },
  {
    title: "Progettazione dell'architettura software",
    topics: [
      "Modelli architetturali e stili (ad esempio Layered Architecture, Microservices, Event-Driven Architecture)",
      "Decisioni architetturali e trade-off",
    ],
  },
  {
    title: "Documentazione e comunicazione",
    topics: ["Tecniche di documentazione dell'architettura", "Comunicazione con stakeholder tecnici e non tecnici"],
  },
  {
    title: "Valutazione delle architetture software",
    topics: ["Strumenti e tecniche per valutare la qualità dell'architettura", "Analisi dei rischi e mitigazione"],
  },
];

export const INCLUDES = [
  "Corso sincrono con docente accreditato iSAQB® (max 12 partecipanti)",
  "Materiale Cube Academy / iSAQB®",
  "Simulazione d'esame con discussione e correzione (ultima giornata)",
  "Attestato di partecipazione Cube Academy, su richiesta",
];

/** `inSearch: false` = la domanda non va nell'HTML per i crawler (informazioni non ancora definitive). */
export const FAQS_COPY: { q: string; a: string; inSearch?: boolean }[] = [
  {
    q: "L'esame di certificazione è incluso nel prezzo?",
    a: "No. La tassa d'esame CPSA-F (280 € + IVA) non è inclusa nel prezzo del corso e si paga separatamente all'ente di certificazione autorizzato iSAQB®, con cui organizzi l'esame in autonomia al termine del corso. Durante l'ultima giornata svolgiamo una simulazione d'esame con discussione e correzione.",
  },
  {
    q: "Posso pagare con bonifico e fattura alla mia azienda?",
    a: "Certo. Durante l'iscrizione scegli il soggetto fatturante (privato, libero professionista, azienda italiana o estera) e inserisci P.IVA, codice SDI e PEC. ",
  },
  {
    q: "Come funziona la politica di rimborso?",
    a: "Se il corso non viene erogato per mancato raggiungimento del numero minimo di partecipanti, la quota versata è rimborsata (in alternativa puoi scegliere un'altra data). Per altre esigenze, come la sostituzione di un partecipante, usa il [modulo di contatto](/contatti?oggetto=rimborso).",
  },
  {
    q: "Cosa sono i corsi Prestige residenziali?",
    a: "I corsi residenziali durano 4 giorni e comprendono albergo e mezza pensione, nelle più belle città italiane. Le informazioni arriveranno presto: [scrivici](/contatti?oggetto=prestige) per essere avvisato.",
    inSearch: false,
  },
  {
    q: "Serve esperienza da architetto per iscriversi?",
    a: "No: servono almeno 18 mesi di esperienza in sviluppo software. Il corso Foundation è pensato per costruire il metodo, parte dalle basi del ruolo. Se hai dubbi sul livello, [scrivici](/contatti?oggetto=info).",
  },
  {
    q: "Organizzate edizioni dedicate per il nostro team?",
    a: "Per gruppi aziendali puoi contattarci per valutare edizioni dedicate: [scrivici](/contatti?oggetto=gruppi).",
  },
];
