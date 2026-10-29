// Traduzione dei testi del pannello admin dall'italiano verso inglese, francese e tedesco.
// Con ANTHROPIC_API_KEY usa Claude (qualità migliore, modello in TRANSLATE_MODEL);
// senza chiave ripiega sul servizio gratuito MyMemory (nessuna configurazione, qualità inferiore e limite giornaliero).
// I campi indicati in `htmlKeys` contengono HTML (es. la descrizione dei corsi): tag, attributi e link restano
// identici, si traduce solo il testo visibile.

const TARGETS = { en: "English", fr: "French", de: "German" };
const MAX_FIELD = 4000;
const MAX_HTML = 20000;

export const translatorProvider = () => (process.env.ANTHROPIC_API_KEY ? "claude" : "mymemory");

const decode = (s) => String(s).replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const encodeText = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Claude: una sola richiesta, risposta JSON { en: {campo}, fr: {...}, de: {...} }. */
async function viaClaude(fields, htmlKeys) {
  const prompt =
    "Translate the following Italian website fields into English, French and German. " +
    "Keep brand and proper names (Cube Academy, iSAQB®, CPSA-F, LinkedIn, Zoom) unchanged, keep the same tone and meaning, " +
    "preserve line breaks and blank lines between paragraphs, and translate only the values. " +
    (htmlKeys.length
      ? `The fields ${JSON.stringify(htmlKeys)} contain HTML: keep every tag, attribute, entity, link and the overall structure exactly as in the input and translate only the visible text. `
      : "") +
    'Reply with JSON only, shaped as {"en":{...},"fr":{...},"de":{...}} using the same keys as the input.\n\n' +
    JSON.stringify(fields);
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.TRANSLATE_MODEL || "claude-haiku-5-5", max_tokens: 8192, messages: [{ role: "user", content: prompt }] }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || `Servizio di traduzione non disponibile (${r.status}).`);
  const text = (j.content || []).map((c) => c.text || "").join("");
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Risposta di traduzione non valida.");
  return JSON.parse(m[0]);
}

/** MyMemory accetta al massimo ~500 caratteri per richiesta: si traduce per frasi, mantenendo i paragrafi. */
function chunks(paragraph) {
  const out = [];
  let cur = "";
  for (const s of paragraph.split(/(?<=[.!?…])\s+/)) {
    if ((cur + " " + s).trim().length > 450 && cur) { out.push(cur); cur = s; } else cur = (cur + " " + s).trim();
  }
  if (cur) out.push(cur);
  return out.flatMap((c) => (c.length > 450 ? c.match(/.{1,450}/g) : [c]));
}

async function myMemory(text, to) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=it|${to}` +
    (process.env.TRANSLATE_EMAIL ? `&de=${encodeURIComponent(process.env.TRANSLATE_EMAIL)}` : "");
  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  if (Number(j.responseStatus) === 429 || /MYMEMORY WARNING|QUOTA/i.test(String(j?.responseData?.translatedText))) {
    throw new Error("Limite giornaliero del servizio gratuito raggiunto: riprova domani, imposta TRANSLATE_EMAIL o ANTHROPIC_API_KEY.");
  }
  if (!r.ok || Number(j.responseStatus) !== 200) throw new Error("Servizio di traduzione non disponibile.");
  // il servizio gratuito a volte toglie o raddoppia gli spazi attorno ai nomi propri: si riallineano
  return decode(j.responseData.translatedText).replace(/iSAQB\s*®\s*CPSA/g, "iSAQB® CPSA").replace(/ {2,}/g, " ");
}

/** Testo semplice: paragrafi separati da una riga vuota. */
async function plainViaMyMemory(value, to) {
  const out = [];
  for (const p of String(value).split(/\n{2,}/).map((x) => x.trim()).filter(Boolean)) {
    const parts = [];
    for (const c of chunks(p)) parts.push(await myMemory(c, to));
    out.push(parts.join(" "));
  }
  return out.join("\n\n");
}

const hasLetters = (s) => /\p{L}/u.test(s);
const cleanEntities = (s) => decode(String(s).replace(/&nbsp;/g, " ").replace(/&reg;/g, "®"));

async function translateText(core, to, cache) {
  const key = `${to}|${core}`;
  if (!cache.has(key)) {
    const pieces = [];
    for (const c of chunks(core)) pieces.push(await myMemory(c, to));
    cache.set(key, pieces.join(" "));
  }
  return cache.get(key);
}

/** Alternativa prudente: si traducono solo i testi tra un tag e l'altro (frammenti, meno precisi). */
async function perTextNode(body, to, cache) {
  const out = [];
  for (const part of body.split(/(<[^>]*>)/)) {
    if (part.startsWith("<") || !hasLetters(cleanEntities(part))) { out.push(part); continue; }
    const lead = part.match(/^\s*/)[0];
    const trail = part.match(/\s*$/)[0];
    out.push(lead + encodeText(await translateText(cleanEntities(part).trim(), to, cache)) + trail);
  }
  return out.join("");
}

/**
 * Un blocco di testo con tag in linea (grassetto, link, ecc.): i tag diventano marcatori <1>…</1> che il traduttore
 * sposta con le parole, così la frase si traduce per intero. Se un marcatore si perde, si ripiega sui frammenti.
 */
async function translateInline(seg, to, cache) {
  const lead = seg.match(/^\s*/)[0];
  const trail = seg.match(/\s*$/)[0];
  const body = seg.trim();
  if (!hasLetters(cleanEntities(body.replace(/<[^>]*>/g, "")))) return seg;

  const stack = [];
  const map = [];
  let balanced = true;
  const marked = body.replace(/<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi, (m, slash, name) => {
    if (/\/>$/.test(m) || /^(br|img|hr|input|wbr)$/i.test(name)) { map.push({ tag: m }); return `<${map.length - 1}/>`; }
    if (!slash) { map.push({ open: m }); stack.push(map.length - 1); return `<${map.length - 1}>`; }
    const id = stack.pop();
    if (id === undefined) { balanced = false; return m; }
    map[id].close = m;
    return `</${id}>`;
  });
  if (stack.length || !balanced) return lead + (await perTextNode(body, to, cache)) + trail;
  if (!map.length) return lead + encodeText(await translateText(cleanEntities(body), to, cache)) + trail;

  let t = (await translateText(cleanEntities(marked), to, cache)).replace(/(<\d+>)\s+/g, "$1").replace(/\s+(<\/\d+>)/g, "$1");
  const expected = map.reduce((n, x) => n + (x.tag ? 1 : 2), 0);
  const found = (t.match(/<\/?\d+\/?>/g) || []).length;
  if (found !== expected) return lead + (await perTextNode(body, to, cache)) + trail;
  t = t
    .split(/(<\/?\d+\/?>)/)
    .map((p, i) => {
      if (i % 2 === 0) return encodeText(p);
      const [, slash, id, self] = /^<(\/?)(\d+)(\/?)>$/.exec(p);
      const x = map[Number(id)];
      return x.tag ?? (slash ? x.close : x.open);
    })
    .join("");
  return lead + t + trail;
}

const BLOCK = /(<\/?(?:p|h[1-6]|li|ul|ol|div|section|article|header|footer|table|thead|tbody|tfoot|tr|td|th|blockquote|pre|hr|br)\b[^>]*>)/i;

/** HTML: la struttura a blocchi resta intatta e ogni blocco si traduce come frase intera, con i tag in linea al loro posto. */
async function htmlViaMyMemory(html, to, cache) {
  const parts = String(html).split(BLOCK);
  const out = [];
  for (let i = 0; i < parts.length; i++) out.push(i % 2 === 1 || !parts[i].trim() ? parts[i] : await translateInline(parts[i], to, cache));
  return out.join("");
}

async function viaMyMemory(fields, htmlKeys) {
  const res = { en: {}, fr: {}, de: {} };
  const cache = new Map();
  for (const to of Object.keys(TARGETS)) {
    for (const [key, value] of Object.entries(fields)) {
      res[to][key] = htmlKeys.includes(key) ? await htmlViaMyMemory(value, to, cache) : await plainViaMyMemory(value, to);
    }
  }
  return res;
}

/** fields: { chiave: "testo italiano" } → { en: {chiave}, fr: {chiave}, de: {chiave} }. htmlKeys: chiavi il cui valore è HTML. */
export async function translateFields(fields, htmlKeys = []) {
  const clean = {};
  const html = [];
  for (const [k, v] of Object.entries(fields || {})) {
    const s = typeof v === "string" ? v.trim() : "";
    if (!s) continue;
    const isHtml = htmlKeys.includes(k);
    if (isHtml) html.push(k);
    clean[k] = s.slice(0, isHtml ? MAX_HTML : MAX_FIELD);
  }
  if (!Object.keys(clean).length) throw new Error("Non c'è nessun testo italiano da tradurre.");
  const raw = translatorProvider() === "claude" ? await viaClaude(clean, html) : await viaMyMemory(clean, html);
  const out = {};
  for (const lng of Object.keys(TARGETS)) {
    out[lng] = {};
    for (const k of Object.keys(clean)) out[lng][k] = String(raw?.[lng]?.[k] ?? "").trim();
  }
  return out;
}
