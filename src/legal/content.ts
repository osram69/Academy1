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
