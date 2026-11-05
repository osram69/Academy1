/**
 * Le certificazioni dell'ingegneria del software (architettura, requisiti, test, architettura di impresa, cloud), in italiano.
 * Testi per la pagina "La certificazione" e per la home; il server li traduce con gli stessi dizionari del browser (src/i18n).
 * Fonti: siti ufficiali di iSAQB, IREB, ISTQB, ITA-STQB e The Open Group; se cambiano vanno aggiornati qui e in src/i18n/{en,fr,de}.ts.
 */

export const ECO_LINKS = {
  isaqb: "https://www.isaqb.org/",
  ireb: "https://www.ireb.org/",
  istqb: "https://www.istqb.org/",
  togaf: "https://www.opengroup.org/certifications/togaf-certification-portfolio",
  mouIrebIsaqb: "https://www.ireb.org/en/cooperation/alliances",
  allianceIstqbIreb: "https://istqb.org/istqb-and-ireb-are-forming-an-alliance/",
  mouIstqbIsaqb: "https://istqb.org/istqb-and-isaqb-strengthen-collaboration-in-software-testing-and-software-architecture/",
};

export interface EcoItem {
  id: "isaqb" | "ireb" | "istqb" | "togaf" | "cloud";
  name: string;
  area: string;
  text: string;
  /** Pagina ufficiale da collegare (assente per le certificazioni dei fornitori cloud). */
  url?: string;
  /** Compare anche nella home. */
  home: boolean;
}

export const ECO = {
  crumb: "Altre certificazioni",
  title: "Le certificazioni del software: architettura, requisiti, test",
  homeTitle: "Requisiti, architettura, test: le certificazioni del software",
  lead: "Un progetto software attraversa requisiti, architettura, realizzazione e test, e per ogni fase esiste un ente internazionale di certificazione. iSAQB® è quello dell'architettura software; si affianca a IREB® per i requisiti e a ISTQB® per il testing, e i tre enti collaborano tra loro.",
  items: [
    {
      id: "isaqb",
      name: "iSAQB® CPSA",
      area: "Architettura software",
      text: "Come progettare, documentare e valutare l'architettura di un sistema software. Tre livelli: Foundation, Advanced ed Expert. È la certificazione per cui eroghiamo i corsi.",
      url: ECO_LINKS.isaqb,
      home: true,
    },
    {
      id: "ireb",
      name: "IREB® CPRE",
      area: "Requisiti",
      text: "Come raccogliere, documentare e gestire i requisiti, il punto di partenza di ogni progetto. Il livello Foundation non ha prerequisiti e il certificato non scade.",
      url: ECO_LINKS.ireb,
      home: true,
    },
    {
      id: "istqb",
      name: "ISTQB® CTFL",
      area: "Testing del software",
      text: "Come progettare, eseguire e gestire i test per garantire la qualità del software. Il livello Foundation (CTFL) è il punto di partenza; in Italia il riferimento è ITA-STQB.",
      url: ECO_LINKS.istqb,
      home: true,
    },
    {
      id: "togaf",
      name: "TOGAF®",
      area: "Architettura enterprise",
      text: "Il metodo dell'Open Group per l'architettura di impresa: tiene insieme strategia, processi e sistemi informativi dell'intera organizzazione. Ha livelli Foundation e Practitioner. Non sostituisce iSAQB®, che riguarda l'architettura del singolo sistema software.",
      url: ECO_LINKS.togaf,
      home: true,
    },
    {
      id: "cloud",
      name: "Certificazioni cloud",
      area: "Piattaforme cloud",
      text: "AWS, Microsoft Azure e Google Cloud certificano la progettazione di soluzioni sulle proprie piattaforme (ruoli come Solutions Architect o Cloud Architect). Completano iSAQB® con la conoscenza di un prodotto specifico.",
      home: false,
    },
  ] as EcoItem[],
  collabTitle: "Tre enti, una disciplina integrata",
  collab: [
    `[iSAQB® e IREB® hanno firmato un memorandum d'intesa](${ECO_LINKS.mouIrebIsaqb}) per promuovere requisiti e architettura come discipline complementari.`,
    `[ISTQB® e IREB® hanno stretto un'alleanza](${ECO_LINKS.allianceIstqbIreb}) per allineare la terminologia di testing e requisiti.`,
    `Il 16 giugno 2026 [ISTQB® e iSAQB® hanno firmato un memorandum d'intesa](${ECO_LINKS.mouIstqbIsaqb}) per avvicinare schemi di certificazione, glossari e curricula, guardando all'ingegneria del software come a una disciplina integrata.`,
  ],
  notice: "Cube Academy eroga oggi i corsi di preparazione iSAQB® CPSA-Foundation. Per le altre certificazioni rivolgiti agli enti e ai provider indicati. I marchi citati appartengono ai rispettivi titolari.",
  more: "Scopri tutte le certificazioni →",
  official: "Sito ufficiale",
  ours: "I nostri corsi",
};
