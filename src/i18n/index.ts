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

export const LOCALES: Record<Lang, string> = { it: "it-IT", en: "en-GB", fr: "fr-FR", de: "de-DE" };
const DICTS: Record<Lang, Record<string, string>> = { it: {}, en, fr, de };

/* La lingua sta nell'indirizzo: l'italiano è senza prefisso (/corsi), le altre hanno /en, /fr, /de (/en/corsi).
   Così ogni lingua ha pagine proprie che i motori di ricerca possono indicizzare. */
const PREFIX = /^\/(en|fr|de)(?=\/|$)/;

export const langFromPath = (path: string): Lang => (PREFIX.exec(path)?.[1] as Lang | undefined) ?? "it";
/** Percorso senza il prefisso di lingua: /en/corsi → /corsi */
export const stripLang = (path: string) => path.replace(PREFIX, "") || "/";

// indirizzi che non hanno versioni per lingua: pannello admin, API, ritorni di pagamento, file statici
const NO_LANG = /^\/(api|pagamento|_next|admin)(\/|$|\?|#)/;
const IS_FILE = /\.[a-z0-9]{2,5}($|[?#])/i;

/** Aggiunge il prefisso di lingua a un indirizzo interno (idempotente). */
export function withLang(href: string, l: Lang = lang): string {
  if (!href.startsWith("/") || href.startsWith("//") || NO_LANG.test(href) || IS_FILE.test(href) || PREFIX.test(href) || l === "it") return href;
  const i = href.search(/[?#]/);
  const path = i < 0 ? href : href.slice(0, i);
  return `/${l}${path === "/" ? "" : path}${i < 0 ? "" : href.slice(i)}`;
}

export const lang: Lang = typeof location !== "undefined" ? langFromPath(location.pathname) : "it";
export const locale = LOCALES[lang];
if (typeof document !== "undefined") document.documentElement.lang = lang;

/** Cambia lingua aprendo la stessa pagina nella lingua scelta (il testo si legge all'avvio, quindi si ricarica). */
export function setLang(next: Lang) {
  const { pathname, search, hash } = window.location;
  window.location.assign(withLang(stripLang(pathname) + search + hash, next));
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
