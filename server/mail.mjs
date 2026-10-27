// Email di iscrizione (stesse regole del plugin WordPress "Cubeng iSAQB Group Registration"):
//  - conferma ai partecipanti: subito per il bonifico (con le coordinate), a pagamento riuscito per le carte/PayPal
//  - copia della conferma a MAIL_STAFF_CC e riepilogo interno completo a MAIL_STAFF_TO
// SMTP: stesse variabili di romaofficesharing (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_FROM_NAME).
import nodemailer from "nodemailer";
import { bankDetails } from "./payments.mjs";

export const mailMissing = () => ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter((n) => !process.env[n]);
export const mailConfigured = () => mailMissing().length === 0;

const staffTo = () => process.env.MAIL_STAFF_TO || process.env.ADMIN_EMAIL || "academy@cubeng.eu";
const staffCc = () => (process.env.MAIL_STAFF_CC ?? "registrazioni@cubeng.eu").trim();

let transport;
function getTransport() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 465);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST, port, secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transport;
}

async function send({ to, subject, html, text, replyTo }) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  await getTransport().sendMail({ from: `"${process.env.MAIL_FROM_NAME || "Cube Academy"}" <${from}>`, to, subject, html, text, replyTo });
}

const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const LOCALES = { it: "it-IT", en: "en-GB", fr: "fr-FR", de: "de-DE" };

/* ------------------------------ testi ------------------------------ */

const TEXTS = {
  it: {
    subject: "Conferma registrazione corso CPSA-F{date} - Cube Academy", on: " del {d}",
    greeting: "Gentile {name},",
    intro: "Riguardo l'iscrizione al corso Certified Professional for Software Architecture – CPSA-F.",
    thanksPaid: "La ringraziamo per l'iscrizione e per il pagamento.", thanksBank: "La ringraziamo per l'iscrizione. Restiamo in attesa del pagamento.",
    minInfo: "Non appena sarà raggiunto il numero minimo di partecipanti, Le invieremo la conferma dell'erogazione del corso insieme a tutte le informazioni necessarie per la fruizione.",
    refundInfo: "Se il numero minimo non dovesse essere raggiunto, provvederemo a rimborsare integralmente l'importo versato. Qualora fosse stata già emessa fattura, emetteremo una Nota di Credito.",
    nextTitle: "Passaggi successivi",
    stepsPaid: ["Alcuni giorni prima del corso, verrà inviata una email con le informazioni riguardanti le modalità di erogazione del corso.", "Cube Engineering emetterà la fattura elettronica ai dati di fatturazione indicati."],
    stepsBank: ["Effettua il bonifico con le coordinate riportate sotto, indicando la causale.", "I posti restano riservati per alcuni giorni lavorativi: invia la distinta a {staff} per accelerare la conferma.", "Riceverai la conferma definitiva dopo la verifica del pagamento."],
    summary: "Riepilogo iscrizione",
    order: "Riferimento ordine", course: "Corso", dates: "Date", schedule: "Calendario", place: "Luogo / modalità", method: "Metodo di pagamento",
    fin: "Riepilogo economico", net: "Quota imponibile", discount: "Sconto applicato", vat: "IVA (22%)", total: "Totale",
    participants: "Partecipanti", billing: "Dati di fatturazione",
    bankTitle: "Coordinate per il bonifico", holder: "Intestatario", iban: "IBAN", bank: "Banca", reason: "Causale",
    exam: "L'esame di certificazione iSAQB® non è incluso nel prezzo: si organizza a parte con gli enti autorizzati (280 € + IVA).",
    closing: "Per qualsiasi necessità puoi rispondere a questa email.", signature: "Cordiali saluti,",
    test: "Iscrizione di PROVA (sandbox): nessun addebito reale.", methods: { stripe: "Carta (Stripe)", paypal: "PayPal", sumup: "Carta (SumUp)", bonifico: "Bonifico bancario" },
  },
  en: {
    subject: "Course registration confirmed{date} - Cube Academy", on: " for {d}",
    greeting: "Dear {name},",
    intro: "Regarding your registration for the Certified Professional for Software Architecture – CPSA-F course.",
    thanksPaid: "Thank you for registering and for your payment.", thanksBank: "Thank you for registering. We are waiting for your payment.",
    minInfo: "As soon as the minimum number of participants is reached, we will send you the confirmation that the course will run, together with all the information you need to attend.",
    refundInfo: "If the minimum number is not reached, we will refund the full amount paid. If an invoice has already been issued, we will issue a credit note.",
    nextTitle: "Next steps",
    stepsPaid: ["A few days before the course, we will send an email with the information about how the course will be delivered.", "Cube Engineering will issue the e-invoice to the invoicing details provided."],
    stepsBank: ["Make the bank transfer using the details below, quoting the payment reference.", "Seats stay reserved for a few working days: send the transfer receipt to {staff} to speed up confirmation.", "You will receive the final confirmation after the payment is verified."],
    summary: "Registration summary",
    order: "Order reference", course: "Course", dates: "Dates", schedule: "Schedule", place: "Venue / format", method: "Payment method",
    fin: "Cost summary", net: "Taxable amount", discount: "Discount applied", vat: "VAT (22%)", total: "Total",
    participants: "Participants", billing: "Invoicing details",
    bankTitle: "Bank transfer details", holder: "Account holder", iban: "IBAN", bank: "Bank", reason: "Payment reference",
    exam: "The iSAQB® certification exam is not included in the price: it is arranged separately with the authorised bodies (€280 + VAT).",
    closing: "If you need anything, just reply to this email.", signature: "Kind regards,",
    test: "TEST registration (sandbox): no real charge.", methods: { stripe: "Card (Stripe)", paypal: "PayPal", sumup: "Card (SumUp)", bonifico: "Bank transfer" },
  },
  fr: {
    subject: "Confirmation d'inscription au cours CPSA-F{date} - Cube Academy", on: " du {d}",
    greeting: "Bonjour {name},",
    intro: "Concernant votre inscription au cours Certified Professional for Software Architecture – CPSA-F.",
    thanksPaid: "Nous vous remercions de votre inscription et de votre paiement.", thanksBank: "Nous vous remercions de votre inscription. Nous restons dans l'attente du paiement.",
    minInfo: "Dès que le nombre minimum de participants sera atteint, nous vous enverrons la confirmation de la tenue du cours, avec toutes les informations nécessaires pour y participer.",
    refundInfo: "Si le nombre minimum n'est pas atteint, nous rembourserons intégralement la somme versée. Si une facture a déjà été émise, nous émettrons un avoir.",
    nextTitle: "Prochaines étapes",
    stepsPaid: ["Quelques jours avant le cours, nous enverrons un e-mail avec les informations sur les modalités de déroulement du cours.", "Cube Engineering émettra la facture électronique aux coordonnées de facturation indiquées."],
    stepsBank: ["Effectuez le virement avec les coordonnées ci-dessous, en indiquant le libellé.", "Les places restent réservées pendant quelques jours ouvrés : envoyez le justificatif à {staff} pour accélérer la confirmation.", "Vous recevrez la confirmation définitive après vérification du paiement."],
    summary: "Récapitulatif d'inscription",
    order: "Référence de commande", course: "Cours", dates: "Dates", schedule: "Calendrier", place: "Lieu / format", method: "Moyen de paiement",
    fin: "Récapitulatif financier", net: "Base imposable", discount: "Remise appliquée", vat: "TVA (22 %)", total: "Total",
    participants: "Participants", billing: "Données de facturation",
    bankTitle: "Coordonnées du virement", holder: "Titulaire du compte", iban: "IBAN", bank: "Banque", reason: "Libellé",
    exam: "L'examen de certification iSAQB® n'est pas inclus dans le prix : il s'organise séparément auprès des organismes agréés (280 € + TVA).",
    closing: "Pour toute demande, répondez simplement à cet e-mail.", signature: "Cordialement,",
    test: "Inscription de TEST (sandbox) : aucun débit réel.", methods: { stripe: "Carte (Stripe)", paypal: "PayPal", sumup: "Carte (SumUp)", bonifico: "Virement bancaire" },
  },
  de: {
    subject: "Anmeldebestätigung für den CPSA-F-Kurs{date} - Cube Academy", on: " am {d}",
    greeting: "Guten Tag {name},",
    intro: "Zu Ihrer Anmeldung zum Kurs Certified Professional for Software Architecture – CPSA-F.",
    thanksPaid: "Wir danken Ihnen für Ihre Anmeldung und Ihre Zahlung.", thanksBank: "Wir danken Ihnen für Ihre Anmeldung. Wir warten auf Ihre Zahlung.",
    minInfo: "Sobald die Mindestteilnehmerzahl erreicht ist, senden wir Ihnen die Bestätigung der Durchführung des Kurses zusammen mit allen Informationen für die Teilnahme.",
    refundInfo: "Wird die Mindestteilnehmerzahl nicht erreicht, erstatten wir den gezahlten Betrag vollständig. Falls bereits eine Rechnung ausgestellt wurde, stellen wir eine Gutschrift aus.",
    nextTitle: "Nächste Schritte",
    stepsPaid: ["Einige Tage vor dem Kurs senden wir eine E-Mail mit den Informationen zur Durchführung des Kurses.", "Cube Engineering stellt die E-Rechnung an die angegebenen Rechnungsdaten aus."],
    stepsBank: ["Überweisen Sie den Betrag mit den untenstehenden Daten und geben Sie den Verwendungszweck an.", "Die Plätze bleiben einige Werktage reserviert: Senden Sie den Überweisungsbeleg an {staff}, um die Bestätigung zu beschleunigen.", "Die endgültige Bestätigung erhalten Sie nach Prüfung der Zahlung."],
    summary: "Anmeldeübersicht",
    order: "Bestellreferenz", course: "Kurs", dates: "Termine", schedule: "Ablauf", place: "Ort / Format", method: "Zahlungsart",
    fin: "Kostenübersicht", net: "Nettobetrag", discount: "Gewährter Rabatt", vat: "MwSt. (22 %)", total: "Gesamt",
    participants: "Teilnehmende", billing: "Rechnungsdaten",
    bankTitle: "Überweisungsdaten", holder: "Kontoinhaber", iban: "IBAN", bank: "Bank", reason: "Verwendungszweck",
    exam: "Die iSAQB®-Zertifizierungsprüfung ist im Preis nicht enthalten: Sie wird separat bei den zugelassenen Stellen organisiert (280 € + MwSt.).",
    closing: "Bei Fragen antworten Sie einfach auf diese E-Mail.", signature: "Mit freundlichen Grüßen",
    test: "TEST-Anmeldung (Sandbox): keine echte Abbuchung.", methods: { stripe: "Karte (Stripe)", paypal: "PayPal", sumup: "Karte (SumUp)", bonifico: "Banküberweisung" },
  },
};

/* --------------------------- composizione -------------------------- */

const eur = (cents, locale) => (cents / 100).toLocaleString(locale, { style: "currency", currency: "EUR" });
const plainTitle = (t) => String(t || "CPSA-F").replace(/&reg;/g, "®").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

function dateRange(course, locale) {
  const a = course.data_inizio ? new Date(`${course.data_inizio}T12:00:00`) : null;
  const b = course.data_fine ? new Date(`${course.data_fine}T12:00:00`) : a;
  if (!a) return "";
  const f = (d, o) => d.toLocaleDateString(locale, o);
  if (+a === +b) return f(a, { day: "numeric", month: "long", year: "numeric" });
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  const start = sameMonth ? f(a, { day: "numeric" }) : f(a, { day: "numeric", month: "long" });
  return `${start} – ${f(b, { day: "numeric", month: "long", year: "numeric" })}`;
}

const row = (label, value) => (value === "" || value == null ? "" : `<tr><th align="left" style="padding:6px 10px;border:1px solid #e5e5e5;background:#f7f7f7;width:40%">${esc(label)}</th><td style="padding:6px 10px;border:1px solid #e5e5e5">${esc(value)}</td></tr>`);
const table = (rows) => `<table cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;font-size:13px;margin:6px 0 16px">${rows.join("")}</table>`;

export function buildCustomerEmail(order, course, kind) {
  const lang = LOCALES[order.billing?.lang] ? order.billing.lang : "it";
  const T = TEXTS[lang];
  const locale = LOCALES[lang];
  const dates = dateRange(course, locale);
  const subject = (order.test_mode && order.method !== "bonifico" ? "[TEST] " : "") +
    T.subject.replace("{date}", dates ? T.on.replace("{d}", dates) : "");
  const staff = staffTo();
  const name = order.participants?.[0] ? `${order.participants[0].nome} ${order.participants[0].cognome}`.trim() : "";
  const steps = (kind === "bank" ? T.stepsBank : T.stepsPaid).map((s) => `<li>${esc(s.replace("{staff}", staff))}</li>`).join("");
  const reason = `${order.ref}`;

  const orderRows = [
    row(T.order, order.ref), row(T.course, `Certified Professional for Software Architecture - CPSA® ${course.livello || "Foundation"} level`), row(T.dates, dates), row(T.schedule, course.orario_it || ""),
    row(T.place, course[`luogo_${lang}`] || course.luogo_it || ""), row(T.method, T.methods[order.method] || order.method),
  ];
  const finRows = [
    row(T.net, eur(order.subtotal_cents - order.discount_cents, locale)),
    order.discount_cents > 0 ? row(`${T.discount}${order.coupon ? ` (${order.coupon})` : ""}`, `− ${eur(order.discount_cents, locale)}`) : "",
    row(T.vat, eur(order.vat_cents, locale)), row(T.total, eur(order.total_cents, locale)),
  ];
  const people = (order.participants || []).map((p) => `<li>${esc(p.nome)} ${esc(p.cognome)} — ${esc(p.email)}</li>`).join("");
  const b = order.billing || {};
  const billingRows = [row("", ""), row(b.ragione ? "Ragione sociale" : "Nome", b.ragione || `${b.nome || ""} ${b.cognome || ""}`.trim()),
    row("Codice fiscale", b.cf), row("P.IVA / VAT", b.piva || b.vatId), row("SDI", b.sdi), row("PEC", b.pec),
    row("Indirizzo", [b.via, `${b.cap || ""} ${b.citta || ""}`.trim(), b.paese].filter(Boolean).join(", "))];
  let bankBlock = "";
  if (kind === "bank") {
    const bk = bankDetails();
    bankBlock = `<h3 style="margin:18px 0 4px">${esc(T.bankTitle)}</h3>${table([row(T.holder, bk.holder), row(T.iban, bk.iban), row(T.bank, bk.bank), row(T.reason, reason)])}`;
  }

  const html = `<div style="font-family:Arial,sans-serif;color:#222;max-width:640px;margin:0 auto;font-size:14px;line-height:1.5">
<p>${esc(T.greeting.replace("{name}", name))}</p>
<p>${esc(T.intro)}</p>
<p><strong>${esc(kind === "bank" ? T.thanksBank : T.thanksPaid)}</strong></p>
<ul><li>${esc(T.minInfo)}</li><li>${esc(T.refundInfo)}</li></ul>
${order.test_mode && order.method !== "bonifico" ? `<p style="background:#fff3cd;padding:8px 12px;border-radius:6px">${esc(T.test)}</p>` : ""}
<h3 style="margin:18px 0 4px">${esc(T.nextTitle)}</h3><ol>${steps}</ol>
<h3 style="margin:18px 0 4px">${esc(T.summary)}</h3>${table(orderRows)}
<h3 style="margin:18px 0 4px">${esc(T.fin)}</h3>${table(finRows)}
${bankBlock}
<h3 style="margin:18px 0 4px">${esc(T.participants)}</h3><ul>${people}</ul>
<h3 style="margin:18px 0 4px">${esc(T.billing)}</h3>${table(billingRows.slice(1))}
<p>${esc(T.exam)}</p>
<p>${esc(T.closing)}</p>
<p>${esc(T.signature)}<br>Cube Academy — Cube Engineering S.r.l.<br>Via Venti Settembre 118, 00187 Roma<br><a href="mailto:academy@cubeng.eu">academy@cubeng.eu</a></p></div>`;
  return { subject, html };
}

export function buildStaffSummary(order, course, kind) {
  const lines = [
    `Nuova iscrizione CPSA-F${order.test_mode && order.method !== "bonifico" ? " [PROVA - sandbox]" : ""}`,
    `Stato: ${kind === "bank" ? "registrata, in attesa di bonifico" : "pagata"}`,
    `Rif.: ${order.ref}`, `Corso: ${plainTitle(course.titolo)} (#${course.id_corso}) — ${dateRange(course, "it-IT")}`,
    `Modalità: ${course.modalita || "intensivo"}  Orario: ${course.orario_it || "-"}`,
    `Metodo: ${order.method}  Lingua: ${order.billing?.lang || "it"}`,
    `Partecipanti: ${order.seats}`, `Imponibile: ${eur(order.subtotal_cents - order.discount_cents, "it-IT")}  IVA: ${eur(order.vat_cents, "it-IT")}  Totale: ${eur(order.total_cents, "it-IT")}`,
    `Sconto: ${eur(order.discount_cents, "it-IT")}${order.coupon ? ` (${order.coupon})` : ""}`, "",
    "=== Partecipanti ===",
    ...(order.participants || []).map((p, i) => `${i + 1}) ${p.nome} ${p.cognome} | ${p.email} | ${p.telefono || "-"} | marketing: ${p.consensoMarketing ? "sì" : "no"}`), "",
    "=== Fatturazione ===", ...Object.entries(order.billing || {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`), "",
    "=== JSON completo ===", JSON.stringify(order, null, 2),
  ];
  return { subject: `Nuova iscrizione iSAQB – ${order.billing?.ragione || `${order.billing?.nome || ""} ${order.billing?.cognome || ""}`.trim() || order.ref}`, text: lines.join("\n") };
}

/**
 * Invia le email di un'iscrizione. kind: "bank" (registrata, in attesa di bonifico) oppure "paid".
 * Non solleva eccezioni: un errore SMTP non deve far fallire l'iscrizione.
 */
export async function sendOrderEmails(order, course, kind) {
  if (!mailConfigured()) {
    console.error(`Email non inviate per ${order.ref}: mancano ${mailMissing().join(", ")}`);
    return { sent: false, reason: "smtp-not-configured" };
  }
  try {
    const customer = buildCustomerEmail(order, course, kind);
    const recipients = [...new Set((order.participants || []).map((p) => String(p.email).trim().toLowerCase()).filter(Boolean))];
    for (const to of recipients) await send({ to, ...customer });
    const cc = staffCc();
    if (cc && !recipients.includes(cc.toLowerCase())) await send({ to: cc, ...customer });
    const staff = buildStaffSummary(order, course, kind);
    await send({ to: staffTo(), ...staff });
    return { sent: true };
  } catch (e) {
    console.error(`Errore invio email per ${order.ref}:`, e?.message || e);
    return { sent: false, reason: "smtp-error" };
  }
}

/* ------------------------- modulo di contatto ------------------------ */

const TOPICS = {
  info: "Informazioni sul corso", iscrizione: "Iscrizione o pagamento", gruppi: "Gruppi aziendali / edizioni dedicate",
  attesa: "Lista d'attesa", rimborso: "Rimborsi e fatturazione", prestige: "Corsi residenziali Prestige", altro: "Altro",
};
export const CONTACT_TOPICS = Object.keys(TOPICS);

const AUTOREPLY = {
  it: { subject: "Abbiamo ricevuto la tua richiesta - Cube Academy", hello: "Gentile {name},", body: "abbiamo ricevuto il tuo messaggio e ti risponderemo il prima possibile.", copy: "Copia del tuo messaggio", bye: "Cordiali saluti," },
  en: { subject: "We have received your request - Cube Academy", hello: "Dear {name},", body: "we have received your message and will reply as soon as possible.", copy: "A copy of your message", bye: "Kind regards," },
  fr: { subject: "Nous avons bien reçu votre demande - Cube Academy", hello: "Bonjour {name},", body: "nous avons bien reçu votre message et vous répondrons dès que possible.", copy: "Copie de votre message", bye: "Cordialement," },
  de: { subject: "Wir haben Ihre Anfrage erhalten - Cube Academy", hello: "Guten Tag {name},", body: "wir haben Ihre Nachricht erhalten und melden uns so schnell wie möglich.", copy: "Kopie Ihrer Nachricht", bye: "Mit freundlichen Grüßen" },
};

/** Inoltra il messaggio dal modulo di contatto allo staff (Reply-To = mittente) e manda una ricevuta al mittente. */
export async function sendContactEmails(c) {
  if (!mailConfigured()) return { sent: false, reason: "smtp-not-configured" };
  try {
    const topic = TOPICS[c.topic] || TOPICS.altro;
    const lines = [`Nuovo messaggio dal sito (modulo di contatto)`, `Argomento: ${topic}`, `Nome: ${c.name}`, `Email: ${c.email}`, `Telefono: ${c.phone || "-"}`, `Lingua del sito: ${c.lang}`, "", c.message];
    await send({ to: staffTo(), subject: `[Contatto] ${topic} - ${c.name}`, text: lines.join("\n"), replyTo: `"${c.name.replace(/"/g, "")}" <${c.email}>` });
    const T = AUTOREPLY[c.lang] || AUTOREPLY.it;
    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;max-width:600px"><p>${esc(T.hello.replace("{name}", c.name))}</p><p>${esc(T.body)}</p><p style="color:#666;margin-bottom:4px">${esc(T.copy)}:</p><blockquote style="margin:0;padding:8px 14px;border-left:3px solid #ccc;white-space:pre-wrap">${esc(c.message)}</blockquote><p>${esc(T.bye)}<br>Cube Academy — Cube Engineering S.r.l.</p></div>`;
    await send({ to: c.email, subject: T.subject, html });
    return { sent: true };
  } catch (e) {
    console.error("Errore invio email di contatto:", e?.message || e);
    return { sent: false, reason: "smtp-error" };
  }
}
