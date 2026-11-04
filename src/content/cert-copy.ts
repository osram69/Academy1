/**
 * Testi della pagina dedicata alla certificazione iSAQB® CPSA (/certificazione-isaqb), in italiano.
 * Come exam-copy.ts: il sito li traduce con t(), il server (HTML per i crawler) con gli stessi dizionari.
 * Dettagli su livelli e requisiti: solo ciò che iSAQB® e ITA-STQB pubblicano; se cambiano vanno aggiornati qui e in src/i18n/{en,fr,de}.ts.
 */

export const CERT = {
  title: "Certificazione iSAQB® CPSA: cos'è e quali livelli",
  description: "Cos'è la certificazione iSAQB® CPSA per architetti software: i livelli Foundation, Advanced ed Expert, a chi serve e come ottenerla in Italia.",
  h1: "Certificazione iSAQB® CPSA: cos'è, a chi serve e come si ottiene",
  lead: "La CPSA, Certified Professional for Software Architecture, è la certificazione di iSAQB® per chi progetta software. Qui trovi che cos'è, come sono fatti i livelli e da dove si parte.",
  crumb: "Certificazione iSAQB®",
  facts: [
    "Certified Professional for Software Architecture (CPSA)",
    "Tre livelli: Foundation, Advanced, Expert",
    "Si parte dal Foundation, senza prerequisiti per l'esame",
    "Esame online, in Italia tramite ITA-STQB",
  ],
  whatTitle: "Che cos'è iSAQB®",
  whatText:
    "iSAQB®, International Software Architecture Qualification Board, è l'organismo internazionale indipendente che definisce gli standard di formazione, esame e certificazione, tra cui il programma CPSA per chi lavora nell'architettura software. Il programma si basa su curricula di riferimento e su corsi tenuti da training provider accreditati. In Italia l'iscrizione agli esami passa da ITA-STQB; Cube Academy è Training Provider accreditato iSAQB® dal 2024.",
  levelsTitle: "I livelli della certificazione",
  levels: [
    {
      name: "Foundation (CPSA-F)",
      text: "Il punto di partenza: le conoscenze per progettare e documentare architetture di sistemi di piccole e medie dimensioni, dai requisiti di qualità alla valutazione. Per sostenere l'esame non servono prerequisiti. È il livello per cui eroghiamo i corsi.",
    },
    {
      name: "Advanced (CPSA-A)",
      text: "Il livello di specializzazione: richiede la certificazione Foundation, moduli di formazione accreditati e una prova di certificazione con colloquio davanti agli esaminatori iSAQB®.",
    },
    {
      name: "Expert (CPSA-E)",
      text: "Il livello più alto del programma: presuppone la certificazione Advanced.",
    },
  ],
  audienceTitle: "A chi serve",
  limitTitle: "Cosa certifica, e cosa no",
  pathTitle: "Il percorso per ottenere la certificazione Foundation",
  path: [
    "Il corso: 24 ore con docente accreditato iSAQB®, online o in aula a Roma. [Scopri il corso Software Architect](/corso-software-architect).",
    "L'esame: si sostiene a parte, online, presso l'ente di certificazione. [Come funziona l'esame CPSA-F](/esame-cpsa-f).",
    "Il certificato: se superi l'esame lo ricevi in PDF via email, con validità illimitata.",
  ],
  faq: "Domande frequenti sulla certificazione iSAQB®",
};

export const CERT_FAQS: { q: string; a: string }[] = [
  {
    q: "Che cos'è la certificazione iSAQB® CPSA?",
    a: "CPSA sta per Certified Professional for Software Architecture: è il programma di certificazione di iSAQB® per chi lavora nell'architettura software, organizzato in tre livelli, Foundation, Advanced ed Expert.",
  },
  {
    q: "Da quale livello devo partire?",
    a: "Dal Foundation (CPSA-F): per sostenere l'esame non servono prerequisiti. Il livello Advanced richiede la certificazione Foundation, e l'Expert quella Advanced.",
  },
  {
    q: "A cosa serve la certificazione CPSA-F?",
    a: "Attesta le conoscenze di base di architettura software e dà un linguaggio comune per progettare, documentare e valutare architetture. Non garantisce assunzioni, promozioni o il titolo professionale di Software Architect.",
  },
  {
    q: "Cube Academy è un ente accreditato iSAQB®?",
    a: "Cube Academy è Training Provider accreditato iSAQB® dal 2024: eroghiamo i corsi di preparazione, mentre l'esame si sostiene separatamente presso l'ente di certificazione. [Come funziona l'esame](/esame-cpsa-f).",
  },
  {
    q: "Dove trovo i corsi per il livello Foundation?",
    a: "Nel [calendario dei corsi](/corsi) trovi le prossime edizioni online e in aula a Roma, con date, prezzi e iscrizione.",
  },
];
