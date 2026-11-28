// Impostazioni modificabili dal pannello admin (tabella public.impostazioni), con cache breve.
export const SCOPES = ["privato", "pro", "azienda", "estera"]; // tipologie di fatturazione

export const DEFAULTS = {
  methods: {
    stripe: { enabled: true, sandbox: true },
    paypal: { enabled: true, sandbox: true },
    sumup: { enabled: true, sandbox: true },
    bonifico: { enabled: true },
  },
  private: { enabled: true, percent: 50 },
  coupons: [],
};

let cache = { at: 0, value: DEFAULTS };

/** Lingue del sito in cui si può scrivere il testo del banner di un codice sconto. */
export const BANNER_LANGS = ["it", "en", "fr", "de"];
export const BANNER_MAX = 200;
/** Testo del banner: solo testo semplice su una riga (il DB è scrivibile dal browser admin; il sito lo mostra come testo, mai come HTML). */
const bannerClean = (v) => String(v ?? "").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, BANNER_MAX);

const clampPct = (n) => Math.min(100, Math.max(0, Number(n) || 0));

/** Unisce la config salvata ai default e ripulisce i valori (il DB è scrivibile dal browser admin). */
export function normalize(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const methods = {};
  for (const k of Object.keys(DEFAULTS.methods)) {
    const m = r.methods?.[k] ?? {};
    methods[k] = { enabled: m.enabled !== false, ...(k === "bonifico" ? {} : { sandbox: m.sandbox !== false }) };
  }
  const coupons = (Array.isArray(r.coupons) ? r.coupons : []).slice(0, 20).map((c) => ({
    code: String(c?.code ?? "").trim().toUpperCase().slice(0, 50),
    label: String(c?.label ?? "").slice(0, 100),
    percent: clampPct(c?.percent),
    start: /^\d{4}-\d{2}-\d{2}$/.test(c?.start ?? "") ? c.start : "",
    end: /^\d{4}-\d{2}-\d{2}$/.test(c?.end ?? "") ? c.end : "",
    scopes: (Array.isArray(c?.scopes) ? c.scopes : SCOPES).filter((s) => SCOPES.includes(s)),
    enabled: c?.enabled !== false,
    banner: c?.banner === true,
    bannerText: Object.fromEntries(BANNER_LANGS.map((l) => [l, bannerClean(c?.bannerText?.[l])])),
  })).filter((c) => c.code && c.percent > 0);
  return {
    methods,
    private: { enabled: r.private?.enabled !== false, percent: clampPct(r.private?.percent ?? DEFAULTS.private.percent) },
    coupons,
  };
}

export async function getSettings(db) {
  if (!db) return DEFAULTS;
  if (Date.now() - cache.at < 15000) return cache.value;
  const { data } = await db.from("impostazioni").select("config").eq("id", 1).maybeSingle();
  cache = { at: Date.now(), value: normalize(data?.config) };
  return cache.value;
}

export const invalidateSettings = () => { cache.at = 0; };

/**
 * Il codice da pubblicizzare con il banner del sito: il primo con "banner" attivo che oggi è in corso (acceso e nel periodo, per qualunque
 * tipologia). Senza testo nella lingua del sito si usa l'italiano e poi il testo automatico, che sceglie il sito.
 */
export function activePromo(settings, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const c = settings.coupons.find((x) => x.banner && x.enabled && x.percent > 0 && !(x.start && today < x.start) && !(x.end && today > x.end));
  return c ? { code: c.code, percent: c.percent, text: c.bannerText, until: c.end || null } : null;
}

/** Codice sconto globale valido oggi per la tipologia di fatturazione indicata. */
export function findGlobalCoupon(settings, code, billingType, now = new Date()) {
  const wanted = String(code || "").trim().toUpperCase();
  if (!wanted) return null;
  const today = now.toISOString().slice(0, 10);
  const c = settings.coupons.find((x) => x.enabled && x.code === wanted);
  if (!c) return null;
  if (c.start && today < c.start) return null;
  if (c.end && today > c.end) return null;
  if (!c.scopes.includes(billingType)) return null;
  return { code: c.code, pct: c.percent / 100, label: c.label || c.code, until: c.end || null };
}
