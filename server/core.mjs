// Logica lato server di iscrizioni e pagamenti, usata dai Route Handler di Next.js (src/app/api, src/app/pagamento).
// Ogni funzione restituisce { status, body } così i gestori restano sottili.
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { MAX_SEATS, computeTotals, earlyPriceEuro } from "../shared/pricing.mjs";
import { isCapItalia, isCodiceFiscale, isCodiceFiscaleAny, isEmail, isPartitaIva, isVatIdEstero } from "../shared/validators.mjs";
import { bankDetails, createSession, isPaid, methodStatus, paypalVerifyWebhook, stripeClient, stripeWebhookSecret } from "./payments.mjs";
import { findGlobalCoupon, getSettings, invalidateSettings } from "./settings.mjs";
import { CONTACT_TOPICS, mailConfigured, mailMissing, sendContactEmails, sendOrderEmails } from "./mail.mjs";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
export const db = SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

const ok = (body, status = 200) => ({ status, body });
const fail = (status, error) => ({ status, body: { error } });
const NO_DB = () => fail(503, "Database ordini non configurato (SUPABASE_SERVICE_ROLE_KEY).");

/* rate limit minimale in memoria (per IP e azione) */
const hits = new Map();
export function rateLimited(key, max, windowMs) {
  const now = Date.now();
  const h = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (h.length >= max) return true;
  h.push(now);
  hits.set(key, h);
  return false;
}
const TOO_MANY = () => fail(429, "Troppe richieste, riprova tra poco.");

/* ---------------------------- helpers DB --------------------------- */

async function getCourse(id) {
  const { data } = await db.from("corsi").select("*").eq("id_corso", id).maybeSingle();
  return data;
}

async function seatsTaken(idCorso) {
  const { data } = await db.from("iscrizioni").select("seats,status,method,created_at").eq("id_corso", idCorso).in("status", ["paid", "pending"]);
  const now = Date.now();
  return (data || []).reduce((n, o) => {
    const holdMs = o.method === "bonifico" ? 8 * 86400000 : 3600000; // bonifico: posti bloccati ~7 giorni lavorativi
    return n + (o.status === "paid" || now - new Date(o.created_at).getTime() < holdMs ? o.seats : 0);
  }, 0);
}

async function markPaid(order) {
  const { data } = await db.from("iscrizioni").update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("ref", order.ref).neq("status", "paid").select("ref");
  if (data?.length) {
    const c = await getCourse(order.id_corso);
    if (c?.posti_disponibili != null) {
      await db.from("corsi").update({ posti_disponibili: Math.max(0, c.posti_disponibili - order.seats) }).eq("id_corso", order.id_corso);
    }
    // il passaggio a "pagato" avviene una sola volta: la conferma parte una sola volta
    if (c && order.method !== "bonifico") await sendOrderEmails({ ...order, status: "paid" }, c, "paid");
  }
}

const getOrder = async (ref) => (await db.from("iscrizioni").select("*").eq("ref", ref).maybeSingle()).data;

/** Codice valido per questo corso (codici del corso nel DB + codici globali del pannello). */
function resolveCoupon(course, settings, code, billingType) {
  const wanted = String(code || "").trim().toUpperCase();
  if (!wanted) return null;
  for (const n of [1, 2, 3]) {
    const cd = course[`codice_sconto_${n}`];
    if (!cd || cd.toUpperCase() !== wanted) continue;
    const from = course[`codice_sconto_${n}_data_inizio`];
    const to = course[`codice_sconto_${n}_data_fine`];
    const now = new Date();
    if ((from && now < new Date(from)) || (to && now > new Date(to))) continue;
    // ambito: tipologie di fatturazione ammesse (vuoto = tutte)
    const scopes = String(course[`codice_sconto_${n}_ambiti`] || "").split(",").map((x) => x.trim()).filter(Boolean);
    if (scopes.length && !scopes.includes(billingType)) continue;
    const pct = Number(course[`codice_sconto_${n}_percentuale`]);
    if (pct > 0 && pct <= 100) return { code: cd.toUpperCase(), pct: pct / 100 };
  }
  return findGlobalCoupon(settings, wanted, billingType);
}

/* ------------------------------ webhook ---------------------------- */

export async function stripeWebhook(rawBody, signature) {
  if (!db) return { status: 503, body: "Database non configurato" };
  for (const test of [true, false]) {
    const whsec = stripeWebhookSecret(test);
    if (!whsec) continue;
    try {
      const event = stripeClient(test).webhooks.constructEvent(rawBody, signature, whsec);
      if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        const order = await getOrder(event.data.object.metadata?.ref);
        if (order && (await isPaid(order))) await markPaid(order);
      }
      return ok({ received: true });
    } catch { /* prova l'altro segreto */ }
  }
  return { status: 400, body: "Firma webhook non valida" };
}

export async function paypalWebhook(rawText, headers) {
  if (!db) return { status: 503, body: "Database non configurato" };
  let event;
  try { event = JSON.parse(rawText); } catch { return { status: 400, body: "Corpo non valido" }; }
  const okSig = (await paypalVerifyWebhook(true, headers, event).catch(() => false)) || (await paypalVerifyWebhook(false, headers, event).catch(() => false));
  if (!okSig) return { status: 400, body: "Firma webhook non valida" };
  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const ref = event.resource?.custom_id;
    const order = ref && (await getOrder(ref));
    if (order && (await isPaid(order))) await markPaid(order);
  }
  return ok({ received: true });
}

/* ------------------------------- API ------------------------------- */

export async function apiConfig() {
  const settings = await getSettings(db);
  const st = methodStatus(settings);
  const methods = Object.fromEntries(Object.entries(st).map(([k, v]) => [k, v.available]));
  const sandbox = Object.entries(st).some(([k, v]) => v.available && v.sandbox && k !== "bonifico");
  return ok({ testMode: sandbox, methods, privateDiscount: settings.private.enabled ? settings.private.percent : 0 });
}

export async function apiCoupon(body, ip) {
  if (rateLimited(`${ip}:coupon`, 20, 60000)) return TOO_MANY();
  if (!db) return NO_DB();
  const c = await getCourse(Number(body?.courseId));
  const found = c && resolveCoupon(c, await getSettings(db), body?.code, String(body?.billingType || ""));
  if (!found) return fail(404, "Codice non valido o scaduto per questa tipologia di fatturazione");
  return ok({ code: found.code, pct: found.pct });
}

/**
 * Causale del pagamento, breve e riconoscibile negli estratti conto:
 * "Corso CPSA-F - 2026.12.02 - <CF o P.IVA di chi paga> - <ragione sociale o nome e cognome>" (max 127 caratteri, limite PayPal).
 */
function paymentDescription(course, billing) {
  const date = String(course.data_inizio || "").replaceAll("-", ".");
  const taxId = billing.type === "estera" ? billing.vatId : billing.type === "privato" ? billing.cf : billing.piva || billing.cf;
  const who = billing.ragione || `${billing.nome} ${billing.cognome}`.trim();
  return ["Corso CPSA-F", date, taxId, who].filter(Boolean).join(" - ").slice(0, 127);
}

const str = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function apiCreateOrder(b, { origin, ip }) {
  if (rateLimited(`${ip}:orders`, 10, 60000)) return TOO_MANY();
  if (!db) return NO_DB();
  try {
    b = b || {};
    const method = b.method;
    if (!["stripe", "paypal", "sumup", "bonifico"].includes(method)) return fail(400, "Metodo di pagamento non valido.");
    const settings = await getSettings(db);
    const status = methodStatus(settings)[method];
    if (!status.available) return fail(503, "Questo metodo di pagamento non è attivo. Scegline un altro o scrivi a academy@cubeng.eu.");
    const test = status.sandbox;

    const course = await getCourse(Number(b.courseId));
    if (!course || !course.iscrizioni_aperte || course.stato === 5 || course.stato === 2) return fail(400, "Le iscrizioni a questo corso non sono aperte.");

    const seats = Number(b.seats);
    if (!Number.isInteger(seats) || seats < 1 || seats > MAX_SEATS) return fail(400, `Puoi iscrivere da 1 a ${MAX_SEATS} partecipanti.`);
    const parts = Array.isArray(b.participants) ? b.participants.slice(0, MAX_SEATS) : [];
    if (parts.length !== seats) return fail(400, "Dati dei partecipanti incompleti.");
    const participants = parts.map((p) => ({
      nome: str(p.nome, 80), cognome: str(p.cognome, 80), email: str(p.email, 120), telefono: str(p.telefono, 40),
      consensoPrivacy: p.cPrivacy === true, consensoMarketing: p.cMarketing === true, consensoAudioVideo: p.cAV === true,
    }));
    if (participants.some((p) => !p.nome || !p.cognome || !isEmail(p.email) || !p.consensoPrivacy)) return fail(400, "Dati dei partecipanti incompleti.");
    const bl = b.billing || {};
    const billing = Object.fromEntries(["type", "nome", "cognome", "ragione", "cf", "piva", "sdi", "pec", "via", "cap", "citta", "paese", "vatId"].map((k) => [k, str(bl[k], 120)]));
    if (!billing.via || !billing.cap || !billing.citta) return fail(400, "Dati di fatturazione incompleti.");
    billing.lang = ["it", "en", "fr", "de"].includes(b.lang) ? b.lang : "it"; // lingua delle email

    const available = Math.min(MAX_SEATS - (await seatsTaken(course.id_corso)), course.posti_disponibili ?? Infinity);
    if (seats > available) return fail(409, available > 0 ? `Sono rimasti solo ${available} posti.` : "Edizione al completo.");

    if (!["privato", "pro", "azienda", "estera"].includes(billing.type)) return fail(400, "Tipologia di fatturazione non valida.");
    if (billing.type === "privato" && seats > 1) return fail(400, "Per un'iscrizione a titolo personale è previsto un solo partecipante.");
    const isCompany = billing.type === "azienda" || billing.type === "estera";
    const invalidBilling =
      (billing.type !== "estera" && !(isCompany ? !billing.cf || isCodiceFiscaleAny(billing.cf) : isCodiceFiscale(billing.cf))) ||
      ((billing.type === "pro" || billing.type === "azienda") && !isPartitaIva(billing.piva)) ||
      (billing.type === "estera" && !isVatIdEstero(billing.vatId)) ||
      (billing.type !== "estera" && !isCapItalia(billing.cap)) ||
      (billing.pec && !isEmail(billing.pec));
    if (invalidBilling) return fail(400, "Dati di fatturazione non validi.");
    const coupon = b.coupon ? resolveCoupon(course, settings, b.coupon, billing.type) : null;
    if (b.coupon && !coupon) return fail(400, "Codice sconto non valido o scaduto.");
    const t = computeTotals({
      listEuro: course.standard_price ?? 0, earlyEuro: earlyPriceEuro(course), seats, billingType: billing.type,
      privatePct: settings.private.enabled && course.sconto_privati !== false ? settings.private.percent / 100 : 0, couponPct: coupon?.pct ?? 0, couponCode: coupon?.code ?? null,
    });
    const { applied, early_active: _early, ...totals } = t;
    void _early;
    if (totals.total_cents <= 0) return fail(400, "Prezzo del corso non disponibile.");

    const ref = `CUBE-${new Date().getFullYear()}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
    const row = { ref, id_corso: course.id_corso, method, test_mode: test, seats, ...totals, coupon: applied, participants, billing };
    const ins = await db.from("iscrizioni").insert(row).select("*").single();
    if (ins.error) throw ins.error;

    if (method === "bonifico") {
      void sendOrderEmails(ins.data, course, "bank"); // conferma con le coordinate; un errore SMTP non blocca l'iscrizione
      return ok({ ref, bank: bankDetails() });
    }

    const description = paymentDescription(course, billing);
    try {
      const s = await createSession({
        provider: method, order: ins.data, description, email: participants[0].email, origin,
        lang: ["it", "en", "fr", "de"].includes(b.lang) ? b.lang : "it",
      });
      await db.from("iscrizioni").update({ provider_ref: s.providerRef }).eq("ref", ref);
      return ok({ ref, url: s.url });
    } catch (e) {
      console.error("createSession", e);
      await db.from("iscrizioni").update({ status: "failed" }).eq("ref", ref);
      return fail(502, "Il circuito di pagamento non ha risposto. Riprova o scegli un altro metodo.");
    }
  } catch (e) {
    console.error("POST /api/orders", e);
    return fail(500, "Errore imprevisto. Riprova tra poco.");
  }
}

/** Riepilogo pubblico (solo ciò che serve alla pagina di esito). */
export async function apiOrderSummary(ref, ip) {
  if (rateLimited(`${ip}:summary`, 60, 60000)) return TOO_MANY();
  if (!db) return NO_DB();
  const o = await getOrder(String(ref));
  if (!o) return fail(404, "Ordine non trovato.");
  return ok({
    ref: o.ref, id_corso: o.id_corso, seats: o.seats, total_cents: o.total_cents, method: o.method, status: o.status, test_mode: o.test_mode,
    bank: o.method === "bonifico" && o.status === "pending" ? bankDetails() : undefined,
  });
}

/** Ritorno dai checkout: verifica sul provider e restituisce lo stato da mostrare (paid | pending | cancelled | error). */
export async function checkoutReturn(ref, outcome) {
  if (!db) return "error";
  const order = await getOrder(ref);
  if (!order) return "error";
  if (order.status === "paid") return "paid";
  if (outcome === "cancel") {
    await db.from("iscrizioni").update({ status: "cancelled" }).eq("ref", ref).eq("status", "pending");
    return "cancelled";
  }
  if (await isPaid(order)) {
    await markPaid(order);
    return "paid";
  }
  return "pending";
}

/* ----------------------- API riservate agli admin -------------------- */
// il browser admin invia il JWT Supabase; il server verifica utente e appartenenza a admin_emails

export async function adminGate(authHeader) {
  if (!db) return fail(503, "Database non configurato.");
  const token = String(authHeader || "").replace(/^Bearer /i, "");
  const { data } = token ? await db.auth.getUser(token) : { data: null };
  const email = data?.user?.email?.toLowerCase();
  if (!email) return fail(401, "Accesso richiesto.");
  const { data: row } = await db.from("admin_emails").select("email").ilike("email", email).maybeSingle();
  if (!row) return fail(403, "Utente non abilitato.");
  return null;
}

// stato dei metodi di pagamento: quali variabili d'ambiente mancano (solo i nomi, mai i valori)
export async function adminStatus() {
  invalidateSettings();
  const missing = mailMissing();
  return ok({ methods: methodStatus(await getSettings(db)), siteUrl: process.env.SITE_URL || null, mail: { configured: missing.length === 0, missing } });
}

export async function adminOrders() {
  const { data, error } = await db.from("iscrizioni")
    .select("ref,id_corso,created_at,paid_at,status,method,test_mode,seats,total_cents,coupon,participants,billing")
    .order("created_at", { ascending: false }).limit(200);
  if (error) return fail(500, error.message);
  return ok(data);
}

/* ------------------------- modulo di contatto ------------------------ */

export async function apiContact(b, ip) {
  b = b || {};
  if (b.website) return ok({ ok: true }); // campo trappola per i bot: finge di accettare
  if (rateLimited(`${ip}:contact`, 5, 10 * 60000)) return TOO_MANY();
  const name = str(b.name, 100);
  const email = str(b.email, 150);
  const phone = str(b.phone, 40);
  const message = str(b.message, 3000);
  const topic = CONTACT_TOPICS.includes(b.topic) ? b.topic : "altro";
  const lang = ["it", "en", "fr", "de"].includes(b.lang) ? b.lang : "it";
  if (name.length < 2 || !isEmail(email) || message.length < 10 || b.consent !== true) return fail(400, "Compila i campi obbligatori.");
  if (Number(b.elapsedMs) < 2500) return fail(400, "Compila i campi obbligatori."); // inviato troppo in fretta: probabile bot
  if (!mailConfigured()) {
    console.error(`Modulo di contatto: email non inviata, mancano ${mailMissing().join(", ")}`);
    return fail(503, "Il servizio email non è attivo al momento. Scrivi a academy@cubeng.eu.");
  }
  const r = await sendContactEmails({ name, email, phone, message, topic, lang });
  return r.sent ? ok({ ok: true }) : fail(502, "Non siamo riusciti a inviare il messaggio. Riprova o scrivi a academy@cubeng.eu.");
}
