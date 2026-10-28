// Testi legali di Cube Academy in quattro lingue. Sono scritti sul modello dei testi di romaofficesharing.it
// e adattati ai trattamenti di questo sito: vanno fatti rivedere dal titolare / dal consulente legale prima della pubblicazione.
import type { Lang } from "../i18n";

export const LEGAL_REVISED = { it: "28 ottobre 2026", en: "28 October 2026", fr: "28 octobre 2026", de: "28. Oktober 2026" } satisfies Record<Lang, string>;

type Section = [heading: string, body: string];

export const PRIVACY: Record<Lang, { title: string; note: string; sections: Section[]; revoke: string }> = {
  it: {
    title: "Informativa Privacy",
    note: "Il testo italiano della presente informativa è la versione autorevole.",
    revoke: "Puoi revocare il consenso scrivendo a academy@cubeng.eu.",
    sections: [
      ["1. Titolare del trattamento", "Il Titolare del trattamento è Cube Engineering S.r.l. (Cube Academy), Via Venti Settembre 118, 00187 Roma, contattabile all'indirizzo academy@cubeng.eu, via PEC a cubeng@pec.it e al numero +39 06 92.92.87.80."],
      ["2. Tipologie di dati trattati", "Trattiamo dati identificativi e di contatto (nome, cognome, email, telefono) dei partecipanti e di chi ci scrive; dati di fatturazione (ragione sociale o nome, codice fiscale, partita IVA, codice SDI, PEC, indirizzo); dati dell'ordine e del pagamento (importo, metodo, esito: i dati delle carte sono gestiti direttamente dai gestori dei pagamenti e non transitano dai nostri server); il contenuto delle comunicazioni; dati tecnici di navigazione e preferenze (lingua, scelte sui cookie). Se iscrivi altre persone, conferma di averle informate di questo trattamento."],
      ["3. Finalità e basi giuridiche", "I dati sono trattati per rispondere alle richieste e adottare misure precontrattuali; gestire l'iscrizione, erogare il corso e rilasciare l'attestato di partecipazione (esecuzione del contratto); adempiere obblighi legali, fiscali e contabili, inclusa la fatturazione elettronica; tutelare i diritti di Cube Engineering e prevenire abusi e frodi nei pagamenti (legittimo interesse); inviare comunicazioni su nuove edizioni dei corsi e usare cookie non necessari esclusivamente previo consenso."],
      ["4. Modalità del trattamento e sicurezza", "Il trattamento avviene con strumenti informatici e cartacei, secondo principi di liceità, correttezza, trasparenza, minimizzazione e limitazione della conservazione. Sono adottate misure tecniche e organizzative adeguate, tra cui controllo degli accessi, connessioni cifrate, backup e registrazione degli eventi."],
      ["5. Destinatari e trasferimenti", "I dati possono essere comunicati a personale autorizzato, consulenti (anche fiscali) e ai fornitori che rendono possibile il servizio: hosting (Hostinger), database (Supabase), gestori dei pagamenti online (Stripe, PayPal, SumUp), invio delle email, Zoom per l'erogazione online dei corsi, Google per il caricamento dei caratteri del sito e, solo se autorizzato dal banner cookie, Google Tag Manager per le statistiche; tutti nominati responsabili del trattamento ove richiesto. I dati sono comunicati alle autorità competenti quando previsto dalla legge. Alcuni fornitori (Stripe, PayPal, Zoom, Google) hanno sede anche fuori dallo Spazio Economico Europeo e possono trattare dati altrove: il trasferimento avviene sulla base delle garanzie adottate da ciascuno, come il quadro Data Privacy Framework UE-USA o le Clausole Contrattuali Standard della Commissione Europea."],
      ["6. Periodo di conservazione", "Le richieste di contatto sono conservate fino a 24 mesi; i dati contrattuali, fiscali e di pagamento per 10 anni; i dati per le comunicazioni promozionali fino alla revoca del consenso; le preferenze sui cookie per 6 mesi. Alla scadenza i dati sono cancellati o anonimizzati."],
      ["7. Natura del conferimento", "Il conferimento dei dati contrassegnati come obbligatori è necessario per rispondere o per completare l'iscrizione. Il mancato conferimento impedisce di procedere. Il consenso alle comunicazioni promozionali e ai cookie non necessari è facoltativo e revocabile in ogni momento senza pregiudicare i trattamenti precedenti."],
      ["8. Diritti dell'interessato", "Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità e opposizione, nonché revocare il consenso, scrivendo a academy@cubeng.eu o a cubeng@pec.it. Hai diritto di proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it)."],
      ["9. Aggiornamenti e processo decisionale", "Non utilizziamo processi decisionali esclusivamente automatizzati che producano effetti giuridici. La presente informativa può essere aggiornata; la data dell'ultima revisione è " + LEGAL_REVISED.it + "."],
    ],
  },
  en: {
    title: "Privacy Notice",
    note: "This is a faithful English translation. In case of discrepancy, the Italian original is authoritative.",
    revoke: "You can withdraw consent by emailing academy@cubeng.eu.",
    sections: [
      ["1. Data controller", "The controller is Cube Engineering S.r.l. (Cube Academy), Via Venti Settembre 118, 00187 Rome, Italy, available at academy@cubeng.eu, by certified email at cubeng@pec.it and on +39 06 92.92.87.80."],
      ["2. Categories of data", "We process identification and contact details (first name, last name, email, phone) of participants and of people who write to us; invoicing data (company or personal name, tax code, VAT number, SDI code, PEC, address); order and payment data (amount, method, outcome: card details are handled directly by the payment providers and never pass through our servers); the content of communications; technical browsing data and preferences (language, cookie choices). If you register other people, please confirm you have informed them of this processing."],
      ["3. Purposes and legal bases", "Data is processed to respond to enquiries and take pre-contractual steps; manage registrations, deliver the course and issue the certificate of attendance (performance of a contract); comply with legal, tax and accounting obligations, including electronic invoicing; protect the rights of Cube Engineering and prevent abuse and payment fraud (legitimate interest); and send news about new course editions or use non-essential cookies only with consent."],
      ["4. Processing and security", "Processing uses electronic and paper systems in accordance with lawfulness, fairness, transparency, minimisation and storage limitation. Appropriate safeguards include access controls, encrypted connections, backups and event logging."],
      ["5. Recipients and transfers", "Data may be disclosed to authorised staff, advisers (including tax advisers) and the suppliers that make the service possible: hosting (Hostinger), database (Supabase), online payment processors (Stripe, PayPal, SumUp), email delivery, Zoom for online course delivery, Google for loading the site's fonts and, only if authorised via the cookie banner, Google Tag Manager for analytics; all appointed as processors where required. Data is disclosed to competent authorities when legally required. Some suppliers (Stripe, PayPal, Zoom, Google) are also based outside the European Economic Area and may process data elsewhere: the transfer relies on the safeguards adopted by each, such as the EU-U.S. Data Privacy Framework or the European Commission's Standard Contractual Clauses."],
      ["6. Retention", "Enquiries are retained for up to 24 months; contractual, tax and payment records for 10 years; data for promotional communications until consent is withdrawn; cookie preferences for 6 months. Data is then erased or anonymised."],
      ["7. Requirement to provide data", "Fields marked mandatory are needed to reply or complete the registration. Without them we cannot proceed. Consent to promotional communications and to non-essential cookies is optional and may be withdrawn at any time without affecting prior processing."],
      ["8. Your rights", "You may request access, correction, erasure, restriction, portability and object, or withdraw consent, by emailing academy@cubeng.eu or cubeng@pec.it. You may complain to the Italian Data Protection Authority (www.garanteprivacy.it)."],
      ["9. Updates and automated decisions", "We do not use solely automated decisions producing legal effects. This notice may be updated; last revised " + LEGAL_REVISED.en + "."],
    ],
  },
  fr: {
    title: "Politique de confidentialité",
    note: "Il s'agit d'une traduction fidèle. En cas de divergence, l'original italien fait foi.",
    revoke: "Vous pouvez retirer votre consentement en écrivant à academy@cubeng.eu.",
    sections: [
      ["1. Responsable du traitement", "Le responsable du traitement est Cube Engineering S.r.l. (Cube Academy), Via Venti Settembre 118, 00187 Rome, Italie, joignable à academy@cubeng.eu, par PEC à cubeng@pec.it et au +39 06 92.92.87.80."],
      ["2. Catégories de données", "Nous traitons les données d'identification et de contact (prénom, nom, e-mail, téléphone) des participants et des personnes qui nous écrivent ; les données de facturation (raison sociale ou nom, code fiscal, numéro de TVA, code SDI, PEC, adresse) ; les données de commande et de paiement (montant, moyen, résultat : les données des cartes sont gérées directement par les prestataires de paiement et ne transitent pas par nos serveurs) ; le contenu des échanges ; les données techniques de navigation et les préférences (langue, choix relatifs aux cookies). Si vous inscrivez d'autres personnes, confirmez les avoir informées de ce traitement."],
      ["3. Finalités et bases juridiques", "Les données sont traitées pour répondre aux demandes et prendre des mesures précontractuelles ; gérer l'inscription, dispenser le cours et délivrer l'attestation de participation (exécution du contrat) ; respecter les obligations légales, fiscales et comptables, y compris la facturation électronique ; protéger les droits de Cube Engineering et prévenir les abus et la fraude au paiement (intérêt légitime) ; envoyer des informations sur les nouvelles éditions des cours ou utiliser des cookies non essentiels uniquement avec consentement."],
      ["4. Modalités du traitement et sécurité", "Le traitement s'effectue avec des outils informatiques et papier, dans le respect des principes de licéité, loyauté, transparence, minimisation et limitation de la conservation. Des mesures adaptées sont mises en œuvre, notamment contrôle des accès, connexions chiffrées, sauvegardes et journalisation."],
      ["5. Destinataires et transferts", "Les données peuvent être communiquées au personnel autorisé, aux conseillers (y compris fiscaux) et aux prestataires qui rendent le service possible : hébergement (Hostinger), base de données (Supabase), prestataires de paiement en ligne (Stripe, PayPal, SumUp), envoi d'e-mails, Zoom pour la diffusion en ligne des cours, Google pour le chargement des polices du site et, uniquement si autorisé via le bandeau cookies, Google Tag Manager pour les statistiques ; tous désignés sous-traitants lorsque requis. Les données sont communiquées aux autorités compétentes lorsque la loi l'exige. Certains prestataires (Stripe, PayPal, Zoom, Google) sont aussi établis hors de l'Espace économique européen et peuvent traiter des données ailleurs : le transfert repose sur les garanties adoptées par chacun, comme le cadre de protection des données UE-États-Unis ou les clauses contractuelles types de la Commission européenne."],
      ["6. Durée de conservation", "Les demandes de contact sont conservées jusqu'à 24 mois ; les données contractuelles, fiscales et de paiement 10 ans ; les données pour les communications promotionnelles jusqu'au retrait du consentement ; les préférences relatives aux cookies 6 mois. À l'échéance, les données sont supprimées ou anonymisées."],
      ["7. Caractère obligatoire", "Les champs marqués comme obligatoires sont nécessaires pour répondre ou finaliser l'inscription. Sans eux, nous ne pouvons pas poursuivre. Le consentement aux communications promotionnelles et aux cookies non essentiels est facultatif et peut être retiré à tout moment sans effet sur les traitements antérieurs."],
      ["8. Vos droits", "Vous pouvez demander l'accès, la rectification, l'effacement, la limitation, la portabilité et vous opposer au traitement, ou retirer votre consentement, en écrivant à academy@cubeng.eu ou à cubeng@pec.it. Vous pouvez déposer une réclamation auprès de l'autorité italienne de protection des données (www.garanteprivacy.it)."],
      ["9. Mises à jour et décisions automatisées", "Nous n'utilisons pas de décisions exclusivement automatisées produisant des effets juridiques. Cette politique peut être mise à jour ; dernière révision : " + LEGAL_REVISED.fr + "."],
    ],
  },
  de: {
    title: "Datenschutzerklärung",
    note: "Dies ist eine sinngemäße Übersetzung. Bei Abweichungen gilt das italienische Original.",
    revoke: "Sie können Ihre Einwilligung widerrufen, indem Sie an academy@cubeng.eu schreiben.",
    sections: [
      ["1. Verantwortlicher", "Verantwortlicher ist die Cube Engineering S.r.l. (Cube Academy), Via Venti Settembre 118, 00187 Rom, Italien, erreichbar unter academy@cubeng.eu, per PEC unter cubeng@pec.it und telefonisch unter +39 06 92.92.87.80."],
      ["2. Kategorien von Daten", "Wir verarbeiten Identifikations- und Kontaktdaten (Vorname, Nachname, E-Mail, Telefon) der Teilnehmenden und der Personen, die uns schreiben; Rechnungsdaten (Firmen- oder Personenname, Steuernummer, Umsatzsteuer-Identifikationsnummer, SDI-Code, PEC, Adresse); Bestell- und Zahlungsdaten (Betrag, Zahlungsart, Ergebnis: Kartendaten werden direkt von den Zahlungsanbietern verarbeitet und laufen nicht über unsere Server); den Inhalt der Kommunikation; technische Browserdaten und Einstellungen (Sprache, Cookie-Auswahl). Wenn Sie weitere Personen anmelden, bestätigen Sie bitte, dass Sie diese über die Verarbeitung informiert haben."],
      ["3. Zwecke und Rechtsgrundlagen", "Die Daten werden verarbeitet, um Anfragen zu beantworten und vorvertragliche Maßnahmen zu treffen; die Anmeldung zu verwalten, den Kurs durchzuführen und die Teilnahmebescheinigung auszustellen (Vertragserfüllung); rechtliche, steuerliche und buchhalterische Pflichten einschließlich der elektronischen Rechnungsstellung zu erfüllen; die Rechte von Cube Engineering zu schützen und Missbrauch und Zahlungsbetrug zu verhindern (berechtigtes Interesse); Neuigkeiten zu neuen Kursterminen zu senden oder nicht notwendige Cookies zu verwenden, jeweils nur mit Einwilligung."],
      ["4. Art der Verarbeitung und Sicherheit", "Die Verarbeitung erfolgt mit elektronischen und papierbasierten Mitteln nach den Grundsätzen der Rechtmäßigkeit, Fairness, Transparenz, Datenminimierung und Speicherbegrenzung. Es werden angemessene Maßnahmen getroffen, darunter Zugriffskontrolle, verschlüsselte Verbindungen, Backups und Protokollierung."],
      ["5. Empfänger und Übermittlungen", "Die Daten können an befugtes Personal, Berater (auch Steuerberater) und die Dienstleister weitergegeben werden, die den Service ermöglichen: Hosting (Hostinger), Datenbank (Supabase), Online-Zahlungsanbieter (Stripe, PayPal, SumUp), E-Mail-Versand, Zoom für die Online-Durchführung der Kurse, Google für das Laden der Schriftarten der Website und, nur bei Zustimmung über das Cookie-Banner, Google Tag Manager für Statistiken; soweit erforderlich alle als Auftragsverarbeiter bestellt. Die Daten werden den zuständigen Behörden mitgeteilt, wenn das Gesetz dies vorsieht. Einige Dienstleister (Stripe, PayPal, Zoom, Google) haben ihren Sitz auch außerhalb des Europäischen Wirtschaftsraums und können Daten anderswo verarbeiten: Die Übermittlung stützt sich auf die jeweils getroffenen Garantien, etwa das EU-US Data Privacy Framework oder die Standardvertragsklauseln der Europäischen Kommission."],
      ["6. Speicherdauer", "Kontaktanfragen werden bis zu 24 Monate gespeichert; Vertrags-, Steuer- und Zahlungsdaten 10 Jahre; Daten für Werbekommunikation bis zum Widerruf der Einwilligung; Cookie-Einstellungen 6 Monate. Danach werden die Daten gelöscht oder anonymisiert."],
      ["7. Pflicht zur Bereitstellung", "Als Pflichtfelder markierte Angaben sind erforderlich, um zu antworten oder die Anmeldung abzuschließen. Ohne sie können wir nicht fortfahren. Die Einwilligung in Werbekommunikation und nicht notwendige Cookies ist freiwillig und kann jederzeit widerrufen werden, ohne frühere Verarbeitungen zu berühren."],
      ["8. Ihre Rechte", "Sie können Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch verlangen oder Ihre Einwilligung widerrufen, indem Sie an academy@cubeng.eu oder cubeng@pec.it schreiben. Sie können sich bei der italienischen Datenschutzbehörde beschweren (www.garanteprivacy.it)."],
      ["9. Aktualisierungen und automatisierte Entscheidungen", "Wir treffen keine ausschließlich automatisierten Entscheidungen mit rechtlicher Wirkung. Diese Erklärung kann aktualisiert werden; letzte Überarbeitung: " + LEGAL_REVISED.de + "."],
    ],
  },
};

export const COOKIE: Record<Lang, {
  title: string; whatTitle: string; what: string;
  catTitle: string; headers: [string, string, string]; rows: [string, string, string][];
  inUseTitle: string; inUse: [string, string][];
  manageTitle: string; manage: string; button: string;
}> = {
  it: {
    title: "Cookie Policy",
    whatTitle: "Cosa sono i cookie",
    what: "I cookie sono piccoli file memorizzati dal browser; altre tecnologie simili (come la memoria locale del browser) hanno funzione analoga. Questo sito usa strumenti tecnici necessari al suo funzionamento e, solo con il tuo consenso, categorie analitiche e di marketing. Al momento non sono attivi strumenti analitici o di marketing: se in futuro li attiveremo (ad esempio Google Tag Manager), lo script si caricherà solo dopo il tuo consenso.",
    catTitle: "Categorie e durata",
    headers: ["Categoria", "Finalità", "Durata"],
    rows: [
      ["Necessari", "Lingua scelta e preferenze sul consenso; sicurezza", "Lingua: finché non la cancelli · consenso: 6 mesi"],
      ["Analitici", "Statistiche aggregate, solo previo consenso (non attivi)", "13 mesi"],
      ["Marketing", "Contenuti e campagne, solo previo consenso (non attivi)", "6 mesi"],
    ],
    inUseTitle: "Strumenti attualmente in uso",
    inUse: [
      ["Memoria locale del browser (tecnica)", "cube-academy-lang conserva la lingua scelta; cube_academy_cookie_consent conserva le tue scelte sui cookie (6 mesi). Non sono cookie pubblicitari e non lasciano il tuo browser. L'area riservata agli amministratori usa inoltre la sessione di accesso del servizio di autenticazione."],
      ["Caratteri del sito (Google Fonts)", "I caratteri tipografici sono caricati dai server di Google: Google riceve il tuo indirizzo IP per consegnarli. Non sono usati per profilazione pubblicitaria."],
      ["Pagamenti (Stripe, PayPal, SumUp)", "Quando scegli di pagare online vieni reindirizzato alla pagina sicura del gestore, che imposta i propri cookie secondo le proprie policy. Noi non riceviamo né conserviamo i dati della tua carta."],
      ["Corsi online (Zoom)", "Il collegamento al corso avviene su Zoom, che usa i propri cookie secondo la propria informativa."],
    ],
    manageTitle: "Gestire o revocare il consenso",
    manage: "Usa il pulsante seguente in qualsiasi momento. Puoi anche eliminare i dati del sito dal tuo browser.",
    button: "Impostazioni cookie",
  },
  en: {
    title: "Cookie Policy",
    whatTitle: "What cookies are",
    what: "Cookies are small files stored by your browser; similar technologies (such as the browser's local storage) work in the same way. This site uses technical tools necessary for it to work and, only with your consent, analytics and marketing categories. No analytics or marketing tools are active at the moment: if we enable them in future (for example Google Tag Manager), the script will load only after your consent.",
    catTitle: "Categories and duration",
    headers: ["Category", "Purpose", "Duration"],
    rows: [
      ["Necessary", "Chosen language and consent preferences; security", "Language: until you erase it · consent: 6 months"],
      ["Analytics", "Aggregate metrics, only with consent (not active)", "13 months"],
      ["Marketing", "Content and campaigns, only with consent (not active)", "6 months"],
    ],
    inUseTitle: "Tools currently in use",
    inUse: [
      ["Browser local storage (technical)", "cube-academy-lang keeps your chosen language; cube_academy_cookie_consent keeps your cookie choices (6 months). They are not advertising cookies and never leave your browser. The administrators' area also uses the sign-in session of the authentication service."],
      ["Site fonts (Google Fonts)", "Typefaces are loaded from Google's servers: Google receives your IP address to deliver them. They are not used for advertising profiling."],
      ["Payments (Stripe, PayPal, SumUp)", "When you choose to pay online you are redirected to the provider's secure page, which sets its own cookies under its own policies. We neither receive nor store your card details."],
      ["Online courses (Zoom)", "You join the course on Zoom, which uses its own cookies under its own notice."],
    ],
    manageTitle: "Manage or withdraw consent",
    manage: "Use the button below at any time. You can also erase the site's data in your browser.",
    button: "Cookie settings",
  },
  fr: {
    title: "Politique de cookies",
    whatTitle: "Que sont les cookies",
    what: "Les cookies sont de petits fichiers enregistrés par votre navigateur ; d'autres technologies similaires (comme le stockage local du navigateur) fonctionnent de la même manière. Ce site utilise des outils techniques nécessaires à son fonctionnement et, uniquement avec votre consentement, des catégories analytiques et marketing. Aucun outil analytique ou marketing n'est actif pour le moment : si nous les activons à l'avenir (par exemple Google Tag Manager), le script ne se chargera qu'après votre consentement.",
    catTitle: "Catégories et durée",
    headers: ["Catégorie", "Finalité", "Durée"],
    rows: [
      ["Nécessaires", "Langue choisie et préférences de consentement ; sécurité", "Langue : jusqu'à suppression · consentement : 6 mois"],
      ["Analytiques", "Statistiques agrégées, uniquement avec consentement (non actifs)", "13 mois"],
      ["Marketing", "Contenus et campagnes, uniquement avec consentement (non actifs)", "6 mois"],
    ],
    inUseTitle: "Outils actuellement utilisés",
    inUse: [
      ["Stockage local du navigateur (technique)", "cube-academy-lang conserve la langue choisie ; cube_academy_cookie_consent conserve vos choix sur les cookies (6 mois). Ce ne sont pas des cookies publicitaires et ils ne quittent pas votre navigateur. L'espace réservé aux administrateurs utilise aussi la session de connexion du service d'authentification."],
      ["Polices du site (Google Fonts)", "Les polices sont chargées depuis les serveurs de Google : Google reçoit votre adresse IP pour les livrer. Elles ne servent pas au profilage publicitaire."],
      ["Paiements (Stripe, PayPal, SumUp)", "Lorsque vous choisissez de payer en ligne, vous êtes redirigé vers la page sécurisée du prestataire, qui dépose ses propres cookies selon ses propres politiques. Nous ne recevons ni ne conservons les données de votre carte."],
      ["Cours en ligne (Zoom)", "Vous suivez le cours sur Zoom, qui utilise ses propres cookies selon sa propre politique."],
    ],
    manageTitle: "Gérer ou retirer le consentement",
    manage: "Utilisez le bouton ci-dessous à tout moment. Vous pouvez aussi effacer les données du site dans votre navigateur.",
    button: "Paramètres des cookies",
  },
  de: {
    title: "Cookie-Richtlinie",
    whatTitle: "Was Cookies sind",
    what: "Cookies sind kleine Dateien, die Ihr Browser speichert; ähnliche Technologien (etwa der lokale Speicher des Browsers) funktionieren genauso. Diese Website verwendet technische Werkzeuge, die für ihren Betrieb notwendig sind, und nur mit Ihrer Einwilligung Analyse- und Marketing-Kategorien. Derzeit sind keine Analyse- oder Marketing-Werkzeuge aktiv: Falls wir sie künftig aktivieren (zum Beispiel Google Tag Manager), wird das Skript erst nach Ihrer Einwilligung geladen.",
    catTitle: "Kategorien und Dauer",
    headers: ["Kategorie", "Zweck", "Dauer"],
    rows: [
      ["Notwendig", "Gewählte Sprache und Einwilligungseinstellungen; Sicherheit", "Sprache: bis zum Löschen · Einwilligung: 6 Monate"],
      ["Analyse", "Aggregierte Statistiken, nur mit Einwilligung (nicht aktiv)", "13 Monate"],
      ["Marketing", "Inhalte und Kampagnen, nur mit Einwilligung (nicht aktiv)", "6 Monate"],
    ],
    inUseTitle: "Derzeit verwendete Werkzeuge",
    inUse: [
      ["Lokaler Speicher des Browsers (technisch)", "cube-academy-lang speichert die gewählte Sprache; cube_academy_cookie_consent speichert Ihre Cookie-Auswahl (6 Monate). Es sind keine Werbe-Cookies und sie verlassen Ihren Browser nicht. Der Administratorbereich nutzt zusätzlich die Anmeldesitzung des Authentifizierungsdienstes."],
      ["Schriftarten der Website (Google Fonts)", "Die Schriftarten werden von Servern von Google geladen: Google erhält dazu Ihre IP-Adresse. Sie werden nicht für Werbeprofiling genutzt."],
      ["Zahlungen (Stripe, PayPal, SumUp)", "Wenn Sie online bezahlen, werden Sie auf die sichere Seite des Anbieters weitergeleitet, der nach eigenen Richtlinien eigene Cookies setzt. Wir erhalten und speichern Ihre Kartendaten nicht."],
      ["Online-Kurse (Zoom)", "Sie nehmen über Zoom am Kurs teil, das nach eigener Erklärung eigene Cookies verwendet."],
    ],
    manageTitle: "Einwilligung verwalten oder widerrufen",
    manage: "Nutzen Sie jederzeit die folgende Schaltfläche. Sie können die Daten der Website auch in Ihrem Browser löschen.",
    button: "Cookie-Einstellungen",
  },
};

// Condizioni generali di partecipazione ai corsi. Bozza costruita sulle regole già pubblicate sul sito (rimborso, numero minimo,
// esame non incluso, max 12 partecipanti): va fatta rivedere dal titolare / dal consulente legale prima della pubblicazione.
export const TERMS: Record<Lang, { title: string; note: string; sections: Section[] }> = {
  it: {
    title: "Condizioni generali di partecipazione",
    note: "Il testo italiano delle presenti condizioni è la versione autorevole.",
    sections: [
      ["1. Oggetto", "Le presenti condizioni regolano l'iscrizione ai corsi di formazione CPSA-F (Certified Professional for Software Architecture – Foundation Level, iSAQB®) organizzati da Cube Engineering S.r.l. (Cube Academy), Via Venti Settembre 118, 00187 Roma. I corsi sono tenuti da docenti accreditati iSAQB® con materiale didattico accreditato iSAQB®."],
      ["2. Iscrizione e conferma", "L'iscrizione si perfeziona con l'esito positivo del pagamento (carta, PayPal, SumUp) o con la ricezione del bonifico. Con il bonifico i posti restano riservati per alcuni giorni lavorativi. Ogni edizione ha al massimo 12 partecipanti; l'iscrizione a titolo personale come privato riguarda una sola persona. Chi iscrive altre persone garantisce di essere autorizzato a farlo e di averle informate."],
      ["3. Prezzi, sconti e fatturazione", "I prezzi sono indicati a persona, IVA esclusa; l'IVA è applicata nella misura di legge. Gli sconti (early bird, sconto per i privati, codici sconto) sono indicati nel riepilogo dell'ordine: lo sconto per i privati e i codici sconto non si sommano, vale la combinazione più conveniente per il cliente. Cube Engineering emette fattura elettronica ai dati di fatturazione indicati in fase d'iscrizione, la cui correttezza è responsabilità del cliente."],
      ["4. Pagamento", "Il pagamento avviene con carta (Stripe, SumUp), PayPal o bonifico bancario. I dati delle carte sono gestiti direttamente dai gestori dei pagamenti e non transitano dai nostri server."],
      ["5. Numero minimo di partecipanti e rimborso", "Non appena sarà raggiunto il numero minimo di partecipanti, invieremo la conferma dell'erogazione del corso insieme alle informazioni per la fruizione. Se il numero minimo non è raggiunto, l'importo versato è rimborsato integralmente (se è già stata emessa fattura, emettiamo una nota di credito) oppure, a scelta del cliente, l'iscrizione è spostata a un'altra data."],
      ["6. Modifiche al calendario", "Per cause di forza maggiore o necessità organizzative Cube Academy può modificare date, orari o modalità di erogazione, o sostituire il docente con un altro docente accreditato iSAQB®, dandone tempestiva comunicazione. Se la variazione non è accettabile, il cliente può chiedere il rimborso della quota versata."],
      ["7. Disdette e sostituzioni", "Le richieste di disdetta o di sostituzione del partecipante vanno inviate tramite il modulo di contatto del sito e sono valutate caso per caso."],
      ["8. Esame di certificazione e attestato", "L'esame di certificazione iSAQB® non è incluso nel prezzo: si organizza separatamente con gli enti autorizzati (tassa d'esame attualmente 280 € + IVA, a carico del partecipante). Il corso comprende una simulazione d'esame nell'ultima giornata e, su richiesta, l'attestato di partecipazione Cube Academy. Cube Academy non garantisce il superamento dell'esame."],
      ["9. Materiali e proprietà intellettuale", "I materiali del corso sono riservati ai partecipanti e non possono essere riprodotti, diffusi o ceduti senza autorizzazione. Il nome e i marchi iSAQB® appartengono ai rispettivi titolari e sono usati in base all'accreditamento. Le sessioni online non possono essere registrate senza consenso."],
      ["10. Dati personali", "Il trattamento dei dati personali è descritto nell'Informativa Privacy."],
      ["11. Legge applicabile e foro competente", "Le presenti condizioni sono regolate dalla legge italiana. Per le controversie è competente il foro di Roma, salvo il foro inderogabile del consumatore. Ultima revisione: " + LEGAL_REVISED.it + "."],
    ],
  },
  en: {
    title: "General terms of participation",
    note: "This is a faithful English translation. In case of discrepancy, the Italian original is authoritative.",
    sections: [
      ["1. Subject matter", "These terms govern registration for the CPSA-F training courses (Certified Professional for Software Architecture – Foundation Level, iSAQB®) organised by Cube Engineering S.r.l. (Cube Academy), Via Venti Settembre 118, 00187 Rome, Italy. Courses are taught by iSAQB® accredited trainers using iSAQB® accredited training material."],
      ["2. Registration and confirmation", "Registration is completed when payment succeeds (card, PayPal, SumUp) or when the bank transfer is received. With a bank transfer, seats stay reserved for a few working days. Each edition has at most 12 participants; a personal registration as a private individual covers one person only. Anyone registering other people confirms they are authorised to do so and have informed them."],
      ["3. Prices, discounts and invoicing", "Prices are per person, excluding VAT; VAT is applied as required by law. Discounts (early bird, discount for private individuals, discount codes) are shown in the order summary: the private-individual discount and discount codes are not combined, the most favourable combination for the customer applies. Cube Engineering issues an electronic invoice to the invoicing details given at registration, whose accuracy is the customer's responsibility."],
      ["4. Payment", "Payment is by card (Stripe, SumUp), PayPal or bank transfer. Card details are handled directly by the payment providers and never pass through our servers."],
      ["5. Minimum participants and refund", "As soon as the minimum number of participants is reached, we will send the confirmation that the course will run together with the information needed to attend. If the minimum is not reached, the amount paid is refunded in full (if an invoice has already been issued, we issue a credit note) or, at the customer's choice, the registration is moved to another date."],
      ["6. Changes to the schedule", "For force majeure or organisational needs, Cube Academy may change dates, times or delivery format, or replace the trainer with another iSAQB® accredited trainer, giving prompt notice. If the change is not acceptable, the customer may request a refund of the fee paid."],
      ["7. Cancellations and substitutions", "Requests to cancel or to replace a participant must be sent through the site's contact form and are assessed case by case."],
      ["8. Certification exam and certificate", "The iSAQB® certification exam is not included in the price: it is arranged separately with the authorised bodies (exam fee currently €280 + VAT, paid by the participant). The course includes a mock exam on the last day and, on request, the Cube Academy certificate of attendance. Cube Academy does not guarantee that you will pass the exam."],
      ["9. Materials and intellectual property", "Course materials are reserved for participants and may not be reproduced, distributed or transferred without permission. The iSAQB® name and marks belong to their owners and are used under the accreditation. Online sessions may not be recorded without consent."],
      ["10. Personal data", "The processing of personal data is described in the Privacy Notice."],
      ["11. Governing law and jurisdiction", "These terms are governed by Italian law. The courts of Rome have jurisdiction, subject to the mandatory forum of the consumer. Last revised: " + LEGAL_REVISED.en + "."],
    ],
  },
  fr: {
    title: "Conditions générales de participation",
    note: "Il s'agit d'une traduction fidèle. En cas de divergence, l'original italien fait foi.",
    sections: [
      ["1. Objet", "Les présentes conditions régissent l'inscription aux formations CPSA-F (Certified Professional for Software Architecture – Foundation Level, iSAQB®) organisées par Cube Engineering S.r.l. (Cube Academy), Via Venti Settembre 118, 00187 Rome, Italie. Les cours sont dispensés par des formateurs accrédités iSAQB® avec du matériel pédagogique accrédité iSAQB®."],
      ["2. Inscription et confirmation", "L'inscription est finalisée par la réussite du paiement (carte, PayPal, SumUp) ou par la réception du virement. Avec un virement, les places restent réservées pendant quelques jours ouvrés. Chaque édition compte 12 participants au maximum ; l'inscription à titre personnel en tant que particulier concerne une seule personne. Celui qui inscrit d'autres personnes garantit y être autorisé et les avoir informées."],
      ["3. Prix, remises et facturation", "Les prix sont indiqués par personne, hors TVA ; la TVA est appliquée dans la mesure prévue par la loi. Les remises (early bird, remise pour les particuliers, codes de réduction) figurent dans le récapitulatif de commande : la remise pour les particuliers et les codes de réduction ne se cumulent pas, la combinaison la plus avantageuse pour le client s'applique. Cube Engineering émet une facture électronique aux coordonnées de facturation indiquées lors de l'inscription, dont l'exactitude relève du client."],
      ["4. Paiement", "Le paiement s'effectue par carte (Stripe, SumUp), PayPal ou virement bancaire. Les données des cartes sont gérées directement par les prestataires de paiement et ne transitent pas par nos serveurs."],
      ["5. Nombre minimum de participants et remboursement", "Dès que le nombre minimum de participants est atteint, nous envoyons la confirmation de la tenue du cours avec les informations pour y participer. Si le minimum n'est pas atteint, la somme versée est intégralement remboursée (si une facture a déjà été émise, nous émettons un avoir) ou, au choix du client, l'inscription est reportée à une autre date."],
      ["6. Modifications du calendrier", "En cas de force majeure ou de nécessité organisationnelle, Cube Academy peut modifier les dates, horaires ou modalités de déroulement, ou remplacer le formateur par un autre formateur accrédité iSAQB®, en en informant rapidement les participants. Si le changement n'est pas acceptable, le client peut demander le remboursement de la somme versée."],
      ["7. Annulations et remplacements", "Les demandes d'annulation ou de remplacement d'un participant doivent être envoyées via le formulaire de contact du site et sont examinées au cas par cas."],
      ["8. Examen de certification et attestation", "L'examen de certification iSAQB® n'est pas inclus dans le prix : il s'organise séparément auprès des organismes agréés (frais d'examen actuellement 280 € + TVA, à la charge du participant). Le cours comprend une simulation d'examen le dernier jour et, sur demande, l'attestation de participation Cube Academy. Cube Academy ne garantit pas la réussite à l'examen."],
      ["9. Supports et propriété intellectuelle", "Les supports du cours sont réservés aux participants et ne peuvent être reproduits, diffusés ou cédés sans autorisation. Le nom et les marques iSAQB® appartiennent à leurs titulaires et sont utilisés dans le cadre de l'accréditation. Les sessions en ligne ne peuvent pas être enregistrées sans consentement."],
      ["10. Données personnelles", "Le traitement des données personnelles est décrit dans la Politique de confidentialité."],
      ["11. Droit applicable et juridiction", "Les présentes conditions sont régies par le droit italien. Les tribunaux de Rome sont compétents, sous réserve de la juridiction impérative du consommateur. Dernière révision : " + LEGAL_REVISED.fr + "."],
    ],
  },
  de: {
    title: "Allgemeine Teilnahmebedingungen",
    note: "Dies ist eine sinngemäße Übersetzung. Bei Abweichungen gilt das italienische Original.",
    sections: [
      ["1. Gegenstand", "Diese Bedingungen regeln die Anmeldung zu den CPSA-F-Schulungen (Certified Professional for Software Architecture – Foundation Level, iSAQB®), die von der Cube Engineering S.r.l. (Cube Academy), Via Venti Settembre 118, 00187 Rom, Italien, veranstaltet werden. Die Kurse werden von iSAQB®-akkreditierten Trainern mit iSAQB®-akkreditierten Schulungsunterlagen gehalten."],
      ["2. Anmeldung und Bestätigung", "Die Anmeldung ist abgeschlossen, wenn die Zahlung erfolgreich ist (Karte, PayPal, SumUp) oder die Überweisung eingegangen ist. Bei Überweisung bleiben die Plätze einige Werktage reserviert. Jeder Termin hat höchstens 12 Teilnehmende; die Anmeldung auf eigene Rechnung als Privatperson betrifft nur eine Person. Wer weitere Personen anmeldet, sichert zu, dazu berechtigt zu sein und sie informiert zu haben."],
      ["3. Preise, Rabatte und Rechnungsstellung", "Die Preise gelten pro Person, ohne Mehrwertsteuer; die Mehrwertsteuer wird in gesetzlicher Höhe erhoben. Rabatte (Frühbucher, Rabatt für Privatpersonen, Rabattcodes) werden in der Bestellübersicht angezeigt: Der Rabatt für Privatpersonen und Rabattcodes werden nicht kombiniert, es gilt die für den Kunden günstigste Kombination. Cube Engineering stellt eine E-Rechnung an die bei der Anmeldung angegebenen Rechnungsdaten aus; für deren Richtigkeit ist der Kunde verantwortlich."],
      ["4. Zahlung", "Die Zahlung erfolgt per Karte (Stripe, SumUp), PayPal oder Banküberweisung. Kartendaten werden direkt von den Zahlungsanbietern verarbeitet und laufen nicht über unsere Server."],
      ["5. Mindestteilnehmerzahl und Erstattung", "Sobald die Mindestteilnehmerzahl erreicht ist, senden wir die Bestätigung der Durchführung des Kurses zusammen mit den Informationen zur Teilnahme. Wird die Mindestzahl nicht erreicht, wird der gezahlte Betrag vollständig erstattet (falls bereits eine Rechnung ausgestellt wurde, stellen wir eine Gutschrift aus) oder die Anmeldung wird nach Wahl des Kunden auf einen anderen Termin verschoben."],
      ["6. Änderungen des Kalenders", "Bei höherer Gewalt oder organisatorischer Notwendigkeit kann Cube Academy Termine, Zeiten oder die Durchführungsform ändern oder den Trainer durch einen anderen iSAQB®-akkreditierten Trainer ersetzen und informiert die Teilnehmenden unverzüglich. Ist die Änderung nicht zumutbar, kann der Kunde die Erstattung des gezahlten Betrags verlangen."],
      ["7. Stornierungen und Ersatzteilnehmer", "Anfragen zur Stornierung oder zum Austausch von Teilnehmenden sind über das Kontaktformular der Website zu senden und werden im Einzelfall geprüft."],
      ["8. Zertifizierungsprüfung und Bescheinigung", "Die iSAQB®-Zertifizierungsprüfung ist im Preis nicht enthalten: Sie wird separat bei den zugelassenen Stellen organisiert (Prüfungsgebühr derzeit 280 € + MwSt., zu Lasten der Teilnehmenden). Der Kurs umfasst eine Probeprüfung am letzten Tag und auf Anfrage die Cube-Academy-Teilnahmebescheinigung. Cube Academy garantiert nicht das Bestehen der Prüfung."],
      ["9. Unterlagen und geistiges Eigentum", "Die Kursunterlagen sind den Teilnehmenden vorbehalten und dürfen ohne Genehmigung nicht vervielfältigt, verbreitet oder weitergegeben werden. Name und Marken von iSAQB® gehören den jeweiligen Inhabern und werden im Rahmen der Akkreditierung genutzt. Online-Sitzungen dürfen nicht ohne Einwilligung aufgezeichnet werden."],
      ["10. Personenbezogene Daten", "Die Verarbeitung personenbezogener Daten ist in der Datenschutzerklärung beschrieben."],
      ["11. Anwendbares Recht und Gerichtsstand", "Diese Bedingungen unterliegen italienischem Recht. Zuständig sind die Gerichte in Rom, vorbehaltlich des zwingenden Gerichtsstands des Verbrauchers. Letzte Überarbeitung: " + LEGAL_REVISED.de + "."],
    ],
  },
};
