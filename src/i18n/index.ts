/* Traduzioni del sito pubblico (IT · EN · FR · DE). Il pannello #/admin resta in italiano.
   Le chiavi sono i testi italiani: t("testo") restituisce la traduzione nella lingua corrente o,
   se manca, il testo italiano. La lingua si legge una volta all'avvio: cambiarla ricarica la pagina,
   così anche le costanti a livello di modulo (data.ts) nascono già tradotte. */

import { en } from "./en";
import { fr } from "./fr";
import { de } from "./de";

export type Lang = "it" | "en" | "fr" | "de";
export const LANGS: { code: Lang; label: string; name: string }[] = [
  { code: "it", label: "IT", name: "Italiano" },
  { code: "en", label: "EN", name: "English" },
  { code: "fr", label: "FR", name: "Français" },
  { code: "de", label: "DE", name: "Deutsch" },
];

const STORAGE_KEY = "cube-academy-lang";
const LOCALES: Record<Lang, string> = { it: "it-IT", en: "en-GB", fr: "fr-FR", de: "de-DE" };
const DICTS: Record<Lang, Record<string, string>> = { it: {}, en, fr, de };

function detect(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in DICTS) return saved as Lang;
  } catch { /* storage non disponibile */ }
  const nav = (typeof navigator !== "undefined" ? navigator.language : "it").slice(0, 2).toLowerCase();
  return nav in DICTS ? (nav as Lang) : "it";
}

export const lang: Lang = detect();
export const locale = LOCALES[lang];
if (typeof document !== "undefined") document.documentElement.lang = lang;

export function setLang(next: Lang) {
  try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignora */ }
  window.location.reload();
}

/** Traduce un testo italiano. `vars` sostituisce i segnaposto {nome}. */
export function t(text: string, vars?: Record<string, string | number>): string {
  let out = DICTS[lang][text] ?? text;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

/** Testo di una colonna multilingua del database (es. luogo_it/luogo_en), con ripiego sull'italiano. */
export function pick(row: Record<string, unknown>, field: string): string {
  const v = row[`${field}_${lang}`];
  if (typeof v === "string" && v.trim()) return v;
  const it = row[`${field}_it`];
  return typeof it === "string" ? it : "";
}
