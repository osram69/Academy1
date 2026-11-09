/**
 * Testi della pagina dedicata all'esame CPSA-F (/esame-cpsa-f), in italiano.
 * Come landing-copy.ts: il sito li traduce con t(), il server (HTML per i crawler) con gli stessi dizionari.
 * I dati dell'esame (durata, domande, soglia, costo, modalità) sono quelli pubblicati dall'ente di certificazione ITA-STQB:
 * se cambiano vanno aggiornati qui e in src/i18n/{en,fr,de}.ts.
 */

export const EXAM_URL = "https://isaqb.ita-stqb.org/index.php/it/ita-stqb-isaqb/esami";

export const EXAM = {
  title: "Esame CPSA-F iSAQB®: costo, durata e iscrizione",
  description: "Esame iSAQB® CPSA-F: 75 minuti, 40–50 domande a scelta multipla, 280 € + IVA, online con sorveglianza da remoto. Come iscriversi e come prepararsi.",
  h1: "Esame CPSA-F iSAQB®: come funziona, quanto costa e come prepararsi",
  lead: "L'esame CPSA-Foundation è il passo che trasforma il corso in certificazione: si sostiene a parte, online, presso l'ente di certificazione ITA-STQB. Qui trovi formato, costo, iscrizione e come ti prepariamo.",
  crumb: "Esame CPSA-F",
  facts: [
    "75 minuti (90 se non lo sostieni nella tua madrelingua)",
    "Da 40 a 50 domande a scelta multipla",
    "Si supera con almeno il 60% del punteggio",
    "280 € + IVA, non inclusi nel prezzo del corso",
    "Online, con sorveglianza da remoto in tempo reale",
    "In italiano o in inglese, a tua scelta",
  ],
  stepsTitle: "Come ti iscrivi all'esame",
  steps: [
    `Ti iscrivi tramite il [servizio di prenotazione online di ITA-STQB](${EXAM_URL}) e scegli la lingua dell'esame, italiano o inglese.`,
    "Paghi la quota d'esame (280 € + IVA) con PayPal, carta di credito o bonifico.",
    "Pianifichi l'esame in autonomia, seguendo la guida agli esami online dell'ente.",
    "Sostieni l'esame da remoto, con sorveglianza in tempo reale (Live Remote Proctored).",
    "Se superi l'esame ricevi il certificato in PDF via email; la validità è illimitata.",
  ],
  prepTitle: "Come ti prepara il corso",
  prepText:
    "Il corso di 24 ore copre il curriculum iSAQB® Foundation Level su cui si basa l'esame e, nell'ultima giornata, comprende una simulazione d'esame con discussione e correzione. La tassa d'esame non è inclusa nel prezzo del corso: la paghi all'ente di certificazione quando ti iscrivi.",
  limitTitle: "Cosa certifica, e cosa no",
  source: `Le informazioni sull'esame sono quelle pubblicate dall'ente di certificazione ITA-STQB: verifica sempre le condizioni aggiornate sul [sito dell'ente](${EXAM_URL}).`,
  faq: "Domande frequenti sull'esame CPSA-F",
};

export const EXAM_FAQS: { q: string; a: string }[] = [
  {
    q: "Quanto dura l'esame CPSA-F e com'è fatto?",
    a: "L'esame dura 75 minuti (90 se non lo sostieni nella tua madrelingua) e comprende da 40 a 50 domande a scelta multipla.",
  },
  {
    q: "Qual è il punteggio per superare l'esame?",
    a: "Per superare l'esame serve almeno il 60% del punteggio massimo ottenibile.",
  },
  {
    q: "Come viene valutato l'esame?",
    a: "Le domande valgono da 1 a 3 punti in base alla difficoltà e sono di tre tipi: scelta tra due opzioni, risposta singola e risposta multipla. Per superare l'esame serve almeno il 60% del punteggio totale; secondo il regolamento iSAQB® le risposte errate possono togliere punti, quindi conviene rispondere con attenzione.",
  },
  {
    q: "Posso ripetere l'esame se non lo supero?",
    a: "Secondo il regolamento d'esame iSAQB®, l'esame si può ripetere due volte senza periodo di attesa; dopo il terzo esito negativo occorre aspettare un anno. Le condizioni possono cambiare: verifica quelle aggiornate sul sito dell'ente di certificazione.",
  },
  {
    q: "L'esame si fa online o in presenza?",
    a: "Online, in modalità Live Remote Proctored, cioè sorvegliato da remoto in tempo reale. Al momento dell'iscrizione scegli se sostenerlo in italiano o in inglese.",
  },
  {
    q: "Quanto costa l'esame CPSA-F?",
    a: "280 € + IVA, da pagare all'ente di certificazione con PayPal, carta di credito o bonifico. Non sono inclusi nel prezzo del corso.",
  },
  {
    q: "Posso sostenere l'esame senza fare il corso?",
    a: "Il corso resta il modo più diretto per prepararti: copre il curriculum e nell'ultima giornata include una simulazione d'esame.",
  },
  {
    q: "Il certificato CPSA-F scade?",
    a: "No: secondo l'ente di certificazione la validità è illimitata. Ricevi il certificato in PDF via email.",
  },
];
