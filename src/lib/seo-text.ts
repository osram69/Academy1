/** Testi dei metadati e del contenuto per i crawler, nelle quattro lingue del sito. Usati solo sul server (page-seo.ts). */

export type L = "it" | "en" | "fr" | "de";
export const LANG_CODES: L[] = ["it", "en", "fr", "de"];
export const OG_LOCALE: Record<L, string> = { it: "it_IT", en: "en_GB", fr: "fr_FR", de: "de_DE" };
export const LOCALE: Record<L, string> = { it: "it-IT", en: "en-GB", fr: "fr-FR", de: "de-DE" };

const r = (it: string, en: string, fr: string, de: string): Record<L, string> => ({ it, en, fr, de });

const X = {
  home: r("Home", "Home", "Accueil", "Startseite"),
  homeTitle: r(
    "Cube Academy — Certificazione iSAQB® CPSA-F",
    "Cube Academy — iSAQB® CPSA-F Certification Courses",
    "Cube Academy — Certification iSAQB® CPSA-F",
    "Cube Academy — iSAQB® CPSA-F Zertifizierung"
  ),
  homeH1: r(
    "Cube Academy — Corsi di certificazione iSAQB® CPSA-F",
    "Cube Academy — iSAQB® CPSA-F certification courses",
    "Cube Academy — Formations de certification iSAQB® CPSA-F",
    "Cube Academy — iSAQB® CPSA-F Zertifizierungskurse"
  ),
  homeDesc: r(
    "Cube Academy — Training Provider accreditato iSAQB® dal 2024. Corsi CPSA-Foundation online e in aula a Roma.",
    "Cube Academy — accredited iSAQB® Training Provider since 2024. CPSA-Foundation courses online and in the classroom in Rome.",
    "Cube Academy — Training Provider accrédité iSAQB® depuis 2024. Formations CPSA-Foundation en ligne et en présentiel à Rome.",
    "Cube Academy — seit 2024 akkreditierter iSAQB® Training Provider. CPSA-Foundation-Kurse online und in Präsenz in Rom."
  ),
  homeIntro: r(
    "Cube Academy è Training Provider accreditato iSAQB® dal 2024. Corsi CPSA-Foundation online e in aula a Roma per diventare architetto del software certificato, con docenti accreditati e gruppi fino a 12 partecipanti.",
    "Cube Academy has been an accredited iSAQB® Training Provider since 2024. CPSA-Foundation courses online and in the classroom in Rome to become a certified software architect, with accredited trainers and groups of up to 12 participants.",
    "Cube Academy est Training Provider accrédité iSAQB® depuis 2024. Formations CPSA-Foundation en ligne et en présentiel à Rome pour devenir architecte logiciel certifié, avec des formateurs accrédités et des groupes de 12 participants maximum.",
    "Cube Academy ist seit 2024 akkreditierter iSAQB® Training Provider. CPSA-Foundation-Kurse online und in Präsenz in Rom, um zertifizierter Softwarearchitekt zu werden – mit akkreditierten Trainern und Gruppen von bis zu 12 Teilnehmern."
  ),
  nextEditions: r(
    "Prossime edizioni dei corsi iSAQB® CPSA-F",
    "Upcoming iSAQB® CPSA-F course dates",
    "Prochaines sessions des formations iSAQB® CPSA-F",
    "Nächste Termine der iSAQB® CPSA-F-Kurse"
  ),
  catalogLink: r("Catalogo corsi iSAQB® CPSA-F", "iSAQB® CPSA-F course catalogue", "Catalogue des formations iSAQB® CPSA-F", "Kurskatalog iSAQB® CPSA-F"),
  catalogCrumb: r("Catalogo corsi", "Course catalogue", "Catalogue des formations", "Kurskatalog"),
  catalogTitle: r(
    "Catalogo corsi iSAQB® CPSA-F 2026 — date e prezzi",
    "iSAQB® CPSA-F course catalogue 2026 — dates and prices",
    "Catalogue des formations iSAQB® CPSA-F 2026 — dates et tarifs",
    "Kurskatalog iSAQB® CPSA-F 2026 — Termine und Preise"
  ),
  catalogDesc: r(
    "Calendario 2026 dei corsi iSAQB® CPSA-F Foundation: edizioni online e in aula a Roma, date, prezzi e iscrizione. Docenti accreditati, gruppi fino a 12 partecipanti.",
    "2026 calendar of iSAQB® CPSA-F Foundation courses: online and classroom editions in Rome, dates, prices and enrolment. Accredited trainers, groups of up to 12 participants.",
    "Calendrier 2026 des formations iSAQB® CPSA-F Foundation : sessions en ligne et en présentiel à Rome, dates, tarifs et inscription. Formateurs accrédités, groupes de 12 participants maximum.",
    "Kalender 2026 der iSAQB® CPSA-F Foundation-Kurse: Online- und Präsenztermine in Rom, Termine, Preise und Anmeldung. Akkreditierte Trainer, Gruppen bis 12 Teilnehmer."
  ),
  courseFallback: r("Corso iSAQB® CPSA-F", "iSAQB® CPSA-F course", "Formation iSAQB® CPSA-F", "iSAQB® CPSA-F Kurs"),
  courseKind: r("Corso iSAQB® CPSA Foundation Level", "iSAQB® CPSA Foundation Level course", "Formation iSAQB® CPSA Foundation Level", "iSAQB® CPSA Foundation Level Kurs"),
  modeOnline: r("online (aula virtuale live)", "online (live virtual classroom)", "en ligne (classe virtuelle en direct)", "online (virtueller Live-Klassenraum)"),
  modeResidential: r("residenziale", "residential", "résidentielle", "residential"),
  modeClassroom: r("in aula a {loc}", "in the classroom in {loc}", "en présentiel à {loc}", "in Präsenz in {loc}"),
  priceFrom: r("Da € {p} + IVA.", "From € {p} + VAT.", "À partir de {p} € + TVA.", "Ab {p} € zzgl. MwSt."),
  courseTail: r(
    "Docente accreditato iSAQB®, gruppi fino a 12 partecipanti, Cube Academy Training Provider accreditato.",
    "iSAQB®-accredited trainer, groups of up to 12 participants, Cube Academy accredited Training Provider.",
    "Formateur accrédité iSAQB®, groupes de 12 participants maximum, Cube Academy Training Provider accrédité.",
    "iSAQB®-akkreditierter Trainer, Gruppen bis 12 Teilnehmer, Cube Academy akkreditierter Training Provider."
  ),
  schedule: r("Orario: {s}.", "Schedule: {s}.", "Horaires : {s}.", "Zeiten: {s}."),
  enroll: r("Iscriviti a questa edizione", "Enrol in this edition", "S'inscrire à cette session", "Für diesen Termin anmelden"),
  instructor: r("Docente accreditato iSAQB®", "iSAQB®-accredited trainer", "Formateur accrédité iSAQB®", "iSAQB®-akkreditierter Trainer"),
  events: r("Eventi", "Events", "Événements", "Veranstaltungen"),
  eventsTitle: r(
    "Eventi iSAQB® e architettura software",
    "iSAQB® events and software architecture",
    "Événements iSAQB® et architecture logicielle",
    "iSAQB®-Veranstaltungen und Softwarearchitektur"
  ),
  eventsDesc: r(
    "Gli appuntamenti di Cube Academy e della community iSAQB®: conferenze, forum e incontri sull'architettura del software.",
    "Events by Cube Academy and the iSAQB® community: conferences, forums and meetups on software architecture.",
    "Les rendez-vous de Cube Academy et de la communauté iSAQB® : conférences, forums et rencontres sur l'architecture logicielle.",
    "Termine von Cube Academy und der iSAQB®-Community: Konferenzen, Foren und Treffen zur Softwarearchitektur."
  ),
  allEvents: r("Tutti gli eventi", "All events", "Tous les événements", "Alle Veranstaltungen"),
  eventFallback: r("Evento", "Event", "Événement", "Veranstaltung"),
  contacts: r("Contatti", "Contact", "Contact", "Kontakt"),
  contactsDesc: r(
    "Contatta Cube Academy per informazioni su corsi iSAQB® CPSA-F, liste d'attesa, edizioni dedicate per aziende e team. Sede a Roma.",
    "Contact Cube Academy for information on iSAQB® CPSA-F courses, waiting lists and dedicated editions for companies and teams. Based in Rome.",
    "Contactez Cube Academy pour des informations sur les formations iSAQB® CPSA-F, les listes d'attente et les sessions dédiées aux entreprises et aux équipes. Siège à Rome.",
    "Kontaktieren Sie Cube Academy für Informationen zu iSAQB® CPSA-F-Kursen, Wartelisten und Inhouse-Terminen für Unternehmen und Teams. Sitz in Rom."
  ),
  privacy: r("Informativa privacy", "Privacy notice", "Politique de confidentialité", "Datenschutzerklärung"),
  privacyDesc: r(
    "Informativa sul trattamento dei dati personali di Cube Academy, Cube Engineering S.r.l.",
    "Privacy notice on the processing of personal data by Cube Academy, Cube Engineering S.r.l.",
    "Politique de confidentialité sur le traitement des données personnelles de Cube Academy, Cube Engineering S.r.l.",
    "Datenschutzerklärung zur Verarbeitung personenbezogener Daten durch Cube Academy, Cube Engineering S.r.l."
  ),
  terms: r("Condizioni generali", "General terms", "Conditions générales", "Allgemeine Bedingungen"),
  termsTitle: r("Condizioni generali di vendita", "General terms and conditions of sale", "Conditions générales de vente", "Allgemeine Geschäftsbedingungen"),
  termsDesc: r(
    "Condizioni generali di iscrizione ai corsi di Cube Academy: pagamenti, rimborsi, annullamento e modalità di erogazione.",
    "General terms for enrolling in Cube Academy courses: payments, refunds, cancellation and delivery.",
    "Conditions générales d'inscription aux formations Cube Academy : paiements, remboursements, annulation et modalités de réalisation.",
    "Allgemeine Bedingungen für die Anmeldung zu den Kursen von Cube Academy: Zahlung, Erstattung, Absage und Durchführung."
  ),
  cookies: r("Cookie policy", "Cookie policy", "Politique relative aux cookies", "Cookie-Richtlinie"),
  cookiesDesc: r(
    "Informazioni sui cookie utilizzati da Cube Academy e su come gestire le preferenze.",
    "Information on the cookies used by Cube Academy and how to manage your preferences.",
    "Informations sur les cookies utilisés par Cube Academy et sur la gestion des préférences.",
    "Informationen zu den von Cube Academy verwendeten Cookies und zur Verwaltung Ihrer Einstellungen."
  ),
  enrollment: r("Iscrizione", "Enrolment", "Inscription", "Anmeldung"),
  outcome: r("Esito dell'iscrizione", "Enrolment outcome", "Résultat de l'inscription", "Ergebnis der Anmeldung"),
};

export type TextKey = keyof typeof X;

/** Testo nella lingua richiesta; {nome} nei segnaposto si sostituisce con i valori passati. */
export function tx(key: TextKey, l: L, vars?: Record<string, string | number>): string {
  let out = X[key][l];
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}
