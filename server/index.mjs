// Server Node per Hostinger: serve il sito (dist/) e le API di iscrizione e pagamento.
import express from "express";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { MAX_SEATS, computeTotals, earlyPriceEuro } from "../shared/pricing.mjs";
import { isCapItalia, isCodiceFiscale, isCodiceFiscaleAny, isEmail, isPartitaIva, isVatIdEstero } from "../shared/validators.mjs";
import { bankDetails, createSession, isPaid, methodStatus, paypalVerifyWebhook, stripeClient, stripeWebhookSecret } from "./payments.mjs";
import { findGlobalCoupon, getSettings, invalidateSettings } from "./settings.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = process.env.DIST_DIR || path.join(__dirname, "..", "dist");
const PORT = Number(process.env.PORT) || 3000;

// carica un eventuale .env locale (in produzione le variabili vengono dal pannello Hostinger)
try { process.loadEnvFile(path.join(__dirname, "..", ".env")); } catch { /* nessun .env */ }

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const db = SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

const origin = (req) => (process.env.SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
const fail = (res, code, error) => res.status(code).json({ error });
const needDb = (res) => {
  if (db) return true;
  fail(res, 503, "Database ordini non configurato (SUPABASE_SERVICE_ROLE_KEY).");
  return false;
};

/* rate limit minimale in memoria (per IP) sulle API */
const hits = new Map();
const limit = (max, windowMs) => (req, res, next) => {
  const k = `${req.ip}:${req.path}`;
  const now = Date.now();
  const h = (hits.get(k) || []).filter((t) => now - t < windowMs);
  if (h.length >= max) return fail(res, 429, "Troppe richieste, riprova tra poco.");
  h.push(now);
  hits.set(k, h);
  next();
};

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
  }
}

const getOrder = async (ref) => (await db.from("iscrizioni").select("*").eq("ref", ref).maybeSingle()).data;

/* ------------------------------ webhook ---------------------------- */
// i webhook usano il body grezzo: vanno registrati PRIMA di express.json()

app.post("/api/webhook/stripe", express.raw({ type: "*/*" }), async (req, res) => {
  if (!db) return res.sendStatus(503);
  for (const t of [true, false]) {
    const whsec = stripeWebhookSecret(t);
    if (!whsec) continue;
    try {
      const event = stripeClient(t).webhooks.constructEvent(req.body, req.headers["stripe-signature"], whsec);
      if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        const order = await getOrder(event.data.object.metadata?.ref);
        if (order && (await isPaid(order))) await markPaid(order);
      }
      return res.json({ received: true });
    } catch { /* prova l'altro segreto */ }
  }
  res.status(400).send("Firma webhook non valida");
});

app.post("/api/webhook/paypal", express.raw({ type: "*/*" }), async (req, res) => {
  if (!db) return res.sendStatus(503);
  let event;
  try { event = JSON.parse(req.body.toString("utf8")); } catch { return res.sendStatus(400); }
  const okSig = (await paypalVerifyWebhook(true, req.headers, event).catch(() => false)) || (await paypalVerifyWebhook(false, req.headers, event).catch(() => false));
  if (!okSig) return res.status(400).send("Firma webhook non valida");
  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const ref = event.resource?.custom_id;
    const order = ref && (await getOrder(ref));
    if (order && (await isPaid(order))) await markPaid(order);
  }
  res.json({ received: true });
});

app.use(express.json({ limit: "100kb" }));

/* ------------------------------- API ------------------------------- */

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
    const pct = Number(course[`codice_sconto_${n}_percentuale`]);
    if (pct > 0 && pct <= 100) return { code: cd.toUpperCase(), pct: pct / 100 };
  }
  return findGlobalCoupon(settings, wanted, billingType);
}

app.get("/api/config", async (_req, res) => {
  const settings = await getSettings(db);
  const st = methodStatus(settings);
  const methods = Object.fromEntries(Object.entries(st).map(([k, v]) => [k, v.available]));
  const sandbox = Object.entries(st).some(([k, v]) => v.available && v.sandbox && k !== "bonifico");
  res.json({ testMode: sandbox, methods, privateDiscount: settings.private.enabled ? settings.private.percent : 0 });
});

app.post("/api/coupon", limit(20, 60000), async (req, res) => {
  if (!needDb(res)) return;
  const c = await getCourse(Number(req.body?.courseId));
  const found = c && resolveCoupon(c, await getSettings(db), req.body?.code, String(req.body?.billingType || ""));
  if (!found) return fail(res, 404, "Codice non valido o scaduto per questa tipologia di fatturazione");
  res.json({ code: found.code, pct: found.pct });
});

const str = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

app.post("/api/orders", limit(10, 60000), async (req, res) => {
  if (!needDb(res)) return;
  try {
    const b = req.body || {};
    const method = b.method;
    if (!["stripe", "paypal", "sumup", "bonifico"].includes(method)) return fail(res, 400, "Metodo di pagamento non valido.");
    const settings = await getSettings(db);
    const status = methodStatus(settings)[method];
    if (!status.available) return fail(res, 503, "Questo metodo di pagamento non è attivo. Scegline un altro o scrivi a academy@cubeng.eu.");
    const test = status.sandbox;

    const course = await getCourse(Number(b.courseId));
    if (!course || !course.iscrizioni_aperte || course.stato === 5 || course.stato === 2) return fail(res, 400, "Le iscrizioni a questo corso non sono aperte.");

    const seats = Number(b.seats);
    if (!Number.isInteger(seats) || seats < 1 || seats > MAX_SEATS) return fail(res, 400, `Puoi iscrivere da 1 a ${MAX_SEATS} partecipanti.`);
    const parts = Array.isArray(b.participants) ? b.participants.slice(0, MAX_SEATS) : [];
    if (parts.length !== seats) return fail(res, 400, "Dati dei partecipanti incompleti.");
    const participants = parts.map((p) => ({
      nome: str(p.nome, 80), cognome: str(p.cognome, 80), email: str(p.email, 120), telefono: str(p.telefono, 40),
      consensoPrivacy: p.cPrivacy === true, consensoMarketing: p.cMarketing === true, consensoAudioVideo: p.cAV === true,
    }));
    if (participants.some((p) => !p.nome || !p.cognome || !isEmail(p.email) || !p.consensoPrivacy)) return fail(res, 400, "Dati dei partecipanti incompleti.");
    const bl = b.billing || {};
    const billing = Object.fromEntries(["type", "nome", "cognome", "ragione", "cf", "piva", "sdi", "pec", "via", "cap", "citta", "paese", "vatId"].map((k) => [k, str(bl[k], 120)]));
    if (!billing.via || !billing.cap || !billing.citta) return fail(res, 400, "Dati di fatturazione incompleti.");

    const available = Math.min(MAX_SEATS - (await seatsTaken(course.id_corso)), course.posti_disponibili ?? Infinity);
    if (seats > available) return fail(res, 409, available > 0 ? `Sono rimasti solo ${available} posti.` : "Edizione al completo.");

    if (!["privato", "pro", "azienda", "estera"].includes(billing.type)) return fail(res, 400, "Tipologia di fatturazione non valida.");
    const isCompany = billing.type === "azienda" || billing.type === "estera";
    const invalidBilling =
      (billing.type !== "estera" && !(isCompany ? !billing.cf || isCodiceFiscaleAny(billing.cf) : isCodiceFiscale(billing.cf))) ||
      ((billing.type === "pro" || billing.type === "azienda") && !isPartitaIva(billing.piva)) ||
      (billing.type === "estera" && !isVatIdEstero(billing.vatId)) ||
      (billing.type !== "estera" && !isCapItalia(billing.cap)) ||
      (billing.pec && !isEmail(billing.pec));
    if (invalidBilling) return fail(res, 400, "Dati di fatturazione non validi.");
    const coupon = b.coupon ? resolveCoupon(course, settings, b.coupon, billing.type) : null;
    if (b.coupon && !coupon) return fail(res, 400, "Codice sconto non valido o scaduto.");
    const t = computeTotals({
      listEuro: course.standard_price ?? 0, earlyEuro: earlyPriceEuro(course), seats, billingType: billing.type,
      privatePct: settings.private.enabled ? settings.private.percent / 100 : 0, couponPct: coupon?.pct ?? 0, couponCode: coupon?.code ?? null,
    });
    const { applied, early_active: _e, ...totals } = t; // eslint-disable-line no-unused-vars
    if (totals.total_cents <= 0) return fail(res, 400, "Prezzo del corso non disponibile.");

    const ref = `CUBE-${new Date().getFullYear()}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
    const row = { ref, id_corso: course.id_corso, method, test_mode: test, seats, ...totals, coupon: applied, participants, billing };
    const ins = await db.from("iscrizioni").insert(row).select("*").single();
    if (ins.error) throw ins.error;

    if (method === "bonifico") return res.json({ ref, bank: bankDetails() });

    const description = `${String(course.titolo).replace(/&reg;/g, "®").replace(/<[^>]+>/g, "")} · ${course.data_inizio}`;
    try {
      const s = await createSession({ provider: method, order: ins.data, description, email: participants[0].email, origin: origin(req), lang: ["it", "en", "fr", "de"].includes(b.lang) ? b.lang : "it" });
      await db.from("iscrizioni").update({ provider_ref: s.providerRef }).eq("ref", ref);
      res.json({ ref, url: s.url });
    } catch (e) {
      console.error("createSession", e);
      await db.from("iscrizioni").update({ status: "failed" }).eq("ref", ref);
      fail(res, 502, "Il circuito di pagamento non ha risposto. Riprova o scegli un altro metodo.");
    }
  } catch (e) {
    console.error("POST /api/orders", e);
    fail(res, 500, "Errore imprevisto. Riprova tra poco.");
  }
});

// riepilogo pubblico (solo ciò che serve alla pagina di esito)
app.get("/api/orders/:ref", limit(60, 60000), async (req, res) => {
  if (!needDb(res)) return;
  const o = await getOrder(String(req.params.ref));
  if (!o) return fail(res, 404, "Ordine non trovato.");
  res.json({
    ref: o.ref, id_corso: o.id_corso, seats: o.seats, total_cents: o.total_cents, method: o.method, status: o.status, test_mode: o.test_mode,
    bank: o.method === "bonifico" && o.status === "pending" ? bankDetails() : undefined,
  });
});

// ritorno dai checkout: verifica sul provider, poi torna alla SPA
app.get("/pagamento/ritorno", limit(60, 60000), async (req, res) => {
  const ref = String(req.query.ref || "");
  const to = (s) => res.redirect(`/#/esito/${encodeURIComponent(ref)}/${s}`);
  if (!db) return to("error");
  const order = await getOrder(ref);
  if (!order) return to("error");
  if (order.status === "paid") return to("paid");
  if (req.query.outcome === "cancel") {
    await db.from("iscrizioni").update({ status: "cancelled" }).eq("ref", ref).eq("status", "pending");
    return to("cancelled");
  }
  if (await isPaid(order)) {
    await markPaid(order);
    return to("paid");
  }
  to("pending");
});

/* ----------------------- API riservate agli admin -------------------- */
// il browser admin invia il JWT Supabase; il server verifica utente e appartenenza a admin_emails

async function adminOnly(req, res, next) {
  if (!db) return fail(res, 503, "Database non configurato.");
  const token = String(req.headers.authorization || "").replace(/^Bearer /i, "");
  const { data } = token ? await db.auth.getUser(token) : { data: null };
  const email = data?.user?.email?.toLowerCase();
  if (!email) return fail(res, 401, "Accesso richiesto.");
  const { data: row } = await db.from("admin_emails").select("email").ilike("email", email).maybeSingle();
  if (!row) return fail(res, 403, "Utente non abilitato.");
  next();
}

// stato dei metodi di pagamento: quali variabili d'ambiente mancano (solo i nomi, mai i valori)
app.get("/api/admin/status", adminOnly, async (_req, res) => {
  invalidateSettings();
  res.json({ methods: methodStatus(await getSettings(db)), siteUrl: process.env.SITE_URL || null });
});

app.get("/api/admin/orders", adminOnly, async (_req, res) => {
  const { data, error } = await db.from("iscrizioni")
    .select("ref,id_corso,created_at,paid_at,status,method,test_mode,seats,total_cents,coupon,participants,billing")
    .order("created_at", { ascending: false }).limit(200);
  if (error) return fail(res, 500, error.message);
  res.json(data);
});

app.use("/api", (_req, res) => fail(res, 404, "Endpoint inesistente."));

/* ------------------------------ statico ---------------------------- */
app.use(express.static(DIST, { index: false, maxAge: "1h" }));
app.get("*", (_req, res) => {
  const index = path.join(DIST, "index.html");
  if (fs.existsSync(index)) res.sendFile(index);
  else res.status(503).send("Build mancante: esegui `npm run build`.");
});

app.listen(PORT, () => console.log(`Cube Academy in ascolto su :${PORT} (db ${db ? "ok" : "non configurato"})`));
