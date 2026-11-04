/**
 * Testi del corso CPSA-Foundation nella lingua di partenza (italiano), usati da due parti:
 *  - il sito (src/data.ts), che li traduce nel browser con t();
 *  - l'HTML per i crawler (src/lib/seo-content.ts), che li traduce sul server con gli stessi dizionari.
 * Le chiavi di traduzione sono questi stessi testi: modificarne uno richiede di aggiornare src/i18n/{en,fr,de}.ts.
 */

/** Presentazione del corso nelle schede online e in aula. */
export const COURSE_INTRO =
  "Un corso pratico di 24 ore per imparare a prendere decisioni architetturali che restano valide nel tempo: requisiti di qualità, stili architetturali, documentazione e valutazione dei rischi, secondo il curriculum iSAQB® Foundation Level. Ti prepara all'esame CPSA-Foundation, con una simulazione d'esame nell'ultima giornata.";

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

/** `outcome` = ciò che sai fare alla fine del modulo, in una riga. */
export const MODULES: { title: string; outcome: string; topics: string[] }[] = [
  {
    title: "Introduzione all'architettura software",
    outcome: "Il linguaggio comune dell'architettura e le responsabilità dell'architetto.",
    topics: ["Concetti base e terminologia", "Ruolo e responsabilità dell'architetto software"],
  },
  {
    title: "Requisiti e qualità del software",
    outcome: "Come trasformare i requisiti in scenari di qualità e vincoli di progetto.",
    topics: ["Raccolta e gestione dei requisiti architetturali", "Requisiti di qualità e scenari di qualità"],
  },
  {
    title: "Progettazione dell'architettura software",
    outcome: "Stili architetturali, trade-off e decisioni, prima che diventino debito tecnico.",
    topics: [
      "Modelli architetturali e stili (ad esempio Layered Architecture, Microservices, Event-Driven Architecture)",
      "Decisioni architetturali e trade-off",
    ],
  },
  {
    title: "Documentazione e comunicazione",
    outcome: "Come descrivere e comunicare l'architettura a team e stakeholder.",
    topics: ["Tecniche di documentazione dell'architettura", "Comunicazione con stakeholder tecnici e non tecnici"],
  },
  {
    title: "Valutazione delle architetture software",
    outcome: "Come valutare un'architettura rispetto ai requisiti e gestire i rischi.",
    topics: ["Strumenti e tecniche per valutare la qualità dell'architettura", "Analisi dei rischi e mitigazione"],
  },
];

export const INCLUDES = [
  "Corso sincrono con docente accreditato iSAQB® (max 12 partecipanti)",
  "Materiale Cube Academy / iSAQB®",
  "Simulazione d'esame con discussione e correzione (ultima giornata)",
  "Attestato di partecipazione Cube Academy, su richiesta",
];

/**
 * Domande frequenti, nell'ordine in cui le pone chi decide se iscriversi: prima certificazione, esame e a chi è adatto,
 * poi durata e formato, prezzo, infine pagamento, rimborso e gruppi.
 * `links: "exam"` = la risposta rimanda alle pagine ufficiali iSAQB® sull'esame.
 */
export const FAQS_COPY: { q: string; a: string; links?: "exam" }[] = [
  {
    q: "Il corso rilascia la certificazione CPSA-F?",
    a: "No. Il corso ti prepara all'esame CPSA-Foundation, che si sostiene separatamente presso un ente autorizzato iSAQB®. Nell'ultima giornata svolgiamo una simulazione d'esame con discussione e correzione.",
  },
  {
    q: "Quanto costa l'esame e chi lo organizza?",
    a: "La tassa d'esame CPSA-F (280 € + IVA) non è inclusa nel prezzo del corso: la paghi all'ente di certificazione autorizzato iSAQB®, con cui organizzi l'esame in autonomia al termine del corso.",
    links: "exam",
  },
  {
    q: "A chi è adatto il corso? Devo già essere un architetto?",
    a: "No. Servono almeno 18 mesi di esperienza nello sviluppo software, non da architetto: il corso parte dalle basi del ruolo. È pensato per sviluppatori senior, Tech Lead, IT Consultant e Project Manager con focus tecnico. Se hai dubbi sul livello, [scrivici](/contatti?oggetto=info).",
  },
  {
    q: "Che cos'è la certificazione CPSA-F?",
    a: "CPSA-F è il livello Foundation del programma internazionale iSAQB® Certified Professional for Software Architecture. Attesta le conoscenze di base di architettura software e si ottiene superando un esame, separato dal corso. È il primo livello del percorso iSAQB® e il punto di partenza per i livelli avanzati.",
  },
  {
    q: "Quanto dura il corso?",
    a: "Il corso dura 24 ore. Si svolge in tre giornate consecutive oppure nella formula weekend, distribuita su più sabati e domeniche: le date di ogni edizione sono indicate nel calendario.",
  },
  {
    q: "Il corso è online o in aula? In che lingua si svolge?",
    a: "Ogni edizione si svolge online, in aula virtuale live su Zoom, oppure in aula a Roma. Il formato e la lingua di ciascuna edizione sono indicati nella scheda del corso.",
  },
  {
    q: "Quanto costa il corso e ci sono sconti?",
    a: "Il prezzo è indicato a persona, IVA esclusa, nella scheda di ogni edizione e può comprendere uno sconto early bird. Chi si iscrive a titolo personale, senza partita IVA, ha una tariffa dedicata, mostrata nel riepilogo prima del pagamento. Un codice sconto sostituisce l'early bird e non si somma ad altre promozioni.",
  },
  {
    q: "Posso pagare con bonifico e fattura alla mia azienda?",
    a: "Certo. Durante l'iscrizione scegli il soggetto fatturante (privato, libero professionista, azienda italiana o estera) e inserisci P.IVA, codice SDI e PEC.",
  },
  {
    q: "Come funziona la politica di rimborso?",
    a: "Se il corso non viene erogato per mancato raggiungimento del numero minimo di partecipanti, la quota versata è rimborsata (in alternativa puoi scegliere un'altra data). Per altre esigenze, come la sostituzione di un partecipante, usa il [modulo di contatto](/contatti?oggetto=rimborso).",
  },
  {
    q: "Organizzate edizioni dedicate per il nostro team?",
    a: "Per gruppi aziendali puoi contattarci per valutare edizioni dedicate: [scrivici](/contatti?oggetto=gruppi).",
  },
];
