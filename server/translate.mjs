// Traduzione dei testi del pannello admin dall'italiano verso inglese, francese e tedesco.
// Con ANTHROPIC_API_KEY usa Claude (qualità migliore, modello in TRANSLATE_MODEL);
// senza chiave ripiega sul servizio gratuito MyMemory (nessuna configurazione, qualità inferiore e limite giornaliero).

const TARGETS = { en: "English", fr: "French", de: "German" };
const MAX_FIELD = 4000;

export const translatorProvider = () => (process.env.ANTHROPIC_API_KEY ? "claude" : "mymemory");

const decode = (s) => String(s).replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** Claude: una sola richiesta, risposta JSON { en: {campo}, fr: {...}, de: {...} }. */
async function viaClaude(fields) {
  const prompt =
    "Translate the following Italian website fields into English, French and German. " +
    "Keep brand and proper names (Cube Academy, iSAQB®, CPSA-F, LinkedIn, Zoom) unchanged, keep the same tone and meaning, " +
    "preserve line breaks and blank lines between paragraphs, and translate only the values. " +
    'Reply with JSON only, shaped as {"en":{...},"fr":{...},"de":{...}} using the same keys as the input.\n\n' +
    JSON.stringify(fields);
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.TRANSLATE_MODEL || "claude-haiku-5-5", max_tokens: 4096, messages: [{ role: "user", content: prompt }] }),
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
    throw new Error("Limite giornaliero del servizio gratuito raggiunto: riprova domani o imposta ANTHROPIC_API_KEY.");
  }
  if (!r.ok || Number(j.responseStatus) !== 200) throw new Error("Servizio di traduzione non disponibile.");
  return decode(j.responseData.translatedText);
}

async function viaMyMemory(fields) {
  const res = { en: {}, fr: {}, de: {} };
  for (const to of Object.keys(TARGETS)) {
    for (const [key, value] of Object.entries(fields)) {
      const paragraphs = String(value).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
      const out = [];
      for (const p of paragraphs) {
        const parts = [];
        for (const c of chunks(p)) parts.push(await myMemory(c, to));
        out.push(parts.join(" "));
      }
      res[to][key] = out.join("\n\n");
    }
  }
  return res;
}

/** fields: { chiave: "testo italiano" } → { en: {chiave}, fr: {chiave}, de: {chiave} } */
export async function translateFields(fields) {
  const clean = {};
  for (const [k, v] of Object.entries(fields || {})) {
    const s = typeof v === "string" ? v.trim() : "";
    if (s) clean[k] = s.slice(0, MAX_FIELD);
  }
  if (!Object.keys(clean).length) throw new Error("Non c'è nessun testo italiano da tradurre.");
  const raw = translatorProvider() === "claude" ? await viaClaude(clean) : await viaMyMemory(clean);
  const out = {};
  for (const lng of Object.keys(TARGETS)) {
    out[lng] = {};
    for (const k of Object.keys(clean)) out[lng][k] = String(raw?.[lng]?.[k] ?? "").trim();
  }
  return out;
}
